import MainLayout from "@/components/layouts/main-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<MainLayout>
			<div className="container grid place-items-center py-header">
				{children}
			</div>
		</MainLayout>
	);
}
