import type { Testimonial } from "@/types/testimonial";

export const content: Testimonial[] = [
	{
		name: "Sarah Chen",
		role: "Senior Developer",
		company: "Vercel",
		testimonial:
			"Shipkit saved us months of setup time. The authentication and API routes are production-ready out of the box.",
		username: "@sarahchen",
		verified: true,
		featured: true,
	},
	{
		name: "Alex Thompson",
		role: "Tech Lead",
		company: "Acme Inc",
		testimonial:
			"The developer experience is incredible. Everything just works together seamlessly.",
		username: "@alexdev",
		verified: true,
		featured: false,
	},
	{
		name: "Maria Garcia",
		role: "Full Stack Developer",
		company: "TechCorp",
		testimonial:
			"Best starter kit I've ever used. The documentation is clear and the code is clean.",
		username: "@mariadev",
		verified: true,
		featured: false,
	},
];
