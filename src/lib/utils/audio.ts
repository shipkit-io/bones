declare global {
	interface Window {
		webkitAudioContext: typeof AudioContext;
	}
}

export function createAudioContext(): AudioContext | undefined {
	if (typeof window === "undefined") return undefined;
	const AudioContextClass = window.AudioContext || window.webkitAudioContext;
	return new AudioContextClass();
}

export function setupAudioAnalyser(
	context: AudioContext,
	stream: MediaStream
): AnalyserNode | undefined {
	try {
		const analyser = context.createAnalyser();
		const source = context.createMediaStreamSource(stream);
		source.connect(analyser);
		analyser.connect(context.destination);
		return analyser;
	} catch (error) {
		console.error("Failed to setup audio analyser:", error);
		return undefined;
	}
}
