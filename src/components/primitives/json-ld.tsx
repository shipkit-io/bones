import { siteConfig } from "@/config/site-config";

interface JsonLdProps {
  /**
   * Canonical URL of the page rendering this block. Page-scoped nodes (article,
   * FAQ, breadcrumbs) hang their `@id` off it so two pages never claim the same
   * node. Defaults to the site root.
   */
  url?: string;
  /** Distinguishes the script tag when a page adds a block on top of the layout's. */
  id?: string;
  /**
   * Emits the Organization / WebSite / SoftwareSourceCode graph. The root layout
   * already does this on every page, so a page adding its own block should pass
   * `false` rather than repeating those nodes.
   */
  siteWide?: boolean;
  organization?: boolean;
  website?: boolean;
  softwareSourceCode?: boolean;
  breadcrumbs?: {
    name: string;
    item: string;
  }[];
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
    questions: {
      question: string;
      answer: string;
    }[];
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
  url,
  id = "json-ld",
  siteWide = true,
  organization = true,
  website = true,
  softwareSourceCode = true,
  breadcrumbs,
  article,
  product,
  faq,
  localBusiness,
}: JsonLdProps) {
  const pageUrl = url ?? siteConfig.url;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      siteWide &&
        organization && {
          "@type": "Organization",
          "@id": `${siteConfig.url}/#organization`,
          name: siteConfig.title,
          url: siteConfig.url,
          logo: {
            "@type": "ImageObject",
            "@id": `${siteConfig.url}/#logo`,
            inLanguage: "en-US",
            url: `${siteConfig.url}/logo.png`,
            contentUrl: `${siteConfig.url}/logo.png`,
            width: 512,
            height: 512,
            caption: siteConfig.title,
          },
          image: { "@id": `${siteConfig.url}/#logo` },
          sameAs: [siteConfig.links.twitter, siteConfig.links.github].filter(Boolean),
        },
      siteWide &&
        website && {
          "@type": "WebSite",
          "@id": `${siteConfig.url}/#website`,
          url: siteConfig.url,
          name: siteConfig.title,
          description: siteConfig.description,
          publisher: {
            "@id": `${siteConfig.url}/#organization`,
          },
          inLanguage: "en-US",
        },
      siteWide &&
        softwareSourceCode && {
          "@type": "SoftwareSourceCode",
          "@id": `${siteConfig.url}/#source-code`,
          name: siteConfig.title,
          description: siteConfig.description,
          url: siteConfig.url,
          codeRepository: siteConfig.repo.url,
          programmingLanguage: "TypeScript",
          author: {
            "@id": `${siteConfig.url}/#organization`,
          },
        },
      breadcrumbs && {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}/#breadcrumb`,
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
        "@id": `${pageUrl}/#article`,
        url: pageUrl,
        mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
        headline: article.headline,
        description: article.description,
        image: article.image,
        // `formatDateTimeAttribute` yields "" for a missing or unparseable date.
        // An empty `datePublished` is invalid, so drop the key instead.
        ...(article.datePublished && { datePublished: article.datePublished }),
        ...(article.dateModified && { dateModified: article.dateModified }),
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
        "@type": ["Product", "SoftwareApplication"],
        "@id": `${siteConfig.url}/#product`,
        name: product.name,
        description: product.description,
        image: product.image,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: product.priceCurrency,
          availability: "https://schema.org/InStock",
          url: siteConfig.url,
        },
        brand: {
          "@id": `${siteConfig.url}/#organization`,
        },
      },
      faq && {
        "@type": "FAQPage",
        "@id": `${pageUrl}/#faq`,
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
        name: localBusiness.name ?? siteConfig.title,
        description: localBusiness.description ?? siteConfig.description,
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

  // Rendered as a plain script tag, not `next/script`. A `next/script` block is
  // injected by the client runtime after hydration, so it never reaches the
  // server HTML and crawlers reading the initial response see no schema at all
  // (LAC-5573). Escaping `<` keeps a `</script>` inside CMS-authored copy from
  // closing the tag early.
  return (
    <script
      id={id}
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has to be script-tag text, and the payload is escaped above.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, String.raw`\u003c`),
      }}
    />
  );
}
