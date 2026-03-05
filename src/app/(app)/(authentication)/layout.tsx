import MainLayout from "@/components/layouts/main-layout";
import { Section } from "@/components/primitives/section";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<MainLayout className="flex flex-col" header={false}>
				<Section className="grow min-h-screen">{children}</Section>
			</MainLayout>
		</>
	);
}
