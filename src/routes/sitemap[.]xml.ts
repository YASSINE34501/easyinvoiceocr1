/**
 * GET /sitemap.xml
 *
 * Generated at request time from the product and navigation configuration, so
 * it cannot drift out of date the way a checked-in XML file does.
 */

import { createFileRoute } from "@tanstack/react-router";
import { buildSitemapXml } from "@/lib/seo/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => {
        const origin = new URL(request.url).origin;
        return new Response(buildSitemapXml(origin), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
