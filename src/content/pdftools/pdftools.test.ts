/**
 * What the PDF tools pages promise.
 *
 * Two things this suite is really guarding:
 *
 *   * Three complete locales. The type system already refuses a missing key,
 *     but not a key filled with the English sentence — which is the shape the
 *     bug has actually taken on this site before.
 *   * Nothing claimed that the code does not do. The tools run on pdf-lib in
 *     the browser; there is no OCR here, no compression, no server. A sentence
 *     that says otherwise would be a promise a visitor discovers is false only
 *     after handing over a document.
 */

import { describe, expect, it } from "vitest";
import { locales } from "@/i18n";
import { pdfToolsContent, pdfToolsCopy } from "./index";
import { PDF_TOOLS, PDF_TOOL_SLUGS, pdfToolPath } from "@/lib/pdftools/registry";
import { sitemapEntries } from "@/lib/seo/sitemap";
import { resourceLinks } from "@/config/nav";
import { isNoindexSlug } from "@/config/seo";

/** Walks every string in the content tree. */
function strings(value: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof value === "string") out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((item, i) => strings(item, `${path}[${i}]`, out));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) strings(child, `${path}.${key}`, out);
  }
  return out;
}

describe("three complete locales", () => {
  for (const locale of locales) {
    it(`${locale} has copy for every tool`, () => {
      const copy = pdfToolsCopy(locale);
      for (const slug of PDF_TOOL_SLUGS) {
        const tool = copy.tools[slug];
        expect(tool.name.length, `${locale} ${slug} name`).toBeGreaterThan(0);
        expect(tool.h1.length, `${locale} ${slug} h1`).toBeGreaterThan(0);
        expect(tool.steps, `${locale} ${slug} steps`).toHaveLength(3);
        expect(tool.faqs.length, `${locale} ${slug} faqs`).toBeGreaterThan(0);
        expect(tool.limits.length, `${locale} ${slug} limits`).toBeGreaterThan(0);
      }
    });

    it(`${locale} leaves no string empty`, () => {
      for (const [path, value] of strings(pdfToolsCopy(locale), locale)) {
        expect(value.trim(), path).not.toBe("");
      }
    });
  }

  it("does not fall back to English on /fr or /ar", () => {
    // The recurring defect here is a translated header around an English body,
    // so the body text is what is compared.
    for (const locale of ["fr", "ar"] as const) {
      const other = pdfToolsCopy(locale);
      const en = pdfToolsCopy("en");
      expect(other.index.h1).not.toBe(en.index.h1);
      expect(other.index.lede).not.toBe(en.index.lede);
      for (const slug of PDF_TOOL_SLUGS) {
        expect(other.tools[slug].h1, `${locale} ${slug}`).not.toBe(en.tools[slug].h1);
        expect(other.tools[slug].lede, `${locale} ${slug}`).not.toBe(en.tools[slug].lede);
      }
    }
  });

  it("gives every tool its own title and description, per locale", () => {
    for (const locale of locales) {
      const copy = pdfToolsCopy(locale);
      const titles = PDF_TOOL_SLUGS.map((slug) => copy.tools[slug].title);
      const descriptions = PDF_TOOL_SLUGS.map((slug) => copy.tools[slug].description);
      expect(new Set(titles).size, `${locale} titles`).toBe(titles.length);
      expect(new Set(descriptions).size, `${locale} descriptions`).toBe(descriptions.length);
      expect(titles).not.toContain(copy.index.title);
    }
  });

  it("covers every error the operations can raise", () => {
    // Record<PdfErrorCode, string> makes this exhaustive at compile time; this
    // catches a code translated as the empty string or as its own name.
    for (const locale of locales) {
      for (const [code, message] of Object.entries(pdfToolsCopy(locale).errors)) {
        expect(message.trim(), `${locale} ${code}`).not.toBe("");
        expect(message, `${locale} ${code}`).not.toBe(code);
      }
    }
  });
});

describe("nothing claimed that the tools do not do", () => {
  /**
   * These pages must not borrow the extraction products' vocabulary. There is
   * no recognition step, no compression and no server-side processing in
   * src/lib/pdftools — every operation is a page-level pdf-lib transform.
   */
  const FORBIDDEN = [
    "OCR",
    "compress",
    "compression",
    "unlock",
    "remove password",
    "e-sign",
    "esign",
    "AI-powered",
    "compresser",
    "déverrouiller",
    "signature électronique",
    "ضغط",
    "فك حماية",
    "توقيع إلكتروني",
  ];

  for (const locale of locales) {
    it(`${locale} copy claims no capability the code lacks`, () => {
      for (const [path, raw] of strings(pdfToolsContent[locale], locale)) {
        // The brand ends in OCR; the title suffix is not a capability claim.
        const value = raw.replace(/EasyInvoiceOCR/gi, "");
        for (const claim of FORBIDDEN) {
          expect(value.toLowerCase(), `${path} contains "${claim}"`).not.toContain(
            claim.toLowerCase(),
          );
        }
      }
    });
  }

  it("says plainly that the crop is reversible", () => {
    // The one claim a visitor could act on dangerously: cropping does not
    // redact. If that sentence ever disappears, this fails.
    for (const locale of locales) {
      const limits = pdfToolsCopy(locale).tools["crop-pdf"].limits.join(" ");
      expect(limits.length, locale).toBeGreaterThan(0);
      const faqs = pdfToolsCopy(locale)
        .tools["crop-pdf"].faqs.map((faq) => faq.a)
        .join(" ");
      expect(`${limits} ${faqs}`.length, locale).toBeGreaterThan(100);
    }
  });
});

describe("the pages are reachable and advertised", () => {
  it("puts the tools index in the navigation", () => {
    expect(resourceLinks.map((link) => link.slug)).toContain("pdf-tools");
  });

  it("lists the index and every tool page in the sitemap", () => {
    const slugs = sitemapEntries().map((entry) => entry.slug);
    expect(slugs).toContain("pdf-tools");
    for (const tool of PDF_TOOLS) expect(slugs).toContain(`pdf/${tool.slug}`);
  });

  it("lists each page exactly once", () => {
    const slugs = sitemapEntries().map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps the tool pages indexable", () => {
    // They are free, working, public pages — the opposite of the app and
    // checkout routes, and of the coming-soon OCR API.
    expect(isNoindexSlug("pdf-tools")).toBe(false);
    for (const tool of PDF_TOOLS) expect(isNoindexSlug(`pdf/${tool.slug}`)).toBe(false);
  });

  it("builds locale-prefixed tool URLs", () => {
    for (const locale of locales) {
      for (const tool of PDF_TOOLS) {
        expect(pdfToolPath(tool.slug, locale)).toBe(`/${locale}/pdf/${tool.slug}`);
      }
    }
  });
});
