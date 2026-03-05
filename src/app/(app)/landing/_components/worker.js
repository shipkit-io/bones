// @ts-nocheck
import {
	AutoModelForCausalLM,
	AutoTokenizer,
	InterruptableStoppingCriteria,
	TextStreamer,
} from "@huggingface/transformers";

/**
 * Helper function to perform feature detection for WebGPU
 */
async function check() {
	try {
		if (!navigator?.gpu) {
			throw new Error("WebGPU is not supported (no GPU object found)");
		}
		const adapter = await navigator.gpu.requestAdapter();
		if (!adapter) {
			throw new Error("WebGPU is not supported (no adapter found)");
		}
		return true;
	} catch (e) {
		self.postMessage({
			status: "error",
			data: {
				error: e.toString(),
				type: "webgpu_not_supported",
			},
		});
		return false;
	}
}

/**
 * Module for managing the text generation pipeline
 */
const TextGenerationPipeline = (() => {
	const MODEL_ID = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
	let tokenizer = null;
	let model = null;

	return {
		async getInstance(progress_callback = null) {
			try {
				tokenizer ??= await AutoTokenizer.from_pretrained(MODEL_ID, {
					progress_callback,
				});

				model ??= await AutoModelForCausalLM.from_pretrained(MODEL_ID, {
					dtype: "q4f16",
					device: "webgpu",
					progress_callback,
				});

				return [tokenizer, model];
			} catch (e) {
				self.postMessage({
					status: "error",
					data: {
						error: e.toString(),
						type: "model_load_failed",
					},
				});
				throw e;
			}
		},
	};
})();

const stopping_criteria = new InterruptableStoppingCriteria();

let past_key_values_cache = null;
async function generate(messages) {
	try {
		// Retrieve the text-generation pipeline.
		const [tokenizer, model] = await TextGenerationPipeline.getInstance();

		const inputs = tokenizer.apply_chat_template(messages, {
			add_generation_prompt: true,
			return_dict: true,
		});

		let startTime;
		let numTokens = 0;
		let tps;
		const token_callback_function = (tokens) => {
			startTime ??= performance.now();
			if (numTokens++ > 0) {
				tps = (numTokens / (performance.now() - startTime)) * 1000;
			}
		};

		const callback_function = (output) => {
			self.postMessage({
				status: "update",
				output,
			});
		};

		const streamer = new TextStreamer(tokenizer, {
			skip_prompt: true,
			skip_special_tokens: true,
			callback_function,
			token_callback_function,
		});

		// Tell the main thread we are starting
		self.postMessage({ status: "start" });

		const { past_key_values, sequences } = await model.generate({
			...inputs,
			// Sampling
			do_sample: true,
			repetition_penalty: 1.1,
			top_k: 3,
			temperature: 0.7,
			max_new_tokens: 2048,
			streamer,
			stopping_criteria,
			return_dict_in_generate: true,
		});
		past_key_values_cache = past_key_values;

		const decoded = tokenizer.batch_decode(sequences, {
			skip_special_tokens: true,
		});

		// Send the output back to the main thread
		self.postMessage({
			status: "complete",
			output: decoded,
		});
	} catch (e) {
		self.postMessage({
			status: "error",
			data: {
				error: e.toString(),
				type: "generation_failed",
			},
		});
	}
}

async function load() {
	try {
		// First check WebGPU support
		const isSupported = await check();
		if (!isSupported) return;

		self.postMessage({
			status: "loading",
			data: "Loading model...",
		});

		// Load the pipeline and save it for future use.
		const [tokenizer, model] = await TextGenerationPipeline.getInstance((x) => {
			// We also add a progress callback to the pipeline so that we can
			// track model loading.
			self.postMessage(x);
		});

		self.postMessage({
			status: "loading",
			data: "Compiling shaders and warming up model...",
		});

		// Run model with dummy input to compile shaders
		const inputs = tokenizer("a");
		await model.generate({ ...inputs, max_new_tokens: 1 });
		self.postMessage({ status: "ready" });
	} catch (e) {
		self.postMessage({
			status: "error",
			data: {
				error: e.toString(),
				type: "initialization_failed",
			},
		});
	}
}

// Listen for messages from the main thread
self.addEventListener("message", async (e) => {
	const { type, data } = e.data;

	switch (type) {
		case "check":
			await check();
			break;

		case "load":
			await load();
			break;

		case "generate":
			stopping_criteria.reset();
			await generate(data);
			break;

		case "interrupt":
			stopping_criteria.interrupt();
			break;

		case "reset":
			past_key_values_cache = null;
			stopping_criteria.reset();
			break;
	}
});
