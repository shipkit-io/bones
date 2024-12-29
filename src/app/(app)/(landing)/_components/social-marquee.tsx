import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Marquee from "@/components/ui/marquee";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const reviews = [
	{
		name: "Sarah Chen",
		username: "@sarahchen",
		role: "Senior Developer",
		company: "Vercel",
		body: `${siteConfig.name} saved us months of setup time. The authentication and API routes are production-ready out of the box.`,
		img: "https://avatar.vercel.sh/sarahchen",
		verified: true,
	},
	{
		name: "Alex Rivera",
		username: "@arivera",
		role: "Founder",
		company: "TechStart",
		body: "The developer experience is unmatched. From the CLI tools to the VS Code integration, everything just works.",
		img: "https://avatar.vercel.sh/arivera",
		verified: true,
	},
	{
		name: "Michael Park",
		username: "@mpark",
		role: "Tech Lead",
		company: "ScaleAI",
		body: `We migrated from a custom solution to ${siteConfig.name} and immediately saw improvements in our development velocity.`,
		img: "https://avatar.vercel.sh/mpark",
		verified: true,
	},
	{
		name: "Emma Lewis",
		username: "@emmadev",
		role: "Full Stack Developer",
		company: "Freelance",
		body: "The AI workflows and Builder.io integration are game-changers for rapid prototyping.",
		img: "https://avatar.vercel.sh/emmadev",
		verified: true,
	},
	{
		name: "David Kumar",
		username: "@dkumar",
		role: "CTO",
		company: "StartupX",
		body: "Type safety everywhere, great documentation, and excellent support. Worth every penny.",
		img: "https://avatar.vercel.sh/dkumar",
		verified: true,
	},
	{
		name: "Lisa Wang",
		username: "@lwang",
		role: "Product Engineer",
		company: "Series A Startup",
		body: "The pre-built components and animations saved us countless hours of development time.",
		img: "https://avatar.vercel.sh/lwang",
		verified: true,
	},
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
	img,
	name,
	username,
	role,
	company,
	body,
	verified,
}: {
	img: string;
	name: string;
	username: string;
	role: string;
	company: string;
	body: string;
	verified?: boolean;
}) => {
	return (
		<figure
			className={cn(
				"relative w-80 cursor-pointer overflow-hidden rounded-xl border p-4",
				"transform-gpu transition-all duration-300 ease-out hover:scale-[1.02]",
				// light styles
				"border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
				// dark styles
				"dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
			)}
		>
			<div className="flex flex-row items-start justify-between">
				<div className="flex items-center gap-3">
					<Avatar>
						<AvatarImage src={img} alt={name} />
						<AvatarFallback>{name[0]}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<div className="flex items-center gap-2">
							<figcaption className="text-sm font-medium dark:text-white">
								{name}
							</figcaption>
							{verified && (
								<Badge variant="secondary" className="h-5 px-1">
									Verified
								</Badge>
							)}
						</div>
						<p className="text-xs font-medium text-muted-foreground">
							{role} at {company}
						</p>
						<p className="text-xs font-medium dark:text-white/40">{username}</p>
					</div>
				</div>
			</div>
			<blockquote className="mt-4 text-sm leading-relaxed">{body}</blockquote>
		</figure>
	);
};

export function SocialMarquee() {
	return (
		<div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg border bg-background md:shadow-xl">
			<Marquee pauseOnHover className="[--duration:40s]">
				{firstRow.map((review) => (
					<ReviewCard key={review.username} {...review} />
				))}
			</Marquee>
			<Marquee reverse pauseOnHover className="[--duration:35s]">
				{secondRow.map((review) => (
					<ReviewCard key={review.username} {...review} />
				))}
			</Marquee>
			<div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background" />
			<div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background" />
		</div>
	);
}
