declare module "react-dom" {
	export function useFormStatus(): {
		pending: boolean;
		data: FormData | null;
		method: string | null;
		action: string | ((formData: FormData) => void | Promise<void>) | null;
	};

	export function useFormState<State, Payload>(
		action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
		initialState: Awaited<State>,
		permalink?: string
	): [state: Awaited<State>, dispatch: (payload: Payload) => void, isPending: boolean];

	export * from "react-dom/index";
}
