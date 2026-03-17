/**
 * V66 BreadcrumbList schema for zh pages
 */

import { BASE_URL } from "@/config/site";

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function buildBreadcrumbSchema(
  items: BreadcrumbItem[]
): { "@context": string; "@type": string; itemListElement: object[] } {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`
    }))
  };
}
