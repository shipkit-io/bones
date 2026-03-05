import { redirect } from "next/navigation";
import type React from "react";
import { Suspense } from "react";
import { Header } from "@/components/headers/header";
import { SuspenseFallback } from "@/components/primitives/suspense-fallback";
import { routes } from "@/config/routes";
import { auth } from "@/server/auth";
import { isAdmin } from "@/server/services/admin-service";

const navLinks = [
	{ href: routes.admin.users, label: "Users" },
	{ href: routes.admin.github, label: "GitHub" },
	{ href: routes.admin.integrations, label: "Integrations" },
	{ href: routes.admin.feedback, label: "Feedback" },
	{ href: routes.admin.payments, label: "Payments" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();
	const userIsAdmin =
		session && "user" in session ? await isAdmin({ email: session?.user?.email }) : false;

	if (!userIsAdmin) {
		console.warn(
			"User is not an admin, redirecting to home",
			session && "user" in session ? session?.user?.email : "no user"
		);
		redirect(routes.home);
	}

	return (
		<div className="min-h-screen">
			<Suspense fallback={<SuspenseFallback />}>
				<Header navLinks={navLinks} variant="sticky" />
			</Suspense>
			<div className="container mx-auto flex-1 py-6 md:py-10">{children}</div>
		</div>
	);
}
