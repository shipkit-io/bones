import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface BlogImageProps {
	src: string;
	alt: string;
	className?: string;
	priority?: boolean;
	sizes?: string;
}

export const BlogImage = ({
	src,
	alt,
	className,
	priority = false,
	sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: BlogImageProps) => {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-lg mb-6",
				"transition-all duration-300 ease-in-out hover:scale-[1.02]",
				"cursor-pointer shadow-md hover:shadow-xl",
				"border border-border/50 hover:border-border",
				"bg-muted/30",
				className
			)}
		>
			<Image
				src={src}
				alt={alt}
				width={800}
				height={400}
				className="w-full h-auto object-cover transition-transform duration-300 ease-in-out"
				priority={priority}
				sizes={sizes}
			/>
		</div>
	);
};
