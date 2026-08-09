import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageLayout, Section, breadcrumbJsonLd, Container } from "@/components/site/PageLayout";
import { AdSlot } from "@/components/site/AdSlot";
import { AppLink } from "@/components/site/AppLink";
import { Button } from "@/components/ui/button";
import { blogBySlug, blogPosts, type BlogPost } from "@/content/resources";
import { path } from "@/config/nav";
import { asLocale, formatDate } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { absoluteUrl, canonicalUrl, robotsMeta, seoLinks } from "@/config/seo";

export const Route = createFileRoute("/$locale/blog/$slug")({
  loader: ({ params }): { post: BlogPost } => {
    const post = blogBySlug[params.slug];
    if (!post) throw notFound();
    return { post };
  },
  head: ({ params, loaderData }) => {
    const locale = asLocale(params.locale);
    const post = loaderData?.post as BlogPost | undefined;
    if (!post) {
      return {
        meta: [
          { title: "Article not found — EasyInvoiceOCR" },
          { name: "robots", content: "noindex, nofollow" },
        ],
      };
    }
    const title = `${post.title} — EasyInvoiceOCR`;
    return {
      meta: [
        { title },
        robotsMeta(`blog/${post.slug}`),
        { name: "description", content: post.description },
        { property: "og:title", content: title },
        { property: "og:description", content: post.description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: seoLinks(`blog/${post.slug}`, locale),
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            dateModified: post.updated ?? post.date,
            author: { "@type": "Organization", name: post.author },
            publisher: { "@type": "Organization", name: "EasyInvoiceOCR" },
          }),
        },
        {
          type: "application/ld+json",
          children: breadcrumbJsonLd([{ label: "Blog", href: "/en/blog" }, { label: post.title }]),
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
  const locale = useLocale();

  const related = blogPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  return (
    <PageLayout
      breadcrumbs={[{ label: t("link.blog"), href: path("blog", locale) }, { label: post.title }]}
    >
      <article>
        <section className="hero-glow border-b border-border/70">
          <Container className="py-10 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {post.category}
            </p>
            <h1 className="mt-3 max-w-[820px] text-[30px] font-extrabold leading-[1.14] tracking-tight text-navy sm:text-[40px]">
              {post.title}
            </h1>
            <p className="mt-4 max-w-[680px] text-[15px] leading-relaxed text-muted-foreground">
              {post.description}
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              {post.author} · {t("blog.published")} {formatDate(post.date, locale)}
              {post.updated
                ? ` · ${t("blog.updated")} ${formatDate(post.updated, locale)}`
                : ""} · {post.readingMinutes} {t("blog.readingTime")}
            </p>
          </Container>
        </section>

        <Section>
          <div className="max-w-[720px] space-y-8">
            {post.body.map((block, i) => (
              <div key={block.heading ?? i}>
                {block.heading && (
                  <h2 className="text-[20px] font-bold tracking-tight text-navy">
                    {block.heading}
                  </h2>
                )}
                {block.paragraphs.map((p) => (
                  <p
                    key={p.slice(0, 24)}
                    className="mt-3 text-[16px] leading-[1.75] text-muted-foreground"
                  >
                    {p}
                  </p>
                ))}
                {block.list && (
                  <ul className="mt-4 space-y-2">
                    {block.list.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-[16px] leading-relaxed text-muted-foreground"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* Between content sections, well away from any product control. */}
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <AdSlot name="blog_in_article" variant="in-article" />
        </div>

        {related.length > 0 && (
          <Section muted title={t("blog.related")}>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <AppLink
                    href={`${path("blog", locale)}/${p.slug}`}
                    className="flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
                  >
                    <h3 className="text-base font-semibold leading-snug text-navy">{p.title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {p.description}
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
