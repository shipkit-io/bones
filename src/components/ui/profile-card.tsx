import { ExternalLink, Link as LinkIcon, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site-config";

interface ProfileCardProps {
	name?: string;
	role?: string;
	avatar?: string;
	location?: string;
	email?: string;
	website?: string;
	bio?: string;
}

const defaultProfile = {
	name: siteConfig.creator.fullName,
	role: siteConfig.creator.role,
	avatar: siteConfig.creator.avatar,
	location: siteConfig.creator.location,
	email: siteConfig.creator.email,
	website: siteConfig.creator.url,
	bio: siteConfig.creator.bio,
} satisfies Required<ProfileCardProps>;

export function ProfileCard({
	name = defaultProfile.name,
	role = defaultProfile.role,
	avatar = defaultProfile.avatar,
	location = defaultProfile.location,
	email = defaultProfile.email,
	website = defaultProfile.website,
	bio = defaultProfile.bio,
}: Partial<ProfileCardProps> = defaultProfile) {
	return (
		<div className="mx-auto w-full max-w-md">
			<div className="rounded-2xl border border-zinc-200 bg-white/50 p-6 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
				<div className="flex items-start gap-5">
					<Image
						src={avatar}
						alt={name}
						width={80}
						height={80}
						className="rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
					/>
					<div className="min-w-0 flex-1">
						<div className="flex items-center justify-between gap-2">
							<div>
								<h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{name}</h2>
								<p className="text-sm text-zinc-500 dark:text-zinc-400">{role}</p>
							</div>
							<Button variant="outline" size="sm" asChild>
								<a href={`mailto:${email}`}>
									<Mail className="h-4 w-4" />
								</a>
							</Button>
						</div>

						<div className="mt-4 space-y-2">
							<div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
								<MapPin className="h-4 w-4" />
								{location}
							</div>
							<div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
								<Mail className="h-4 w-4" />
								<a
									href={`mailto:${email}`}
									className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
								>
									{email}
								</a>
							</div>
							<div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
								<LinkIcon className="h-4 w-4" />
								<a
									href={website.includes("http") ? website : `https://${website}`}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-1 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
								>
									{website.replace("http://", "").replace("https://", "")}
									<ExternalLink className="h-3 w-3" />
								</a>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-6">
					<p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{bio}</p>
				</div>
			</div>
		</div>
	);
}
