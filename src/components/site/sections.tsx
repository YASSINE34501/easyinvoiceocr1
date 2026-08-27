import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Code2,
  Download,
  Globe,
  Languages,
  Play,
  Receipt,
  Shield,
  Sparkles,
  Upload,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { UploadCard } from "./UploadCard";
import { AppLink } from "./AppLink";
import { homeFor } from "@/content/home";
import { authSlugs, path, solutionLinks } from "@/config/nav";
import { homepageProducts } from "@/config/products";
import { getPublicPlans } from "@/lib/billing/billing.functions";
import { useLocale, useT } from "@/i18n/useLocale";
import type { Locale } from "@/i18n";
import type { MessageKey } from "@/i18n";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const Container = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>
);

/**
 * One header for every section.
 *
 * The page previously had three different heading treatments — centred bold,
 * centred bold with a lede, and a bare left-aligned h2 — which is why it read
 * as a stack of unrelated blocks rather than one page.
 */
function SectionHead({
  eyebrow,
  title,
  lede,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "center" | "start";
}) {
  const centred = align === "center";
  return (
    <div className={cn("max-w-[720px]", centred && "mx-auto text-center")}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2
        className={cn(
          "text-[26px] font-bold leading-tight tracking-[-0.02em] text-navy sm:text-[32px]",
          eyebrow && "mt-3",
        )}
      >
        {title}
      </h2>
      {lede && (
        <p className={cn("mt-4 text-[15px] leading-relaxed text-ink-soft", centred && "mx-auto")}>
          {lede}
        </p>
      )}
    </div>
  );
}

export function Hero() {
  const home = homeFor(useLocale() as Locale);
  const { hero, languages } = home;
  return (
    <section className="hero-glow relative overflow-hidden border-b border-border/70">
      <Container className="relative grid gap-12 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:py-20">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/80 py-1.5 ps-2 pe-3.5 text-xs font-semibold text-accent-foreground shadow-card backdrop-blur">
            <span className="grid size-5 place-items-center rounded-full bg-pale-green">
              <Sparkles className="size-3 text-primary" aria-hidden="true" />
            </span>
            {languages.label}
            <span className="text-muted-foreground">{languages.items.join(" · ")}</span>
          </p>

          <h1 className="mt-5 text-balance text-[34px] font-extrabold leading-[1.08] tracking-[-0.025em] text-navy sm:text-[40px] lg:text-[44px] xl:text-[48px]">
            {hero.h1Line1} <span className="brand-text">{hero.h1Line2}</span>
          </h1>

          <p className="mt-6 max-w-[52ch] text-pretty text-[16px] leading-[1.65] text-ink-soft">
            {hero.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-xl px-7 text-[15px] font-semibold shadow-glow sm:w-auto"
            >
              <a href="#upload">
                <Upload className="size-4" aria-hidden="true" /> {hero.primaryCta}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-xl border-border bg-card/70 px-6 text-[15px] font-semibold text-navy backdrop-blur sm:w-auto"
            >
              <a href="#how-it-works">
                <Play className="size-4" aria-hidden="true" /> {hero.secondaryCta}
              </a>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-[13px] text-muted-foreground">
            {hero.badges.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* The upload card is the subject of the hero, so it gets the one
            brand-tinted shadow on the page. */}
        <div className="relative">
          <div
            className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/5 blur-2xl"
            aria-hidden="true"
          />
          <UploadCard />
        </div>
      </Container>
    </section>
  );
}

const audienceIcons: LucideIcon[] = [Building2, Receipt, BadgeCheck, Code2];

export function AudienceStrip() {
  const locale = useLocale();
  const t = useT();
  const { audience } = homeFor(locale as Locale);

  return (
    <section className="border-b border-border/70 bg-surface py-12">
      <Container>
        <h2 className="text-center text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {audience.heading}
        </h2>
        <ul className="mx-auto mt-7 grid max-w-[900px] grid-cols-2 gap-3 sm:grid-cols-4">
          {solutionLinks.map((link, index) => {
            const Icon = audienceIcons[index] ?? Building2;
            return (
              <li key={link.slug}>
                <AppLink
                  href={path(link.slug, locale)}
                  className="card-lift flex h-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-card"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-pale-blue">
                    <Icon className="size-4 text-navy" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 text-[13px] font-semibold text-navy">
                    {t(link.labelKey)}
                  </span>
                </AppLink>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

/**
 * Every homepage product card comes from the product registry, so adding a
 * product there puts it on the homepage, in the nav, in the footer and in the
 * sitemap without touching this file again.
 */
export function ProductCards() {
  const locale = useLocale();
  return (
    <section className="bg-surface pb-10 pt-12">
      <Container className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {homepageProducts.map((product) => {
          const Icon = product.icon;
          const copy = product.copy[locale];
          return (
            <AppLink
              key={product.slug}
              href={path(product.slug, locale)}
              className="card-lift group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-pale-green">
                <Icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-navy">{copy.name}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted-foreground">
                {copy.card}
              </p>
              <ArrowRight
                className="mt-4 hidden size-4 text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:block rtl:rotate-180"
                aria-hidden="true"
              />
            </AppLink>
          );
        })}
      </Container>
    </section>
  );
}

export function HowItWorks() {
  const { howItWorks } = homeFor(useLocale() as Locale);
  const steps = howItWorks.steps.map((step, index) => ({ n: index + 1, ...step }));
  return (
    <section id="how-it-works" className="py-20">
      <Container>
        <SectionHead title={howItWorks.heading} />
        <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* The rule ties the three steps into one sequence. Hidden on small
              screens, where the steps stack and the line would run sideways
              through nothing. */}
          <span
            className="absolute inset-x-0 top-4 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
            aria-hidden="true"
          />
          {steps.map((s) => (
            <li key={s.n} className="relative">
              <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-glow ring-8 ring-background">
                {s.n}
              </span>
              <h3 className="mt-5 text-[16px] font-semibold text-navy">{s.title}</h3>
              <p className="mt-2.5 max-w-[320px] text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

export function ExtractSection() {
  const { extract } = homeFor(useLocale() as Locale);
  const fields = extract.fields;
  return (
    <section className="border-y border-border/70 bg-surface py-20">
      <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="min-w-0">
          <SectionHead title={extract.heading} lede={extract.description} align="start" />
          <ul className="mt-7 space-y-3">
            {fields.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-navy">
                <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <figure
          className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-lift sm:grid-cols-[1.4fr_1fr]"
          aria-label={extract.previewAlt}
        >
          <InvoicePreview sampleLabel={extract.sampleLabel} />
          <ExtractedPanel
            title={extract.panelTitle}
            confidenceLabel={extract.confidenceLabel}
            labels={extract.sampleFieldLabels}
          />
        </figure>
      </Container>
    </section>
  );
}

function InvoicePreview({ sampleLabel }: { sampleLabel: string }) {
  return (
    <div className="rounded-xl border border-border p-4 text-[10px] text-muted-foreground">
      {/* Labelled so a made-up invoice and a made-up confidence figure cannot
          be read as a measured result. */}
      <p className="mb-2 inline-block rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {sampleLabel}
      </p>
      <div className="flex items-start justify-between">
        <p className="text-sm font-bold tracking-tight text-navy">INVOICE</p>
        <div className="text-right">
          <p>INVOICE # INV-10023</p>
          <p>DATE: May 18, 2024</p>
        </div>
      </div>
      <div className="mt-4">
        <p className="font-semibold text-navy">BILL TO</p>
        <p className="mt-1 text-navy">Acme Corporation</p>
        <p>123 Business Rd.</p>
        <p>New York, NY 10001</p>
      </div>
      <table className="mt-4 w-full">
        <thead className="border-y border-border text-navy">
          <tr>
            {["Description", "Qty", "Unit Price", "Amount"].map((h) => (
              <th key={h} className="py-1.5 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Web Design", "1", "$1,200.00", "$1,200.00"],
            ["Hosting (1 Year)", "1", "$150.00", "$150.00"],
            ["SEO Setup", "1", "$350.00", "$350.00"],
          ].map((r) => (
            <tr key={r[0]} className="border-b border-border/70">
              {r.map((c, i) => (
                <td key={i} className="py-1.5">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 space-y-1 text-right">
        <p>Subtotal $1,700.00</p>
        <p>Tax (8.5%) $144.50</p>
        <p className="text-[11px] font-bold text-navy">Total $1,844.50</p>
      </div>
    </div>
  );
}

/** Sample values from the specimen invoice. The labels are localised; the
    values are not, because they belong to an English example document. */
const sampleValues = ["Acme Corporation", "INV-10023", "May 18, 2024", "$1,844.50", "USD"];

function ExtractedPanel({
  title,
  confidenceLabel,
  labels,
}: {
  title: string;
  confidenceLabel: string;
  labels: readonly string[];
}) {
  const extracted = labels.map((label, index) => [label, sampleValues[index] ?? ""] as const);
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold text-navy">{title}</p>
      <dl className="mt-3 space-y-3">
        {extracted.map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</dt>
            <dd className="text-[11px] font-medium text-navy">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-pale-green px-2.5 py-1.5 text-[10px] font-semibold text-accent-foreground">
        <BadgeCheck className="size-3.5" aria-hidden="true" /> {confidenceLabel}: 99.2%
      </p>
    </div>
  );
}

/** Icons stay here; the words come from the locale content. */
const workflowIcons = [Building2, Receipt, Sparkles, Code2];

export function Workflows() {
  const { workflows: copy } = homeFor(useLocale() as Locale);
  const workflows = copy.cards.map((card, index) => ({
    icon: workflowIcons[index] ?? Building2,
    ...card,
  }));
  return (
    <section className="py-20">
      <Container>
        <SectionHead title={copy.heading} />
        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflows.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="card-lift rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-pale-blue">
                <Icon className="size-5 text-navy" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-navy">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

const globalIcons = [Languages, CircleDollarSign, Shield];

export function GlobalSection() {
  const { global: copy } = homeFor(useLocale() as Locale);
  const global = copy.cards.map((card, index) => ({
    icon: globalIcons[index] ?? Languages,
    ...card,
  }));
  return (
    <section className="border-y border-border/70 bg-surface py-20">
      <Container>
        <SectionHead title={copy.heading} lede={copy.description} />
        <div className="mt-11 grid gap-6 md:grid-cols-3">
          {global.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <span className="grid size-10 place-items-center rounded-xl bg-pale-green">
                <Icon className="size-5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-navy">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/**
 * Pricing reads the live plan rows, so a price or a limit changed in the admin
 * console is what visitors see. There is no hard-coded price in this file.
 */
export function Pricing() {
  const [yearly, setYearly] = useState(false);
  const locale = useLocale();
  const t = useT();

  const {
    data: livePlans = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["public-plans"],
    queryFn: () => getPublicPlans(),
    staleTime: 300_000,
  });

  // An empty list is as much a failure as an error, from the visitor's side:
  // either way there is no pricing to read, and saying so beats a blank section.
  const unavailable = !isLoading && livePlans.length === 0;

  // Prices and limits come from the database; wording comes from the
  // dictionary, because a plan row stores one language only and rendering the
  // stored English on the French or Arabic page produces a mixed-language card.
  const plans = livePlans.map((plan) => {
    const isTrial = plan.code === "trial";
    const megabytes = Math.round(plan.maxFileSize / (1024 * 1024));
    const comingSoon = plan.comingSoon ?? [];

    return {
      id: plan.id,
      code: plan.code,
      name: t(`plan.name_${plan.code}` as MessageKey, {}) || plan.name,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      blurb: t(`plan.blurb_${plan.code}` as MessageKey, {}) || plan.description,
      popular: plan.code === "pro",
      features: [
        // The trial is counted in conversions, so showing it a page quota of
        // zero would read as "you get nothing".
        isTrial && plan.conversionAllowance !== null
          ? t("plan.freeConversions", { count: plan.conversionAllowance })
          : t("plan.pagesPerPeriod", { pages: plan.monthlyPageLimit }),
        ...(isTrial && plan.maxPagesPerConversion > 0
          ? [t("plan.maxPagesPerConversion", { pages: plan.maxPagesPerConversion })]
          : []),
        t("plan.maxFile", { mb: megabytes }),
        plan.batchEnabled
          ? t("plan.batchFiles", { files: plan.batchMaxFiles })
          : t("plan.oneFileAtATime"),
        plan.adsEnabled ? t("plan.adsShown") : t("plan.noAds"),
        t("plan.exports", {
          formats: (plan.features.exports ?? []).join(", ").toUpperCase() || "—",
        }),
        // Sold but not built. Listed explicitly so the card never implies these
        // are active, and entitlement logic ignores them entirely.
        ...(comingSoon.length > 0
          ? [t("plan.comingSoon", { features: comingSoon.join(", ") })]
          : []),
      ],
    };
  });

  return (
    <section id="pricing" className="py-16">
      <Container>
        <SectionHead
          title={t("pricing.heading")}
          lede={`${t("free.tryFree")} — ${t("free.noCard")}. ${t("free.afterFive")}.`}
        />

        {(isError || unavailable) && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{t("plan.unavailable")}</p>
        )}

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-surface p-1 shadow-card">
            {[
              [t("pricing.monthly"), false],
              [t("pricing.yearly"), true],
            ].map(([label, val]) => (
              <button
                key={String(label)}
                onClick={() => setYearly(Boolean(val))}
                aria-pressed={yearly === val}
                className={cn(
                  "rounded-full px-5 py-2 text-xs font-semibold transition-colors",
                  yearly === val
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:text-navy",
                )}
              >
                {String(label)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid items-start gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={cn(
                "relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-card",
                // The recommended plan is raised rather than merely outlined,
                // so the eye lands on it before it reads three equal columns.
                p.popular && "border-primary/60 shadow-lift md:-mt-3 md:py-8",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-navy">{p.name}</h3>
                {p.popular && (
                  <span className="brand-surface rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    {t("pricing.mostPopular")}
                  </span>
                )}
              </div>
              <p className="mt-5">
                <span className="text-[40px] font-extrabold leading-none tracking-[-0.03em] text-navy">
                  {yearly && p.yearlyPrice === null
                    ? "—"
                    : `$${yearly ? p.yearlyPrice : p.monthlyPrice}`}
                </span>
                <span className="ms-1 text-xs text-muted-foreground">
                  {yearly ? t("plan.perYear") : t("plan.perMonth")}
                </span>
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{p.blurb}</p>
              <ul className="mt-6 flex-1 space-y-3 border-t border-border pt-6">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[13px] leading-relaxed text-navy"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={p.popular ? "default" : "outline"}
                className={cn(
                  "mt-7 h-11 w-full rounded-xl font-semibold",
                  !p.popular && "border-border text-navy",
                )}
              >
                <AppLink href={path(authSlugs.choosePlan, locale)}>
                  {t("plan.choose", { plan: p.name })}
                </AppLink>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {t("choose.exclusive")}
        </p>
      </Container>
    </section>
  );
}

export function Faq() {
  const { faq } = homeFor(useLocale() as Locale);
  return (
    <section className="pb-20">
      <Container className="max-w-[860px]">
        <SectionHead title={faq.heading} />
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {faq.items.map((f, i) => (
            <AccordionItem
              key={f.q}
              value={`item-${i}`}
              className="rounded-xl border border-border bg-card px-4 shadow-card"
            >
              <AccordionTrigger className="text-left text-sm font-medium text-navy hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Container>
    </section>
  );
}

export function FinalCta() {
  const { finalCta } = homeFor(useLocale() as Locale);
  const t = useT();
  return (
    <section className="pb-16">
      <Container>
        <div className="brand-surface relative grid items-center gap-6 overflow-hidden rounded-3xl px-6 py-10 shadow-lift sm:grid-cols-[1fr_auto] sm:px-12">
          <div className="flex min-w-0 items-center gap-4">
            <span className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-primary-foreground/15 backdrop-blur sm:grid">
              <Download className="size-6 text-primary-foreground" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[22px] font-bold leading-tight tracking-[-0.01em] text-primary-foreground sm:text-[26px]">
                {finalCta.heading}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-primary-foreground/85">
                {finalCta.body}
              </p>
            </div>
          </div>
          <div className="text-center">
            <Button
              asChild
              variant="secondary"
              className="h-12 w-full rounded-xl px-7 font-semibold text-navy shadow-card sm:w-auto"
            >
              <a href="#upload">
                {finalCta.cta} <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </Button>
            <p className="mt-2 text-[11px] text-primary-foreground/80">{t("free.noCard")}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
