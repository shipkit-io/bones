"use client";

import { AIDemosLocal } from "@/app/(app)/landing/_components/ai-demos-local";
import { TabsContent } from "@/components/ui/tabs";
import { TabsTrigger } from "@/components/ui/tabs";
import { TabsList } from "@/components/ui/tabs";
import { Cpu } from "lucide-react";
import { Section, SectionCopy, SectionHeader } from "@/components/primitives/section";
import { siteConfig } from "@/config/site-config";
import { SectionBadge } from "@/components/primitives/section";
import { IconRobotFace } from "@tabler/icons-react";
import { Tabs } from "@/components/ui/tabs";
import { Cloud } from "lucide-react";
import { AIDemoCloud } from "@/components/blocks/ai-demo-cloud";
import { useWebGPUAvailability } from "@/lib/utils/webgpu";

export const AiDemoSection = () => {
	const isWebGPUAvailable = useWebGPUAvailability();

	return (
		<Section className="relative">
			<SectionBadge className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
				<IconRobotFace className="h-4 w-4" />
				<span>AI App Demos</span>
			</SectionBadge>
			<SectionHeader>
				Build your own AI apps
			</SectionHeader>
			<SectionCopy>
				See how you can build your own AI apps with {siteConfig.name}.
			</SectionCopy>
			<Tabs defaultValue="cloud" className="w-full max-w-4xl mx-auto">
				{isWebGPUAvailable && (
					<div className="flex justify-center mb-8">
						<TabsList>
							<TabsTrigger value="cloud" className="flex items-center gap-2">
								<Cloud className="h-4 w-4" />
								Cloud AI
							</TabsTrigger>
							<TabsTrigger value="browser" className="flex items-center gap-2">
								<Cpu className="h-4 w-4" />
								Browser AI
							</TabsTrigger>
						</TabsList>
					</div>
				)}

				<TabsContent value="cloud" className="mt-0">
					<AIDemoCloud />
				</TabsContent>

				<TabsContent value="browser" className="mt-0">
					<AIDemosLocal />
				</TabsContent>
			</Tabs>
		</Section>
	);
};