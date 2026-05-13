"use client";

interface OrganizationSchemaProps {
  name?: string;
  logo?: string;
  url?: string;
  description?: string;
}

export function OrganizationSchema({
  name = "MIIAM",
  logo = "https://miiam.app/icons/icon-512.svg",
  url = "https://miiam.app",
  description = "Food delivery and professional home services",
}: OrganizationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    logo,
    url,
    description,
    sameAs: [
      "https://instagram.com/miiam",
      "https://twitter.com/miiam",
      "https://facebook.com/miiam",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9876543210",
      contactType: "customer service",
      availableHours: "Mo-Su 08:00-22:00",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface RestaurantSchemaProps {
  name: string;
  description?: string;
  image?: string;
  address?: string;
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
  cuisine?: string[];
  url?: string;
  telephone?: string;
}

export function RestaurantSchema({
  name,
  description,
  image,
  address,
  priceRange = "₹₹",
  rating,
  reviewCount,
  cuisine = [],
  url,
  telephone,
}: RestaurantSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name,
    description,
    image,
    address: address
      ? {
          "@type": "PostalAddress",
          addressLocality: address,
        }
      : undefined,
    priceRange,
    servesCuisine: cuisine,
    url,
    telephone,
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating,
        reviewCount: reviewCount || 0,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface ProductSchemaProps {
  name: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  brand?: string;
  sku?: string;
}

export function ProductSchema({
  name,
  description,
  image,
  price,
  currency = "INR",
  brand = "MIIAM",
  sku,
}: ProductSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    sku,
    offers: price
      ? {
          "@type": "Offer",
          price,
          priceCurrency: currency,
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

export function FAQSchema({ items }: FAQSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}