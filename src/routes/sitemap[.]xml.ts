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
      // The request origin is deliberately ignored. A sitemap served from a
      // preview hostname must still list the production URLs, or the preview
      // gets crawled and competes with the site it is previewing.
      GET: () => {
        return new Response(buildSitemapXml(), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
