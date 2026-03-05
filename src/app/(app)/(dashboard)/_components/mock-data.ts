import {
	AlertCircle,
	Box,
	Download,
	GitBranch,
	GitPullRequest,
	type LucideIcon,
	Star,
} from "lucide-react";

export const activityIcons: Record<string, LucideIcon> = {
	download: Download,
	star: Star,
	fork: GitBranch,
	issue: AlertCircle,
	pr: GitPullRequest,
	release: Box,
};
