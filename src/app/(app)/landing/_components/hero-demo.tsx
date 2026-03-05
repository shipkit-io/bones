import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play } from "lucide-react";

const tabs = [
    {
        id: "auth",
        label: "Authentication",
        content: {
            title: "Multi-Provider Auth",
            description: "Sign in with Google, GitHub, or any OAuth provider. Role-based access control built-in.",
            video: "/videos/auth-demo.mp4",
            preview: "/previews/auth-preview.png"
        }
    },
    {
        id: "ai",
        label: "AI Features",
        content: {
            title: "Custom GPTs",
            description: "Build AI features in minutes with our pre-built components and OpenAI integration.",
            video: "/videos/ai-demo.mp4",
            preview: "/previews/ai-preview.png"
        }
    },
    {
        id: "payments",
        label: "Payments",
        content: {
            title: "Stripe Integration",
            description: "Accept payments and manage subscriptions with our Stripe integration.",
            video: "/videos/payments-demo.mp4",
            preview: "/previews/payments-preview.png"
        }
    }
];

export const HeroDemo = () => {
    return (
        <Card className="overflow-hidden border-0 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
            <Tabs defaultValue="auth" className="w-full">
                <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-4">
                    <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1">
                        {tabs.map((tab) => (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>
                {tabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                            <div className="flex flex-col justify-center">
                                <h3 className="text-2xl font-semibold mb-4">{tab.content.title}</h3>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    {tab.content.description}
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Play className="h-4 w-4" />
                                        <span>Watch Demo</span>
                                    </div>
                                </div>
                            </div>
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                <img
                                    src={tab.content.preview}
                                    alt={tab.content.title}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </Card>
    );
};
