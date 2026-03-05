import { AILandingDemo } from "./ai-landing-demo";
import { AIVoiceDemo } from "./ai-voice-demo";

export function AIDemosLocal() {
	return (
		<div className="mx-auto grid w-full max-w-7xl gap-6 px-4 md:grid-cols-2 lg:px-8">
			<div>
				<h2 className="mb-4 text-center text-xl font-semibold">Chat with AI</h2>
				<AILandingDemo />
			</div>
			<div>
				<h2 className="mb-4 text-center text-xl font-semibold">Voice Recognition</h2>
				<AIVoiceDemo />
			</div>
		</div>
	);
}
