"use client";
import { MagicCard } from "@/components/ui/magic-card";

import DotPattern from "@/components/ui/dot-pattern";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import {
  CodeIcon,
  DatabaseIcon,
  KeyIcon,
  MailIcon,
  ServerIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

const features = [
  {
    icon: <ShieldCheckIcon className="h-6 w-6" />,
    title: "Authentication",
    description: "Secure user authentication with Auth.js",
  },
  {
    icon: <DatabaseIcon className="h-6 w-6" />,
    title: "Database",
    description: "PostgreSQL integration for robust data storage",
  },
  {
    icon: <MailIcon className="h-6 w-6" />,
    title: "Email Service",
    description: "Seamless email integration with Resend",
  },
  {
    icon: <ServerIcon className="h-6 w-6" />,
    title: "CMS",
    description: "Flexible content management with Payload CMS",
  },
  {
    icon: <KeyIcon className="h-6 w-6" />,
    title: "API Routes",
    description: "Built-in API routes for backend functionality",
  },
  {
    icon: <CodeIcon className="h-6 w-6" />,
    title: "TypeScript",
    description: "Full TypeScript support for type-safe development",
  },
];

export const SectionFeatures = () => {
  const { theme } = useTheme();

  return (
    <PageHeader className="relative gap-40 py-2xl">
      <div className="container mx-auto px-4">
        <PageHeaderHeading>Features</PageHeaderHeading>
        <PageHeaderDescription>What's Included</PageHeaderDescription>
        <PageHeaderHeading>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <MagicCard
                key={index}
                className="cursor-pointer flex-col items-start justify-start p-6 shadow-lg"
                gradientColor={theme === "dark" ? "#262626" : "#D9D9D955"}
              >
                <div className="mb-4 flex items-center space-x-2">
                  {feature.icon}
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                </div>
                <p className="text-center text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </MagicCard>
            ))}
          </div>
        </PageHeaderHeading>
      </div>

      <DotPattern className="-z-50 [mask-image:radial-gradient(70%_50%_at_center,#ffffff80,transparent)]" />
    </PageHeader>
  );
};
