import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowUpRight,
    Brain,
    Briefcase,
    Building,
    Building2,
    Clock,
    DollarSign,
    Factory,
    GraduationCap,
    Rocket,
    Shield,
    ShoppingBag,
    Stethoscope,
    TrendingUp,
    Users,
    Zap
} from "lucide-react";
import { useState } from "react";

const marketTrends = [
    {
        icon: Brain,
        title: "The AI Gold Rush",
        description: "AI development costs are rising 30% every quarter. Lock in early-mover advantage with our production-ready AI features.",
        metric: "71%",
        metricLabel: "of startups are adding AI features",
        source: "Gartner 2024"
    },
    {
        icon: DollarSign,
        title: "Rising Dev Costs",
        description: "Average developer salaries hit $150k in 2024. Save months of development time and preserve your runway.",
        metric: "$150k",
        metricLabel: "average developer salary",
        source: "Stack Overflow 2024"
    },
    {
        icon: Clock,
        title: "Time to Market",
        description: "Launch in days instead of months. Every week of delay costs you market share and potential customers.",
        metric: "75%",
        metricLabel: "faster time to market",
        source: "McKinsey Report"
    }
];

const opportunities = [
    {
        title: "Custom GPT Revolution",
        description: "Be among the first to launch with custom GPT features. The market for AI-powered apps is growing 200% year over year.",
        trend: "Growing",
        metric: "200% YoY",
        source: "OpenAI Stats 2024"
    },
    {
        title: "Enterprise Demand",
        description: "Companies are actively seeking AI-ready, compliant solutions. Our enterprise-grade features open these opportunities.",
        trend: "High",
        metric: "$300B Market",
        source: "Forrester"
    },
    {
        title: "Venture Funding",
        description: "VCs are prioritizing teams that can execute quickly. Show them a working product, not just a pitch deck.",
        trend: "Active",
        metric: "$12.8B Invested",
        source: "CB Insights"
    }
];

const marketStats = [
    {
        icon: TrendingUp,
        label: "AI Market Growth",
        value: "38.1%",
        subtext: "CAGR 2024-2030",
        source: "Grand View Research"
    },
    {
        icon: Users,
        label: "Developer Shortage",
        value: "40M",
        subtext: "Developer deficit by 2025",
        source: "IDC Report"
    },
    {
        icon: Building,
        label: "Enterprise Adoption",
        value: "89%",
        subtext: "Plan to implement AI",
        source: "Deloitte Survey"
    },
    {
        icon: Shield,
        label: "Security Investment",
        value: "$500B",
        subtext: "Market by 2025",
        source: "Gartner"
    }
];

const industryVerticals = [
    {
        icon: Stethoscope,
        industry: "Healthcare",
        growth: "$45.2B",
        projection: "2025 Market Size",
        description: "AI-driven diagnostics, patient care, and medical research platforms",
        trends: ["Telemedicine", "Remote Monitoring", "AI Diagnostics"],
        source: "Healthcare Digital Trends 2024"
    },
    {
        icon: Building2,
        industry: "Real Estate",
        growth: "142%",
        projection: "YoY Growth",
        description: "Property management, smart buildings, and automated valuations",
        trends: ["Smart Properties", "Virtual Tours", "Automated Valuation"],
        source: "PropTech Report 2024"
    },
    {
        icon: ShoppingBag,
        industry: "E-commerce",
        growth: "$8.1T",
        projection: "Global Market",
        description: "AI-powered personalization, inventory management, and customer service",
        trends: ["Personalization", "Voice Commerce", "Smart Logistics"],
        source: "eMarketer 2024"
    },
    {
        icon: Briefcase,
        industry: "Financial Services",
        growth: "$22.5B",
        projection: "AI Investment",
        description: "Automated trading, risk assessment, and fraud detection systems",
        trends: ["Robo-Advisory", "Fraud Detection", "Risk Analytics"],
        source: "FinTech Insights 2024"
    },
    {
        icon: GraduationCap,
        industry: "Education",
        growth: "$342B",
        projection: "EdTech Market",
        description: "Personalized learning platforms, assessment tools, and virtual classrooms",
        trends: ["Adaptive Learning", "Virtual Labs", "AI Tutoring"],
        source: "EdTech Magazine"
    },
    {
        icon: Factory,
        industry: "Manufacturing",
        growth: "37%",
        projection: "AI Adoption Rate",
        description: "Predictive maintenance, quality control, and supply chain optimization",
        trends: ["Smart Factory", "Digital Twin", "Predictive AI"],
        source: "Industry 4.0 Report"
    }
];

export const WhyNow = () => {
    const [hoveredCard, setHoveredCard] = useState<string | null>(null);
    const [hoveredTrend, setHoveredTrend] = useState<string | null>(null);

    return (
        <div className="space-y-12">
            <div className="space-y-4">
                <div className="flex justify-center">
                    <Badge variant="outline" className="gap-2">
                        <Rocket className="h-4 w-4" />
                        Market Timing
                    </Badge>
                </div>
                <h2 className="text-3xl font-bold text-center">
                    The Perfect Storm of Opportunity
                </h2>
                <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
                    Three major market shifts are creating unprecedented opportunities for founders who can move fast.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                {marketTrends.map((trend, index) => (
                    <motion.div
                        key={trend.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -5 }}
                        transition={{
                            delay: index * 0.1,
                            duration: 0.2,
                            bounce: 0.3,
                            type: "spring"
                        }}
                        viewport={{ once: true }}
                    >
                        <Card className="p-6 h-full flex flex-col hover:shadow-lg transition-all duration-300">
                            <motion.div
                                className="mb-4"
                                whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <trend.icon className="h-8 w-8 text-primary" />
                            </motion.div>
                            <h3 className="text-xl font-semibold mb-2">{trend.title}</h3>
                            <p className="text-muted-foreground mb-6 flex-grow">{trend.description}</p>
                            <div className="border-t pt-4">
                                <div className="text-2xl font-bold text-primary">{trend.metric}</div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{trend.metricLabel}</span>
                                    <Badge variant="secondary" className="text-xs">
                                        {trend.source}
                                    </Badge>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                {marketStats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 300
                        }}
                        viewport={{ once: true }}
                    >
                        <Card className="p-4 hover:shadow-md transition-all duration-300">
                            <motion.div
                                className="flex items-center gap-2 mb-2"
                                whileHover={{ x: 5 }}
                                transition={{ duration: 0.2 }}
                            >
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{stat.label}</span>
                            </motion.div>
                            <motion.div
                                className="text-2xl font-bold text-primary"
                                initial={{ scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                            >
                                {stat.value}
                            </motion.div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-muted-foreground">{stat.subtext}</span>
                                <Badge variant="outline" className="text-[10px]">
                                    {stat.source}
                                </Badge>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="space-y-8">
                <div className="text-center space-y-4">
                    <Badge variant="outline" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Industry Verticals
                    </Badge>
                    <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary/80 via-primary to-primary/80 bg-clip-text text-transparent">
                        High-Growth Sectors
                    </h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        AI adoption is accelerating across industries, creating massive opportunities in these key verticals.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {industryVerticals.map((vertical, index) => (
                        <motion.div
                            key={vertical.industry}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            onHoverStart={() => setHoveredCard(vertical.industry)}
                            onHoverEnd={() => setHoveredCard(null)}
                            transition={{
                                delay: index * 0.1,
                                duration: 0.4,
                                ease: "easeOut"
                            }}
                            viewport={{ once: true }}
                        >
                            <Card className="group relative overflow-hidden border-primary/10 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                                <AnimatePresence>
                                    {hoveredCard === vertical.industry && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"
                                        />
                                    )}
                                </AnimatePresence>

                                <div className="relative p-6 h-full flex flex-col">
                                    <motion.div
                                        className="flex items-center justify-between mb-4"
                                        whileHover={{ x: 5 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <motion.div
                                                className="p-2 rounded-lg bg-primary/10 text-primary"
                                                whileHover={{ rotate: 360 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <vertical.icon className="h-5 w-5" />
                                            </motion.div>
                                            <h4 className="font-semibold text-lg">{vertical.industry}</h4>
                                        </div>
                                        <motion.div whileHover={{ scale: 1.1 }}>
                                            <Badge variant="secondary" className="text-xs font-medium">
                                                {vertical.source}
                                            </Badge>
                                        </motion.div>
                                    </motion.div>

                                    <motion.div
                                        className="mb-4 p-3 rounded-lg bg-muted/50"
                                        whileHover={{ scale: 1.02 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="text-3xl font-bold text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                            {vertical.growth}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {vertical.projection}
                                        </div>
                                    </motion.div>

                                    <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed">
                                        {vertical.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-dashed border-muted-foreground/20">
                                        {vertical.trends.map((trend) => (
                                            <motion.div
                                                key={trend}
                                                onHoverStart={() => setHoveredTrend(trend)}
                                                onHoverEnd={() => setHoveredTrend(null)}
                                                whileHover={{ y: -2 }}
                                            >
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs bg-background transition-all duration-300 ${hoveredTrend === trend
                                                        ? "bg-primary/10 scale-110"
                                                        : "hover:bg-primary/5"
                                                        }`}
                                                >
                                                    {trend}
                                                </Badge>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="flex justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Badge variant="secondary" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Data updated quarterly
                    </Badge>
                </motion.div>
            </div>

            <div className="rounded-lg bg-muted/50 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Market Opportunities</h3>
                    <Badge variant="secondary" className="gap-1">
                        <Zap className="h-4 w-4" />
                        Live Market Data
                    </Badge>
                </div>
                <div className="space-y-6">
                    {opportunities.map((opportunity) => (
                        <div
                            key={opportunity.title}
                            className="flex items-center justify-between p-4 rounded-lg bg-background hover:bg-muted/50 transition-colors"
                        >
                            <div className="space-y-1">
                                <div className="font-medium">{opportunity.title}</div>
                                <div className="text-sm text-muted-foreground">{opportunity.description}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant="outline" className="gap-1">
                                    <ArrowUpRight className="h-3 w-3" />
                                    {opportunity.metric}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{opportunity.source}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="text-center space-y-4">
                <Badge variant="destructive" className="gap-2">
                    <Clock className="h-4 w-4" />
                    Limited Time Offer
                </Badge>
                <p className="text-muted-foreground">
                    Launch pricing ends soon. Lock in lifetime access at our lowest price ever.
                </p>
            </div>
        </div>
    );
};
