"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingBar } from "@/components/ui/loading-bar";
import { SuspenseBoundary } from "@/components/ui/suspense-boundary";
import { createAudioContext, setupAudioAnalyser } from "@/lib/utils/audio";
import { useWebGPUAvailability } from "@/lib/utils/webgpu";
import { Loader2, Mic, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
	interface Window {
		webkitAudioContext: typeof AudioContext;
	}
}

const WHISPER_WORKER_URL = "./whisper/worker.js";
const WHISPER_SAMPLING_RATE = 16000;
const MAX_SAMPLES = 480000;

interface WorkerMessage {
	status: "ready" | "update" | "complete" | "error";
	output?: string;
	data?: {
		error?: string;
	};
}

interface AudioVisualizerProps {
	stream: MediaStream | null;
	simulate?: boolean;
}

function AudioVisualizer({ stream, simulate = false }: AudioVisualizerProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const animationFrameRef = useRef<number>(0);
	const isAnimating = useRef<boolean>(false);
	const contextRef = useRef<CanvasRenderingContext2D | null>(null);
	const frameStateRef = useRef<{ id: number }>({ id: 0 });

	const [dimensions] = useState<{ width: number; height: number }>({ width: 300, height: 100 });

	const requestFrame = useCallback((callback: FrameRequestCallback): number => {
		if (typeof window === 'undefined') {
			return 0;
		}
		const id = window.requestAnimationFrame(callback);
		frameStateRef.current.id = id;
		return id;
	}, []);

	const cancelFrame = useCallback((frameId: number) => {
		if (typeof window !== 'undefined' && frameId !== 0) {
			window.cancelAnimationFrame(frameId);
			frameStateRef.current.id = 0;
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return undefined;

		const canvas = canvasRef.current;
		if (!canvas) return undefined;

		const ctx = canvas.getContext("2d");
		if (!ctx) return undefined;

		contextRef.current = ctx;

		const setupAudio = async () => {
			if (stream) {
				try {
					const context = createAudioContext();
					if (!context) return;

					audioContextRef.current = context;
					const analyser = setupAudioAnalyser(context, stream);
					if (!analyser) return;

					analyserRef.current = analyser;
				} catch (error) {
					console.error("Failed to setup audio context:", error);
				}
			}
		};

		const drawVisualization = (
			context: CanvasRenderingContext2D,
			width: number,
			height: number,
			analyser: AnalyserNode | null,
			isSimulated: boolean
		): void => {
			context.clearRect(0, 0, width, height);
			context.fillStyle = "#020817";
			context.fillRect(0, 0, width, height);

			if (analyser && !isSimulated) {
				const bufferLength = analyser.frequencyBinCount;
				const dataArray = new Uint8Array(bufferLength);
				analyser.getByteFrequencyData(dataArray);

				const barWidth = width / bufferLength;
				let x = 0;

				for (let i = 0; i < bufferLength; i++) {
					const value = dataArray[i];
					if (typeof value === 'undefined') continue;

					const barHeight = (value / 255) * height;
					context.fillStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
					context.fillRect(x, height - barHeight, barWidth, barHeight);
					x += barWidth;
				}
			} else {
				// Simulate audio visualization
				const time = Date.now() / 1000;
				const numBars = 50;
				const barWidth = width / numBars;

				for (let i = 0; i < numBars; i++) {
					const noise = Math.sin(time * 2 + i * 0.1) * 0.5 + 0.5;
					const barHeight = noise * height * 0.8;
					context.fillStyle = `hsl(${(i / numBars) * 360}, 100%, 50%)`;
					context.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
				}
			}
		};

		const animate = (time: DOMHighResTimeStamp): void => {
			const currentContext = contextRef.current;
			if (!currentContext || !isAnimating.current) return;

			drawVisualization(
				currentContext,
				dimensions.width,
				dimensions.height,
				analyserRef.current,
				simulate
			);
			requestFrame(animate);
		};

		isAnimating.current = true;
		void setupAudio();
		requestFrame(animate);

		return () => {
			isAnimating.current = false;
			if (frameStateRef.current.id !== 0) {
				cancelFrame(frameStateRef.current.id);
			}
			if (audioContextRef.current) {
				void audioContextRef.current.close();
			}
			contextRef.current = null;
		};
	}, [stream, simulate, dimensions, requestFrame, cancelFrame]);

	return (
		<canvas
			ref={canvasRef}
			width={dimensions.width}
			height={dimensions.height}
			className="w-full rounded-lg bg-background"
		/>
	);
}

export function AIVoiceDemo() {
	const isWebGPUAvailable = useWebGPUAvailability();
	const [isRecording, setIsRecording] = useState(false);
	const [transcript, setTranscript] = useState("");
	const [currentStream, setCurrentStream] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [hasAcceptedPermissions, setHasAcceptedPermissions] = useState(false);
	const [isLoadingModel, setIsLoadingModel] = useState(false);
	const worker = useRef<Worker | null>(null);
	const mediaRecorder = useRef<MediaRecorder | null>(null);
	const audioChunks = useRef<Blob[]>([]);
	const audioContextRef = useRef<AudioContext | null>(null);

	const initializeWorker = useCallback(async () => {
		try {
			if (!worker.current && hasAcceptedPermissions) {
				setIsLoadingModel(true);
				worker.current = new Worker(
					new URL(WHISPER_WORKER_URL, import.meta.url),
				);

				worker.current.postMessage({ type: "load" });

				const messageHandler = (e: MessageEvent<WorkerMessage>) => {
					const { status, output, data } = e.data;

					switch (status) {
						case "ready":
							setIsReady(true);
							setIsProcessing(false);
							setIsLoadingModel(false);
							break;

						case "update":
							if (output) {
								setCurrentStream(prev => prev + output);
							}
							break;

						case "complete":
							setIsProcessing(false);
							break;

						case "error":
							console.error("Worker error:", e.data);
							throw new Error(data?.error || "An error occurred while processing your request.");
					}
				};

				worker.current.addEventListener("message", messageHandler);

				return () => {
					const currentWorker = worker.current;
					if (currentWorker) {
						currentWorker.removeEventListener("message", messageHandler);
						if (!hasAcceptedPermissions) {
							currentWorker.terminate();
							worker.current = null;
						}
					}
				};
			}
		} catch (error) {
			console.error("Worker initialization error:", error);
			setError(error instanceof Error ? error.message : "Failed to initialize voice recognition");
			setIsLoadingModel(false);
			throw error;
		}
	}, [hasAcceptedPermissions]);

	useEffect(() => {
		void initializeWorker();
	}, [initializeWorker]);

	useEffect(() => {
		if (currentStream && !isProcessing) {
			setTranscript(prev => {
				const newTranscript = prev ? `${prev}\n${currentStream}` : currentStream;
				return newTranscript;
			});
			setCurrentStream(""); // Reset for next stream
		}
	}, [currentStream, isProcessing]);

	useEffect(() => {
		if (mediaRecorder.current || !hasAcceptedPermissions) return;

		if (navigator?.mediaDevices?.getUserMedia) {
			void navigator.mediaDevices
				.getUserMedia({ audio: true })
				.then((mediaStream: MediaStream) => {
					setStream(mediaStream);

					mediaRecorder.current = new MediaRecorder(mediaStream);
					audioContextRef.current = new AudioContext({
						sampleRate: WHISPER_SAMPLING_RATE,
					});

					mediaRecorder.current.onstart = () => {
						setIsRecording(true);
						audioChunks.current = [];
					};

					mediaRecorder.current.ondataavailable = (e) => {
						if (e.data.size > 0) {
							audioChunks.current.push(e.data);
						} else {
							// Empty chunk received, request new data after a short timeout
							setTimeout(() => {
								mediaRecorder.current?.requestData();
							}, 25);
						}
					};

					mediaRecorder.current.onstop = async () => {
						setIsRecording(false);
						if (!audioContextRef.current) return;

						const blob = new Blob(audioChunks.current, { type: mediaRecorder.current?.mimeType });
						const arrayBuffer = await blob.arrayBuffer();
						const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
						let audio = audioBuffer.getChannelData(0);

						if (audio.length > MAX_SAMPLES) {
							// Get last MAX_SAMPLES
							audio = audio.slice(-MAX_SAMPLES);
						}

						if (worker.current) {
							setIsProcessing(true);
							worker.current.postMessage({
								type: "generate",
								data: {
									audio,
									language: "en"
								}
							});
						}
					};
				})
				.catch(err => {
					console.error("Error accessing microphone:", err);
					setError("Failed to access microphone. Please ensure you have granted permission.");
				});
		} else {
			setError("Voice recognition is not supported in your browser.");
		}

		return () => {
			mediaRecorder.current?.stop();
			mediaRecorder.current = null;
		};
	}, [hasAcceptedPermissions]);

	const startRecording = async () => {
		if (!isWebGPUAvailable) {
			setError("Your browser does not support WebGPU, which is required for voice recognition.");
			return;
		}

		try {
			mediaRecorder.current?.start();
			setIsRecording(true);
			setError(null);
		} catch (err) {
			console.error("Error starting recording:", err);
			setError("Failed to start recording. Please try again.");
		}
	};

	const stopRecording = () => {
		if (mediaRecorder.current && isRecording) {
			mediaRecorder.current.stop();
			setIsRecording(false);
		}
	};

	if (!isWebGPUAvailable) {
		return (
			<Card className="w-full max-w-2xl p-4 md:p-6">
				<div className="space-y-4 text-center">
					<h2 className="text-lg font-semibold">Browser Not Supported</h2>
					<p className="text-sm text-muted-foreground">
						Your browser doesn't support WebGPU, which is required for voice recognition.
						Please try using Chrome Canary or another WebGPU-enabled browser.
					</p>
				</div>
			</Card>
		);
	}

	if (!hasAcceptedPermissions) {
		return (
			<Card className="w-full max-w-2xl p-4 md:p-6">
				<div className="space-y-6">
					<div className="space-y-2">
						<h2 className="text-lg font-semibold">AI Voice Demo</h2>
						<p className="text-sm text-muted-foreground">
							Convert speech to text using AI that runs entirely in your browser. No servers, no data collection.
						</p>
					</div>

					<div className="relative rounded-lg border bg-background p-2">
						<AudioVisualizer simulate={true} stream={null} />
						<div className="absolute inset-0 flex items-center justify-center">
							<Mic className="h-8 w-8 text-muted-foreground/50" />
						</div>
					</div>

					<div className="flex flex-col space-y-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span className="flex h-6 w-6 items-center justify-center rounded-full border">1</span>
							<span>Downloads ~50MB model to your browser</span>
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span className="flex h-6 w-6 items-center justify-center rounded-full border">2</span>
							<span>Runs 100% locally - complete privacy</span>
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<span className="flex h-6 w-6 items-center justify-center rounded-full border">3</span>
							<span>Works offline once loaded</span>
						</div>
					</div>

					<Button
						className="w-full"
						onClick={() => setHasAcceptedPermissions(true)}
					>
						Download & Run Live
					</Button>
				</div>
			</Card>
		);
	}

	if (isLoadingModel) {
		return (
			<>
				<LoadingBar />
				<Card className="w-full max-w-2xl p-4 md:p-6">
					<div className="flex flex-col items-center justify-center space-y-4">
						<div className="space-y-2 text-center">
							<h2 className="text-lg font-semibold">Loading AI Model</h2>
							<p className="text-sm text-muted-foreground">
								Downloading and initializing the voice recognition model.
								This may take a moment...
							</p>
						</div>
					</div>
				</Card>
			</>
		);
	}

	return (
		<SuspenseBoundary onRetry={() => setError(null)}>
			<Card className="w-full max-w-2xl p-4 md:p-6">
				<div className="space-y-4">
					<div className="flex flex-col items-center gap-4">
						<AudioVisualizer
							stream={stream}
							simulate={!!error || (!isReady && !stream)}
						/>
						<Button
							size="lg"
							variant={isRecording ? "destructive" : "default"}
							onClick={isRecording ? stopRecording : startRecording}
							disabled={!isReady || isProcessing}
							className="h-16 w-16 rounded-full p-4"
						>
							{isProcessing ? (
								<Loader2 className="h-8 w-8 animate-spin" />
							) : isRecording ? (
								<Square className="h-8 w-8" />
							) : (
								<Mic className="h-8 w-8" />
							)}
						</Button>
					</div>

					{error && (
						<div className="text-sm text-red-500">{error}</div>
					)}

					{(transcript || currentStream) && (
						<div className="mt-4 rounded-lg bg-muted p-4">
							<p className="whitespace-pre-wrap text-sm">
								{transcript}
								{currentStream && (
									<>
										{transcript && "\n"}
										{currentStream}
									</>
								)}
							</p>
						</div>
					)}

					{!isReady && !error && (
						<div className="text-center text-sm text-muted-foreground">
							Loading voice recognition model...
						</div>
					)}
				</div>
			</Card>
		</SuspenseBoundary>
	);
}
