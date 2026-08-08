import { createFileRoute, notFound } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageHero, PageLayout, Section } from "@/components/site/PageLayout";
import { AppLink } from "@/components/site/AppLink";
import { Button } from "@/components/ui/button";
import { solutions, solutionBySlug, type Solution } from "@/content/solutions";
import { path } from "@/config/nav";

export const Route = createFileRoute("/$locale/solutions/$slug")({
  loader: ({ params }) => {
    const solution = solutionBySlug[params.slug];
    if (!solution) throw notFound();
    return { solution };
  },
  component: SolutionPage,
  errorComponent: () => (
    <PageLayout>
      <PageHero
        title="This page didn't load"
        lede="Please refresh, or head back to the homepage."
      />
    </PageLayout>
  ),
  notFoundComponent: () => (
    <PageLayout>
      <PageHero
        title="Solution not found"
        lede="That solution page doesn't exist. Browse the solutions we do publish below."
      >
        <div className="flex flex-wrap gap-3">
          {solutions.map((s) => (
            <Button key={s.slug} asChild variant="outline" className="min-h-11 rounded-lg">
              <AppLink href={s.route}>{s.name}</AppLink>
            </Button>
          ))}
        </div>
      </PageHero>
    </PageLayout>
  ),
  head: ({ loaderData }) => {
    const s = loaderData?.solution as Solution | undefined;
    if (!s) {
      return {
        meta: [
          { title: "Solution not found — EasyInvoiceOCR" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: s.title },
        { name: "description", content: s.description },
        { property: "og:title", content: s.title },
        { property: "og:description", content: s.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: s.route },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: s.route }],
    };
  },
});

function SolutionPage() {
  const { solution } = Route.useLoaderData() as { solution: Solution };

  return (
    <PageLayout
      breadcrumbs={[
        { label: "Solutions", href: path("solutions/accountants") },
        { label: solution.name },
      ]}
    >
      <PageHero eyebrow="Solutions" title={solution.heading} lede={solution.lede}>
        <Button asChild size="lg" className="h-12 rounded-xl px-6 font-semibold">
          <AppLink href={solution.cta.href}>{solution.cta.label}</AppLink>
        </Button>
      </PageHero>

      <Section muted>
        <div className="grid max-w-[900px] gap-5 md:grid-cols-2">
          {solution.intro.map((p) => (
            <p key={p.slice(0, 24)} className="text-[15px] leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>
      </Section>

      <Section title={`How ${solution.name.toLowerCase()} use EasyInvoiceOCR`}>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {solution.blocks.map((b) => (
            <div key={b.title} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="text-sm font-semibold text-navy">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.body}</p>
              {b.points && (
                <ul className="mt-3 space-y-1.5">
                  {b.points.map((pt) => (
                    <li key={pt} className="flex gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Related" muted>
        <ul className="flex flex-wrap gap-3">
          {solution.links.map((l) => (
            <li key={l.href}>
              <AppLink
                href={l.href}
                className="inline-flex min-h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-navy transition-colors hover:border-primary"
              >
                {l.label}
              </AppLink>
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <div className="flex flex-col items-start gap-5 rounded-2xl bg-navy px-6 py-10 sm:px-10">
          <h2 className="text-[22px] font-bold text-background sm:text-[26px]">
            {solution.cta.label}
          </h2>
          <p className="max-w-[620px] text-sm leading-relaxed text-background/70">
            {solution.cta.note}
          </p>
          <Button asChild size="lg" className="h-12 rounded-xl px-6 font-semibold">
            <AppLink href={solution.cta.href}>{solution.cta.label}</AppLink>
          </Button>
        </div>
      </Section>
    </PageLayout>
  );
}
