// @ts-nocheck
'use client';

import dynamic from "next/dynamic";

const AIRealtimeWhisperWebGPU = dynamic(async () => {
	const module = await import('./ai-realtime-whisper');
	return module.AIRealtimeWhisperWebGPU;
}, { ssr: false });

export default function Page() {
	return (
		<>
			<AIRealtimeWhisperWebGPU />
		</>
	);
}

