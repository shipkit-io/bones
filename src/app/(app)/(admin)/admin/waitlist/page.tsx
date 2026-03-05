import type { Metadata } from "next";
import { Suspense } from "react";
import { constructMetadata } from "@/config/metadata";
import { WaitlistAdmin } from "./_components/waitlist-admin";

export const metadata: Metadata = constructMetadata({
	title: "Waitlist Management",
	description: "View and manage waitlist entries and analytics.",
	noIndex: true,
});

export default function AdminWaitlistPage() {
	return (
		<div className="container mx-auto py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Waitlist Management</h1>
				<p className="text-muted-foreground">View and manage waitlist entries for Shipkit</p>
			</div>

			<Suspense fallback={<div>Loading waitlist data...</div>}>
				<WaitlistAdmin />
			</Suspense>
		</div>
	);
}
