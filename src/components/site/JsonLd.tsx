import { jsonLdString } from "@/lib/seo";

// Structured data for search engines (P3-3). The string is escaped so page data can never close
// the <script> tag.
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
  );
}
