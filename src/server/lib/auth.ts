import { auth } from "@/server/auth";
import { isAdmin } from "@/server/services/admin-service";

export async function getSession(protect = true) {
	const session = await auth({ protect });
	if (!session?.user && protect) {
		throw new Error("Unauthorized");
	}
	return session;
}

export async function requireAdmin() {
	const session = await getSession();
	if (!session?.user?.email || !isAdmin({ email: session.user.email })) {
		throw new Error("Unauthorized: Admin access required");
	}
	return session;
}
