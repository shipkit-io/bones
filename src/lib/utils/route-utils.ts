import { routes, type RouteObject, type RouteParams } from "@/config/routes";
import type { Route } from "next";

export const getRoutePath = (
	route: Route | RouteObject,
	params: RouteParams = {}
): Route => {
	if (typeof route === "string") {
		return route;
	}

	let path = route.path;
	for (const [key, defaultValue] of Object.entries(route.params ?? {})) {
		const value = Object.prototype.hasOwnProperty.call(params, key)
			? params[key]
			: defaultValue;
		if (value !== null) {
			path = path.replace(`:${key}`, String(value));
		}
	}
	return path;
};

type NestedPaths<T, P extends string = ""> = T extends object
	? {
			[K in keyof T]: T[K] extends object
				? NestedPaths<T[K], `${P}${P extends "" ? "" : "."}${K & string}`>
				: `${P}${P extends "" ? "" : "."}${K & string}`;
		}[keyof T]
	: never;

type RoutePath = NestedPaths<typeof routes>;

export const rx = <T extends RoutePath>(
	path: T,
	params: T extends keyof typeof routes
		? (typeof routes)[T] extends RouteObject
			? Required<(typeof routes)[T]["params"]>
			: never
		: RouteParams = {} as any
): Route => {
	const parts = path?.split(".") ?? [];
	let current: unknown = routes;

	for (const part of parts) {
		if (
			current &&
			typeof current === "object" &&
			part in current &&
			current[part as keyof typeof current] !== undefined
		) {
			current = current[part as keyof typeof current];
		} else {
			throw new Error(`Route not found: ${path}`);
		}
	}

	if (current && typeof current === "object" && "index" in current) {
		return getRoutePath(current.index as RouteObject | string, params);
	}

	return getRoutePath(current as RouteObject | string, params);
};
