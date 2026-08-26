import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Cpu,
  Database,
  Download,
  FileCheck2,
  FileText,
  KeyRound,
  Lock,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Table2,
  Upload,
  UserCheck,
} from "lucide-react";
import { PageHero, PageLayout, Section, breadcrumbJsonLd } from "@/components/site/PageLayout";
import { AppLink } from "@/components/site/AppLink";
import { Button } from "@/components/ui/button";
import { translate, asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";
import { authSlugs, path } from "@/config/nav";
import { securityFor, securitySeo } from "@/content/security";
import type { SecurityPillar, SecurityStep } from "@/content/security";

export const Route = createFileRoute("/$locale/security")({
  component: SecurityPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const { title, description } = securitySeo[locale];

    return {
      meta: [
        robotsMeta("security"),
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: seoLinks("security", locale),
      scripts: [
        {
          type: "application/ld+json",
          children: breadcrumbJsonLd([{ label: translate(locale, "link.security") }]),
        },
      ],
    };
  },
});

/**
 * Icons are chosen per content entry rather than hard-coded next to the prose,
 * so a translator never has to touch a component to change a heading.
 *
 * None of these are mirrored under RTL. A shield, a lock and a document read
 * the same in both directions; only the arrow on the call to action is
 * directional, and it uses a logical rotation rather than a flipped glyph.
 */
const PILLAR_ICONS: Record<SecurityPillar["icon"], typeof Shield> = {
  shield: ShieldCheck,
  lock: Lock,
  file: FileText,
  server: Server,
};

const STEP_ICONS: Record<SecurityStep["icon"], typeof Shield> = {
  upload: Upload,
  cpu: Cpu,
  table: Table2,
  download: Download,
};

const STAGE_ICONS = [Search, Shield, RefreshCw, ShieldCheck] as const;
const INFRA_ICONS = [UserCheck, Database, Lock, KeyRound] as const;

function SecurityPage() {
  const locale = useLocale();
  const t = useT();
  const content = securityFor(locale);

  return (
    <PageLayout breadcrumbs={[{ label: t("link.security") }]}>
      <PageHero eyebrow={content.eyebrow} title={content.title} lede={content.lede}>
        {/* The one piece of visual weight in the hero: the product's own mark,
            not a stock illustration. Stacks under the text on small screens. */}
        <div className="flex max-w-[680px] items-center gap-4 rounded-2xl border border-primary/40 bg-pale-green/40 p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10">
            <ShieldCheck className="size-6 text-primary" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium leading-relaxed text-navy">{content.heroNote}</p>
        </div>
      </PageHero>

      {/* 1 — the four pillars */}
      <Section title={content.overview.title} lede={content.overview.lede}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.overview.pillars.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.icon];
            return (
              <div
                key={pillar.title}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-pale-green">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-bold text-navy">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 2 — encryption, split layout */}
      <Section title={content.encryption.title} lede={content.encryption.lede} muted>
        <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="grid size-16 place-items-center rounded-2xl border border-border bg-card shadow-card">
            <Lock className="size-7 text-primary" aria-hidden="true" />
          </div>
          <ul className="grid gap-3">
            {content.encryption.points.map((point) => (
              <li
                key={point}
                className="flex gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <FileCheck2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-sm leading-relaxed text-navy">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 3 — account security */}
      <Section title={content.account.title} lede={content.account.lede}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.account.points.map((point) => (
            <div
              key={point.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <h3 className="text-[15px] font-bold text-navy">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 4 — what happens to a document */}
      <Section title={content.documents.title} lede={content.documents.lede} muted>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.documents.steps.map((step, index) => {
            const Icon = STEP_ICONS[step.icon];
            return (
              <li
                key={step.title}
                className="relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <span className="text-xs font-semibold tabular-nums text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-3 grid size-10 place-items-center rounded-lg bg-pale-blue">
                  <Icon className="size-5 text-navy" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-bold text-navy">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 max-w-[820px] rounded-2xl border border-primary/40 bg-pale-green/40 p-5 text-sm leading-relaxed text-navy">
          {content.documents.note}
        </p>
      </Section>

      {/* 5 — infrastructure */}
      <Section title={content.infrastructure.title} lede={content.infrastructure.lede}>
        <div className="grid gap-4 sm:grid-cols-2">
          {content.infrastructure.points.map((point, index) => {
            const Icon = INFRA_ICONS[index % INFRA_ICONS.length]!;
            return (
              <div
                key={point.title}
                className="flex gap-4 rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-pale-green">
                  <Icon className="size-5 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold text-navy">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 6 — access control */}
      <Section title={content.access.title} lede={content.access.lede} muted>
        <div className="grid max-w-[820px] gap-4">
          {content.access.body.map((paragraph) => (
            <p
              key={paragraph}
              className="rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-navy shadow-card"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </Section>

      {/* 7 — payments */}
      <Section title={content.payments.title} lede={content.payments.lede}>
        <ul className="grid max-w-[820px] gap-3">
          {content.payments.points.map((point) => (
            <li
              key={point}
              className="flex gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <Lock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm leading-relaxed text-navy">{point}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 8 — security as a process */}
      <Section title={content.monitoring.title} lede={content.monitoring.lede} muted>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.monitoring.stages.map((stage, index) => {
            const Icon = STAGE_ICONS[index % STAGE_ICONS.length]!;
            return (
              <li
                key={stage.title}
                className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-pale-blue">
                  <Icon className="size-5 text-navy" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[15px] font-bold text-navy">{stage.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{stage.body}</p>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* 9 — what the reader can do */}
      <Section title={content.userTips.title} lede={content.userTips.lede}>
        <ul className="grid max-w-[820px] gap-3 sm:grid-cols-2">
          {content.userTips.tips.map((tip) => (
            <li
              key={tip}
              className="flex gap-3 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm leading-relaxed text-navy">{tip}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 10 — reporting a vulnerability */}
      <Section muted>
        <div className="grid items-center gap-6 rounded-2xl border border-border bg-card px-6 py-8 shadow-card sm:grid-cols-[1fr_auto] sm:px-10">
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold tracking-tight text-navy sm:text-[24px]">
              {content.report.title}
            </h2>
            <p className="mt-3 max-w-[620px] text-sm leading-relaxed text-muted-foreground">
              {content.report.body}
            </p>
          </div>
          <Button asChild size="lg" variant="outline" className="rounded-lg font-semibold">
            <AppLink href={path("contact", locale)}>{content.report.cta}</AppLink>
          </Button>
        </div>
      </Section>

      {/* 11 — closing call to action */}
      <Section>
        <div className="grid items-center gap-6 rounded-2xl bg-primary px-6 py-8 sm:grid-cols-[1fr_auto] sm:px-10">
          <div className="min-w-0">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-foreground/15">
              <ShieldCheck className="size-6 text-primary-foreground" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-[20px] font-bold tracking-tight text-primary-foreground sm:text-[24px]">
              {content.finalCta.title}
            </h2>
            <p className="mt-3 max-w-[620px] text-sm leading-relaxed text-primary-foreground/90">
              {content.finalCta.body}
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="rounded-lg font-semibold">
            <AppLink href={path(authSlugs.signup, locale)}>
              {content.finalCta.cta}
              {/* Points along the reading direction in both scripts. rotate-180
                  rather than a mirrored glyph, matching the one RTL icon
                  pattern already proven in this codebase. */}
              <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </AppLink>
          </Button>
        </div>
      </Section>
    </PageLayout>
  );
}
