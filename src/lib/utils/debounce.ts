export function restArguments<F extends (...args: unknown[]) => unknown>(
	func: F,
	startIndex: number = func.length - 1
) {
	return function (this: unknown, ...args: unknown[]) {
		const length = Math.max(args.length - startIndex, 0);
		const rest = Array(length);
		let index = 0;
		for (; index < length; index += 1) {
			rest[index] = args[index + startIndex];
		}
		switch (startIndex) {
			case 0:
				return func.call(this, rest);
			case 1:
				return func.call(this, args[0], rest);
			case 2:
				return func.call(this, args[0], args[1], rest);
			default: {
				const _args = Array(startIndex + 1);
				for (index = 0; index < startIndex; index += 1) {
					_args[index] = args[index];
				}
				_args[startIndex] = rest;
				return func.apply(this, _args);
			}
		}
	};
}

export function debounce<T extends unknown[], R>(
	func: (...args: T) => R,
	wait: number,
	immediate?: boolean
) {
	let timeout: NodeJS.Timeout | null;
	let previous: number;
	let args: T | undefined;
	let result: R | undefined;
	let context: unknown;

	const now = () => Date.now();

	const later = function () {
		const passed = now() - previous;
		if (wait > passed) {
			timeout = setTimeout(later, wait - passed);
		} else {
			timeout = null;
			if (!immediate) {
				result = func.apply(context, args!);
			}
			if (!timeout) {
				args = undefined;
				context = undefined;
			}
		}
	};

	const debounced = restArguments(function (this: unknown, _args: unknown) {
		context = this;
		args = _args as T;
		previous = now();
		if (!timeout) {
			timeout = setTimeout(later, wait);
			if (immediate) {
				result = func.apply(context, args);
			}
		}
		return result;
	});

	(debounced as typeof debounced & { cancel: () => void }).cancel = function () {
		if (timeout) clearTimeout(timeout);
		timeout = null;
		args = undefined;
		context = undefined;
	};

	return debounced as typeof debounced & { cancel: () => void };
}
