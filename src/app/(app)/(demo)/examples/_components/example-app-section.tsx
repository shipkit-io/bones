import { routes } from "@/config/routes";
import { Section, SectionHeader } from "@/components/primitives/section";
import { BorderBeam } from "@/components/ui/border-beam";
import { ExamplesNav } from "../_components/examples-nav";
import AuthenticationPage from "../authentication/page";
import CardsPage from "../cards/page";
import DashboardPage from "../dashboard/page";
import FormsPage from "../forms/page";
import MailPage from "../mail/page";
import MusicPage from "../music/page";
import PlaygroundPage from "../playground/page";
import TasksPage from "../tasks/page";

export const examples = [
	{
		name: "Mail",
		href: routes.examples.mail,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/mail",
		component: MailPage,
	},
	{
		name: "Dashboard",
		href: routes.examples.dashboard,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/dashboard",
		component: DashboardPage,
	},
	{
		name: "Cards",
		href: routes.examples.cards,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/cards",
		component: CardsPage,
	},
	{
		name: "Tasks",
		href: routes.examples.tasks,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/tasks",
		component: TasksPage,
	},
	{
		name: "Playground",
		href: routes.examples.playground,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/playground",
		component: PlaygroundPage,
	},
	{
		name: "Forms",
		href: routes.examples.forms,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/forms",
		component: FormsPage,
	},
	{
		name: "Music",
		href: routes.examples.music,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/music",
		component: MusicPage,
	},
	{
		name: "Authentication",
		href: routes.examples.authentication,
		code: "https://github.com/shadcn/ui/tree/main/apps/www/app/(app)/examples/authentication",
		component: AuthenticationPage,
	},
];

export const ExampleAppSection = ({
	current,
	className,
}: {
	current?: string;
	className?: string;
}) => {
	if (!current) {
		// Randomly select an example
		const randomIndex = Math.floor(Math.random() * examples.length);
		current = examples[randomIndex]?.name;
	}

	const currentExample = examples.find((example) => example.name === current);

	return (
		<Section className={className}>
			<SectionHeader>Build apps like these</SectionHeader>
			<ExamplesNav current={currentExample?.name} />

			<div className="relative flex max-h-[400px] max-w-full flex-col overflow-hidden rounded-lg border bg-background [mask-image:linear-gradient(to_bottom,white,transparent)] md:shadow-xl">
				{currentExample?.component ? <currentExample.component /> : <MusicPage />}
				<BorderBeam size={250} duration={12} delay={9} />
			</div>
		</Section>
	);
};
