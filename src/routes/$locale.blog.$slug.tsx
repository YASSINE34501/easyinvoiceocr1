import { createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageLayout, Section, Container } from "@/components/site/PageLayout";
import { AdSlot } from "@/components/site/AdSlot";
import { AppLink } from "@/components/site/AppLink";
import { Button } from "@/components/ui/button";
import { blogBySlug, relatedPosts, type BlogPost } from "@/content/blog";
import { path } from "@/config/nav";
import { asLocale, formatDate, type Locale } from "@/i18n";
import { useDir, useLocale, useT } from "@/i18n/useLocale";
import {
  SITE_NAME,
  canonicalUrl,
  publisherRef,
  robotsMeta,
  seoLinks,
} from "@/config/seo";

/**
 * /:locale/blog/:slug — one article, in the locale it was requested in.
 *
 * The article body is selected by locale from the content registry, so a French
 * URL serves French prose rather than an English body inside a translated
 * shell. The slug is deliberately the same in all three locales: it is already
 * indexed, and a localised slug would break existing links for a cosmetic gain.
 */
export const Route = createFileRoute("/$locale/blog/$slug")({
  loader: ({ params }): { post: BlogPost } => {
    const post = blogBySlug[params.slug];
    // A real 404, not a soft one: an unknown slug must never return 200 with a
    // "not found" body, or search engines index the apology.
    if (!post) throw notFound();
    return { post };
  },
  head: ({ params, loaderData }) => {
    const locale = asLocale(params.locale);
    const post = loaderData?.post as BlogPost | undefined;
    if (!post) {
      return {
        meta: [
          { title: `Article not found — ${SITE_NAME}` },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }

    const content = post.content[locale];
    const url = canonicalUrl(`blog/${post.slug}`, locale);

    return {
      meta: [
        { title: content.title },
        robotsMeta(`blog/${post.slug}`),
        { name: "description", content: content.description },
        { property: "og:title", content: content.title },
        { property: "og:description", content: content.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "article:published_time", content: post.date },
        { property: "article:modified_time", content: post.updated ?? post.date },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: seoLinks(`blog/${post.slug}`, locale),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            // Matches the visible H1, not the longer SEO title, so the
            // structured data describes what a reader actually sees.
            headline: content.heading,
            description: content.description,
            inLanguage: locale,
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            url,
            // No named person is credited. The organisation is the author,
            // because inventing a byline would be inventing a person.
            // Referenced, not restated: the organisation is defined once in
            // the root graph. This also drops the trailing-slash spelling of
            // the site origin that used to appear only here.
            author: publisherRef(),
            publisher: publisherRef(),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: SITE_NAME,
                item: canonicalUrl("", locale),
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: canonicalUrl("blog", locale),
              },
              { "@type": "ListItem", position: 3, name: content.heading, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: BlogPostPage,
  errorComponent: BlogPostMissing,
  notFoundComponent: BlogPostMissing,
});

function BlogPostMissing() {
  const t = useT();
  const locale = useLocale();
  return (
    <PageLayout breadcrumbs={[{ label: t("link.blog"), href: path("blog", locale) }]}>
      <Section title={t("blog.notFound")} lede={t("blog.notFoundBody")}>
        <Button asChild className="h-11 rounded-lg font-semibold">
          <AppLink href={path("blog", locale)}>{t("cta.backToList")}</AppLink>
        </Button>
      </Section>
    </PageLayout>
  );
}

function BlogPostPage() {
  const { post } = Route.useLoaderData() as { post: BlogPost };
  const t = useT();
  const locale = useLocale() as Locale;
  const content = post.content[locale];
  const related = relatedPosts(post);
  // A real left-pointing glyph in Arabic rather than a CSS-mirrored right one:
  // it does not depend on a Tailwind direction variant being generated.
  const Arrow = useDir() === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <PageLayout
      breadcrumbs={[
        { label: t("link.blog"), href: path("blog", locale) },
        { label: content.heading },
      ]}
    >
      <article>
        <section className="hero-glow border-b border-border/70">
          <Container className="py-10 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {content.category}
            </p>
            <h1 className="mt-3 max-w-[820px] text-[30px] font-extrabold leading-[1.14] tracking-tight text-navy sm:text-[40px]">
              {content.heading}
            </h1>
            <p className="mt-4 max-w-[680px] text-[15px] leading-relaxed text-muted-foreground">
              {content.lede}
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              {SITE_NAME} · {t("blog.published")}{" "}
              <time dateTime={post.date}>{formatDate(post.date, locale)}</time>
              {post.updated ? (
                <>
                  {" "}
                  · {t("blog.updated")}{" "}
                  <time dateTime={post.updated}>{formatDate(post.updated, locale)}</time>
                </>
              ) : null}{" "}
              · {post.readingMinutes[locale]} {t("blog.readingTime")}
            </p>
          </Container>
        </section>

        <Section>
          <div className="max-w-[720px] space-y-8">
            {content.body.map((block, index) => (
              <div key={block.heading ?? `block-${index}`}>
                {block.heading && (
                  <h2 className="text-[20px] font-bold tracking-tight text-navy">
                    {block.heading}
                  </h2>
                )}
                {block.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="mt-3 text-[16px] leading-[1.75] text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
                {block.list && (
                  <ul className="mt-4 space-y-2">
                    {block.list.map((item) => (
                      <li
                        key={item.slice(0, 32)}
                        className="flex gap-2 text-[16px] leading-relaxed text-muted-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Internal links: the product this article supports, an audience
              page and a documentation page. Anchor text is written per article
              rather than reused, so the blog does not point at every product
              with the same phrase. */}
          <nav aria-labelledby="article-links" className="mt-12 max-w-[720px]">
            <h2 id="article-links" className="text-[20px] font-bold tracking-tight text-navy">
              {content.linksTitle}
            </h2>
            <ul className="mt-4 space-y-2">
              {content.links.map((link) => (
                <li key={link.href}>
                  <AppLink
                    href={link.href}
                    className="inline-flex items-center gap-2 text-[16px] font-medium text-primary underline-offset-4 hover:underline"
                  >
                    <Arrow className="size-4 shrink-0" aria-hidden="true" />
                    {link.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10 max-w-[720px] rounded-2xl border border-primary/40 bg-pale-green/40 p-6">
            <Button asChild className="min-h-11 rounded-lg font-semibold">
              <AppLink href={content.cta.href}>{content.cta.label}</AppLink>
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">{content.cta.note}</p>
          </div>
        </Section>

        {/* Between content sections, well away from any product control. */}
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <AdSlot name="blog_in_article" variant="in-article" />
        </div>

        {related.length > 0 && (
          <Section muted title={t("blog.related")}>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other) => (
                <li key={other.slug}>
                  <AppLink
                    href={`${path("blog", locale)}/${other.slug}`}
                    className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
                  >
                    <span className="text-xs font-medium uppercase tracking-wide text-primary">
                      {other.content[locale].category}
                    </span>
                    <h3 className="mt-2 text-base font-semibold leading-snug text-navy">
                      {other.content[locale].heading}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {other.content[locale].description}
                    </p>
                  </AppLink>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </article>
    </PageLayout>
  );
}
