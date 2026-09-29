import { useSession } from "@/lib/auth/use-session";

export const useIsAdmin = () => {
  const { data: session } = useSession();
  return session?.user?.isAdmin ?? false;
};
