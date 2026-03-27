import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GithubVersionBadgeProps {
  owner: string;
  repo: string;
  className?: string;
}

async function getLatestVersion(owner: string, repo: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { tag_name?: string };
    return data.tag_name || null;
  } catch {
    return null;
  }
}

export async function GithubVersionBadge({ owner, repo, className }: GithubVersionBadgeProps) {
  const version = await getLatestVersion(owner, repo);
  if (!version) return null;

  return (
    <Badge variant="outline" className={cn("font-mono", className)}>
      {version}
    </Badge>
  );
}
