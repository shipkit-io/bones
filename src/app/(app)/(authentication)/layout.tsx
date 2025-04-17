import { Footer } from "@/components/footers/footer";
import MainLayout from "@/components/layouts/main-layout";
import { Section } from "@/components/primitives/section";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MainLayout className="min-h-screen flex flex-col" footer={null}>
        <Section className="grow">{children}</Section>
      </MainLayout>
      <Footer />
    </>
  );
}
