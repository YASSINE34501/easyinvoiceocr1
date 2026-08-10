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
import { authSlugs, path } from "@/config/nav";
import { homepageProducts } from "@/config/products";
import { getPublicPlans } from "@/lib/billing/billing.functions";
import { useLocale, useT } from "@/i18n/useLocale";
import type { Locale } from "@/i18n";
import type { MessageKey } from "@/i18n";
import { cn } from "@/lib/utils";

const Container = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>
);

export function Hero() {
  const home = homeFor(useLocale() as Locale);
  const { hero } = home;
  return (
    <section className="hero-glow border-b border-border/70">
      <Container className="grid gap-10 py-12 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-14 lg:py-16">
        <div className="min-w-0">
          <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight text-navy sm:text-[44px] lg:text-[48px]">
            {hero.h1Line1}
            <br className="hidden sm:block" /> {hero.h1Line2}
          </h1>
          <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-muted-foreground">
            {hero.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-xl px-6 text-[15px] font-semibold">
              <a href="#upload">
                <Upload className="size-4" aria-hidden="true" /> {hero.primaryCta}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-border px-6 text-[15px] font-semibold text-navy"
            >
              <a href="#how-it-works">
                <Play className="size-4" aria-hidden="true" /> {hero.secondaryCta}
              </a>
            </Button>
          </div>
          <ul className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {hero.badges.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <UploadCard />
      </Container>
    </section>
  );
}

const marks = ["cube", "target", "peaks", "chevrons", "dots", "waves"];

export function AudienceStrip() {
  const { audience } = homeFor(useLocale() as Locale);
  return (
    <section className="bg-surface py-10">
      <Container>
        <h2 className="text-center text-sm font-semibold text-navy">{audience.heading}</h2>
        <ul className="mt-7 grid grid-cols-3 items-center gap-6 sm:grid-cols-6">
          {marks.map((m) => (
            <li key={m} className="flex justify-center">
              <AbstractMark variant={m} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function AbstractMark({ variant }: { variant: string }) {
  const cls = "size-9 text-navy/25";
  switch (variant) {
    case "cube":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
          <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.3 6.6 3.7L12 11.7 5.4 8 12 4.3Z" />
        </svg>
      );
    case "target":
      return (
        <svg
          viewBox="0 0 24 24"
          className={cls}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case "peaks":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
          <path d="M2 20 9 6l4 8 3-5 6 11H2Z" />
        </svg>
      );
    case "chevrons":
      return (
        <svg
          viewBox="0 0 24 24"
          className={cls}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
        >
          <path d="m7 6 5 6-5 6M15 6l5 6-5 6" />
        </svg>
      );
    case "dots":
      return (
        <svg viewBox="0 0 24 24" className={cls} fill="currentColor" aria-hidden="true">
          {[4, 9, 14, 19].map((y) =>
            [4, 9, 14, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" />),
          )}
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className={cls}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M2 9c3-3 5 3 8 0s5 3 8 0M2 15c3-3 5 3 8 0s5 3 8 0" />
        </svg>
      );
  }
}

/**
 * Every homepage product card comes from the product registry, so adding a
 * product there puts it on the homepage, in the nav, in the footer and in the
 * sitemap without touching this file again.
 */
export function ProductCards() {
  const locale = useLocale();
  return (
    <section className="bg-surface pb-8">
      <Container className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {homepageProducts.map((product) => {
          const Icon = product.icon;
          const copy = product.copy[locale];
          return (
            <AppLink
              key={product.slug}
              href={path(product.slug, locale)}
              className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-pale-green">
                <Icon className="size-4 text-primary" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-navy">{copy.name}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{copy.card}</p>
            </AppLink>
          );
        })}
      </Container>
    </section>
  );
}

export function LanguageStrip() {
  const { languages } = homeFor(useLocale() as Locale);
  return (
    <section className="bg-surface pb-12">
      <Container>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-xl border border-border bg-card px-6 py-3.5 text-xs text-muted-foreground shadow-card">
          <span className="flex items-center gap-1.5 font-semibold text-navy">
            <Globe className="size-4" aria-hidden="true" /> {languages.label}
          </span>
          {/* Exactly the models that ship. The previous list advertised six
              languages, three of which had no recognition model at all. */}
          {languages.items.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function HowItWorks() {
  const { howItWorks } = homeFor(useLocale() as Locale);
  const steps = howItWorks.steps.map((step, index) => ({ n: index + 1, ...step }));
  return (
    <section id="how-it-works" className="py-16">
      <Container>
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy sm:text-[28px]">
          {howItWorks.heading}
        </h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="relative">
              <div className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {s.n}
                </span>
                <h3 className="text-[15px] font-semibold text-navy">{s.title}</h3>
              </div>
              <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
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
    <section className="bg-surface py-16">
      <Container className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-[28px]">
            {extract.heading}
          </h2>
          <p className="mt-4 max-w-[400px] text-sm leading-relaxed text-muted-foreground">
            {extract.description}
          </p>
          <ul className="mt-6 space-y-3">
            {fields.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-navy">
                <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <figure
          className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-panel sm:grid-cols-[1.4fr_1fr]"
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
    <section className="py-16">
      <Container>
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy sm:text-[28px]">
          {copy.heading}
        </h2>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflows.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-panel"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-pale-blue">
                <Icon className="size-4 text-navy" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-navy">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
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
    <section className="bg-surface py-16">
      <Container>
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy sm:text-[28px]">
          {copy.heading}
        </h2>
        <p className="mx-auto mt-3 max-w-[640px] text-center text-sm text-muted-foreground">
          {copy.description}
        </p>
        <div className="mt-9 grid gap-8 md:grid-cols-3">
          {global.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-pale-blue">
                <Icon className="size-4 text-navy" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-navy">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
              </div>
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
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy sm:text-[28px]">
          {t("pricing.heading")}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t("free.tryFree")} — {t("free.noCard")}. {t("free.afterFive")}.
        </p>

        {(isError || unavailable) && (
          <p className="mt-6 text-center text-sm text-muted-foreground">{t("plan.unavailable")}</p>
        )}

        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-full border border-border bg-surface p-1">
            {[
              [t("pricing.monthly"), false],
              [t("pricing.yearly"), true],
            ].map(([label, val]) => (
              <button
                key={String(label)}
                onClick={() => setYearly(Boolean(val))}
                aria-pressed={yearly === val}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
                  yearly === val ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {String(label)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={cn(
                "relative rounded-2xl border border-border bg-card p-6 shadow-card",
                p.popular && "border-primary shadow-panel",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-navy">{p.name}</h3>
                {p.popular && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
                    {t("pricing.mostPopular")}
                  </span>
                )}
              </div>
              <p className="mt-4">
                <span className="text-3xl font-extrabold text-navy">
                  {yearly && p.yearlyPrice === null
                    ? "—"
                    : `$${yearly ? p.yearlyPrice : p.monthlyPrice}`}
                </span>
                <span className="ms-1 text-xs text-muted-foreground">
                  {yearly ? t("plan.perYear") : t("plan.perMonth")}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{p.blurb}</p>
              <ul className="mt-5 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-navy">
                    <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={p.popular ? "default" : "outline"}
                className={cn(
                  "mt-6 h-10 w-full rounded-lg font-semibold",
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
    <section className="pb-16">
      <Container className="max-w-[860px]">
        <h2 className="text-center text-2xl font-bold tracking-tight text-navy sm:text-[28px]">
          {faq.heading}
        </h2>
        <Accordion type="single" collapsible className="mt-8 space-y-3">
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
        <div className="grid items-center gap-6 rounded-2xl bg-primary px-6 py-8 sm:grid-cols-[1fr_auto] sm:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <span className="hidden size-12 shrink-0 place-items-center rounded-full bg-primary-foreground/15 sm:grid">
              <Download className="size-5 text-primary-foreground" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-primary-foreground sm:text-2xl">
                {finalCta.heading}
              </h2>
              <p className="mt-1.5 text-sm text-primary-foreground/85">{finalCta.body}</p>
            </div>
          </div>
          <div className="text-center">
            <Button
              asChild
              variant="secondary"
              className="h-11 w-full rounded-lg px-6 font-semibold text-navy sm:w-auto"
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
