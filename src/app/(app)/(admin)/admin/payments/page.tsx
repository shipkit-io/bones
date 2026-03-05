import type { Metadata } from "next";
import { PaymentFilters } from "@/app/(app)/(admin)/admin/payments/_components/payment-filters";
import {
	PageHeader,
	PageHeaderDescription,
	PageHeaderHeading,
} from "@/components/primitives/page-header";
import { DataTable } from "@/components/ui/data-table/data-table";
import { constructMetadata } from "@/config/metadata";
import { PaymentService } from "@/server/services/payment-service";
import { columns } from "./_components/columns";
import { ImportPayments } from "./_components/import-payments";

export const metadata: Metadata = constructMetadata({
	title: "Payment Management",
	description: "View and manage all payments from payment processors.",
	noIndex: true,
});

export interface PaymentsPageProps {
	searchParams: Promise<{
		filter?: string;
	}>;
}

/**
 * Admin payments page component that displays a data table of all payments
 * with support for filtering between free and paid products
 */
export default async function PaymentsPage({
	searchParams: searchParamsPromise,
}: PaymentsPageProps) {
	// Get payments from the payment service (which handles all payment processors)
	const payments = await PaymentService.getPaymentsWithUsers();
	const searchParams = await searchParamsPromise;
	// Filter payments based on the filter parameter
	const filterType = searchParams.filter || "all";

	const filteredPayments = payments.filter((payment) => {
		// Default is to show all payments
		if (filterType === "all") return true;

		// Show only free products (marked as free)
		if (filterType === "free") return payment.isFreeProduct === true;

		// Show only paid products (amount > 0)
		if (filterType === "paid") return payment.amount > 0;

		// Show only products discounted to $0 (amount is 0 but not marked as a free product)
		if (filterType === "discounted") return payment.amount === 0 && payment.isFreeProduct === false;

		return true;
	});

	return (
		<>
			<div className="flex justify-between items-center mb-6">
				<PageHeader>
					<PageHeaderHeading>Payment Management</PageHeaderHeading>
					<PageHeaderDescription>
						View and manage all payments from Lemon Squeezy and Polar.
					</PageHeaderDescription>
				</PageHeader>
				<div className="flex items-center gap-2">
					<PaymentFilters />
					<ImportPayments />
				</div>
			</div>
			<DataTable columns={columns} data={filteredPayments} searchPlaceholder="Search payments..." />
		</>
	);
}
