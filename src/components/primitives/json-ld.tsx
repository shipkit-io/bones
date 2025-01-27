import { siteConfig } from "@/config/site";
import Script from "next/script";

interface JsonLdProps {
	organization?: boolean;
	website?: boolean;
	breadcrumbs?: Array<{
		name: string;
		item: string;
	}>;
	article?: {
		headline: string;
		description: string;
		image: string;
		datePublished: string;
		dateModified: string;
		author: string;
	};
	product?: {
		name: string;
		description: string;
		image: string;
		price: string;
		priceCurrency: string;
	};
	faq?: {
		questions: Array<{
			question: string;
			answer: string;
		}>;
	};
	localBusiness?: {
		type: string;
		name?: string;
		description?: string;
		telephone?: string;
		email?: string;
		address?: {
			streetAddress: string;
			addressLocality: string;
			addressRegion: string;
			postalCode: string;
			addressCountry: string;
		};
		openingHours?: string[];
		priceRange?: string;
	};
}

export function JsonLd({
	organization = true,
	website = true,
	breadcrumbs,
	article,
	product,
	faq,
	localBusiness,
}: JsonLdProps) {
	const structuredData = {
		"@context": "https://schema.org",
		"@graph": [
			organization && {
				"@type": "Organization",
				"@id": `${siteConfig.url}/#organization`,
				name: siteConfig.name,
				url: siteConfig.url,
				logo: {
					"@type": "ImageObject",
					"@id": `${siteConfig.url}/#logo`,
					inLanguage: "en-US",
					url: `${siteConfig.url}/logo.png`,
					contentUrl: `${siteConfig.url}/logo.png`,
					width: 512,
					height: 512,
					caption: siteConfig.name,
				},
				image: { "@id": `${siteConfig.url}/#logo` },
				sameAs: [
					siteConfig.links.twitter,
					siteConfig.links.github,
				].filter(Boolean),
			},
			website && {
				"@type": "WebSite",
				"@id": `${siteConfig.url}/#website`,
				url: siteConfig.url,
				name: siteConfig.name,
				description: siteConfig.description,
				publisher: {
					"@id": `${siteConfig.url}/#organization`,
				},
				inLanguage: "en-US",
			},
			breadcrumbs && {
				"@type": "BreadcrumbList",
				"@id": `${siteConfig.url}/#breadcrumb`,
				itemListElement: [
					{
						"@type": "ListItem",
						position: 1,
						item: {
							"@type": "WebPage",
							"@id": siteConfig.url,
							url: siteConfig.url,
							name: "Home",
						},
					},
					...breadcrumbs.map((item, index) => ({
						"@type": "ListItem",
						position: index + 2,
						item: {
							"@type": "WebPage",
							"@id": item.item,
							url: item.item,
							name: item.name,
						},
					})),
				],
			},
			article && {
				"@type": "Article",
				"@id": `${siteConfig.url}/#article`,
				headline: article.headline,
				description: article.description,
				image: article.image,
				datePublished: article.datePublished,
				dateModified: article.dateModified,
				author: {
					"@type": "Person",
					name: article.author,
				},
				publisher: {
					"@id": `${siteConfig.url}/#organization`,
				},
				isPartOf: {
					"@id": `${siteConfig.url}/#website`,
				},
				inLanguage: "en-US",
			},
			product && {
				"@type": "Product",
				"@id": `${siteConfig.url}/#product`,
				name: product.name,
				description: product.description,
				image: product.image,
				offers: {
					"@type": "Offer",
					price: product.price,
					priceCurrency: product.priceCurrency,
				},
			},
			faq && {
				"@type": "FAQPage",
				"@id": `${siteConfig.url}/#faq`,
				mainEntity: faq.questions.map((q) => ({
					"@type": "Question",
					name: q.question,
					acceptedAnswer: {
						"@type": "Answer",
						text: q.answer,
					},
				})),
			},
			localBusiness && {
				"@type": localBusiness.type || "SoftwareApplication",
				"@id": `${siteConfig.url}/#local-business`,
				name: localBusiness.name || siteConfig.name,
				description: localBusiness.description || siteConfig.description,
				url: siteConfig.url,
				...(localBusiness.telephone && { telephone: localBusiness.telephone }),
				...(localBusiness.email && { email: localBusiness.email }),
				...(localBusiness.address && {
					address: {
						"@type": "PostalAddress",
						...localBusiness.address,
					},
				}),
				...(localBusiness.openingHours && {
					openingHoursSpecification: localBusiness.openingHours.map((hours) => ({
						"@type": "OpeningHoursSpecification",
						dayOfWeek: hours,
					})),
				}),
				...(localBusiness.priceRange && { priceRange: localBusiness.priceRange }),
				image: { "@id": `${siteConfig.url}/#logo` },
			},
		].filter(Boolean),
	};

	return (
		<Script
			id="json-ld"
			type="application/ld+json"
			strategy="worker"
		>
			{`${JSON.stringify(structuredData)}`}
		</Script>
	);
}
