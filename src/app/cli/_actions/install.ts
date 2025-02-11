"use server";

import { spawn } from "node:child_process";

/**
 * Install a component from a registry
 * @see https://ui.shadcn.com/docs/cli
 */
export async function installComponent(
	componentUrl: string,
	options: { overwrite?: boolean } = {}
): Promise<ReadableStream> {
	const controller = new AbortController();
	const { signal } = controller;

	const process = await startProcess(componentUrl, options, signal);
	return process;
}

async function startProcess(
	componentUrl: string,
	options: { overwrite?: boolean },
	signal: AbortSignal
): Promise<ReadableStream> {
	const encoder = new TextEncoder();
	const stream = new TransformStream();
	const writer = stream.writable.getWriter();

	try {
		const command = `npx shadcn-custom add "${componentUrl}"${options.overwrite ? " --overwrite" : ""}`;
		const child = spawn(command, {
			shell: true,
			signal,
		});

		child.stdout.on("data", (data: Buffer) => {
			void writer.write(encoder.encode(data.toString()));
		});

		child.stderr.on("data", (data: Buffer) => {
			void writer.write(encoder.encode(data.toString()));
		});

		await new Promise<void>((resolve, reject) => {
			child.on("error", (error: Error) => {
				reject(error);
			});

			child.on("close", (code: number) => {
				if (code === 0) {
					resolve();
				} else {
					reject(new Error(`Process exited with code ${code}`));
				}
			});
		});

		await writer.close();
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
		await writer.write(encoder.encode(`Error: ${errorMessage}\n`));
		await writer.close();
	}

	return stream.readable;
}
