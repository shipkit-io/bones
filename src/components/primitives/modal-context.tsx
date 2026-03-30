"use client";

import { createContext, useContext, type ReactNode } from "react";

const ModalContext = createContext<boolean>(false);

interface ModalProviderProps {
	children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
	return <ModalContext.Provider value={true}>{children}</ModalContext.Provider>;
}

/**
 * Returns true if the component is rendered inside a Modal.
 * Useful for changing navigation behavior (e.g., using router.replace instead of Link).
 */
export function useIsModal() {
	return useContext(ModalContext);
}
