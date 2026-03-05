import { atom, useAtom } from "jotai";

import { type Mail, mails } from "@/app/(app)/(demo)/examples/mail/data";

type Config = {
	selected: Mail["id"] | null;
};

const configAtom = atom<Config>({
	selected: mails?.[0]?.id || null,
});

export function useMail() {
	return useAtom(configAtom);
}
