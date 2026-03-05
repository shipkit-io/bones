import type { Metadata } from "next";
import { Suspense } from "react";
import { ImportPayments } from "@/app/(app)/(admin)/admin/payments/_components/import-payments";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { DataTable } from "@/components/ui/data-table/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { constructMetadata } from "@/config/metadata";
import { PaymentService } from "@/server/services/payment-service";
import { columns } from "./_components/columns";

export const metadata: Metadata = constructMetadata({
	title: "User Management",
	description: "View and manage all users and their payment status.",
	noIndex: true,
});

function UsersTableSkeleton() {
	// Generate skeleton row IDs
	const skeletonRowIds = Array.from({ length: 3 }, () =>
		Math.random().toString(36).substring(2, 10)
	);

	return (
		<div className="space-y-4">
			<Skeleton className="h-10 w-[250px]" />
			<div className="rounded-md border">
				<div className="p-4">
					<div className="flex items-center justify-between py-4 border-b">
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-64" />
						</div>
						<Skeleton className="h-9 w-64" />
					</div>
					<div className="flex items-center h-12 px-4 border-b">
						<div className="flex-1 flex items-center gap-4">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-24" />
						</div>
					</div>
					{skeletonRowIds.map((id) => (
						<div key={id} className="flex items-center h-16 px-4 border-b">
							<div className="flex-1 flex items-center gap-4">
								<Skeleton className="size-8 rounded-full" />
								<Skeleton className="h-4 w-36" />
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-5 w-20 rounded-full" />
								<Skeleton className="h-5 w-20 rounded-full" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-16" />
								<Skeleton className="h-8 w-28" />
							</div>
						</div>
					))}
					<div className="flex items-center justify-between p-4">
						<Skeleton className="h-10 w-40" />
						<Skeleton className="h-10 w-40" />
					</div>
				</div>
			</div>
		</div>
	);
}

async function UsersTableContent() {
	// Fetch all users with their complete payment history
	const users = await PaymentService.getUsersWithPayments();

	// Make sure purchases are sorted by date (newest first)
	const sortedUsers = users.map((user) => ({
		...user,
		purchases:
			user.purchases?.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime()) || [],
	}));

	return <DataTable columns={columns} data={sortedUsers} searchPlaceholder="Search users..." />;
}

/**
 * Admin page component that displays a data table of users and their payment status
 */
export default function AdminPage() {
	return (
		<>
			<div className="flex justify-between items-center mb-6">
				<PageHeader>
					<PageHeaderHeading>User Management</PageHeaderHeading>
					<PageHeaderDescription>
						View and manage all users in your database. Click on a user to see detailed purchase
						history.
					</PageHeaderDescription>
				</PageHeader>

				<ImportPayments />
			</div>
			<Suspense fallback={<UsersTableSkeleton />}>
				<UsersTableContent />
			</Suspense>
		</>
	);
}
