import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { PageHero, PageLayout, Section, breadcrumbJsonLd } from "@/components/site/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { translate, asLocale } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta, seoLinks } from "@/config/seo";

export const Route = createFileRoute("/$locale/contact")({
  component: ContactPage,
  head: ({ params }) => {
    const locale = asLocale(params.locale);
    const titles = {
      en: "Contact Us — EasyInvoiceOCR",
      fr: "Nous Contacter — EasyInvoiceOCR",
      ar: "اتصل بنا — EasyInvoiceOCR",
    };
    const descriptions = {
      en: "Get in touch with our support team. We respond to every message within two business days.",
      fr: "Contactez notre équipe d'assistance. Nous répondons à chaque message dans un délai de deux jours ouvrables.",
      ar: "تواصل مع فريق الدعم لدينا. نرد على كل رسالة في غضون يومي عمل.",
    };
    const title = titles[locale];
    const description = descriptions[locale];

    return {
      meta: [
        robotsMeta("contact"),
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      links: seoLinks("contact", locale),
      scripts: [
        {
          type: "application/ld+json",
          children: breadcrumbJsonLd([{ label: translate(locale, "link.contact") }]),
        },
      ],
    };
  },
});

function ContactPage() {
  const t = useT();
  const locale = useLocale();

  const [values, setValues] = useState({
    name: "",
    email: "",
    company: "",
    topic: "general",
    message: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formStatus, setFormStatus] = useState<null | "success" | "error">(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = z.object({
    name: z.string().trim().min(1, t("valid.nameRequired")).max(100, t("valid.nameTooLong")),
    email: z.string().trim().min(1, t("valid.emailRequired")).email(t("valid.emailInvalid")),
    company: z.string().trim().max(120).optional(),
    topic: z.enum(["general", "support", "sales", "billing", "privacy", "security", "api"]),
    message: z.string().trim().min(20, t("valid.messageShort")).max(2000, t("valid.messageLong")),
    // See the note in $locale.signup.tsx: z.literal drops the custom message.
    consent: z.boolean().refine((v) => v === true, { message: t("valid.consentRequired") }),
  });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormStatus(null);
    setErrors({});

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          company: parsed.data.company || "",
          topic: parsed.data.topic,
          message: parsed.data.message,
          locale,
        }),
      });

      if (!res.ok) {
        setFormStatus("error");
        setSubmitting(false);
        return;
      }

      setFormStatus("success");
      setValues({
        name: "",
        email: "",
        company: "",
        topic: "general",
        message: "",
        consent: false,
      });
    } catch {
      setFormStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  const labels = {
    en: {
      hero: "Contact Us",
      heroLede: "Have a question? We're here to help.",
      name: "Full name",
      email: "Email",
      company: "Company (optional)",
      topic: "Topic",
      message: "Message",
      consent: "I agree that EasyInvoiceOCR may store this message in order to reply to me.",
      send: "Send message",
      success:
        "Thanks — your message has been received and stored. We reply within two business days.",
      error: "We couldn't send your message. Please try again.",
      general: "General question",
      support: "Technical support",
      sales: "Sales",
      billing: "Billing",
      privacy: "Privacy",
      security: "Security",
      api: "API",
    },
    fr: {
      hero: "Nous Contacter",
      heroLede: "Vous avez une question ? Nous sommes là pour vous aider.",
      name: "Nom complet",
      email: "Email",
      company: "Entreprise (facultatif)",
      topic: "Sujet",
      message: "Message",
      consent: "J'accepte qu'EasyInvoiceOCR conserve ce message afin de pouvoir me répondre.",
      send: "Envoyer le message",
      success:
        "Merci - votre message a été reçu et stocké. Nous répondons dans un délai de deux jours ouvrables.",
      error: "Nous n'avons pas pu envoyer votre message. Veuillez réessayer.",
      general: "Question générale",
      support: "Support technique",
      sales: "Vente",
      billing: "Facturation",
      privacy: "Confidentialité",
      security: "Sécurité",
      api: "API",
    },
    ar: {
      hero: "اتصل بنا",
      heroLede: "لديك سؤال؟ نحن هنا للمساعدة.",
      name: "الاسم الكامل",
      email: "البريد الإلكتروني",
      company: "الشركة (اختياري)",
      topic: "الموضوع",
      message: "الرسالة",
      consent: "أوافق على أن EasyInvoiceOCR قد تحتفظ برسالتي من أجل الرد عليّ.",
      send: "إرسال الرسالة",
      success: "شكراً - تم استلام رسالتك وتخزينها. نرد خلال يومي عمل.",
      error: "لم نتمكن من إرسال رسالتك. يرجى المحاولة مرة أخرى.",
      general: "سؤال عام",
      support: "الدعم الفني",
      sales: "المبيعات",
      billing: "الفواتير",
      privacy: "الخصوصية",
      security: "الأمان",
      api: "واجهة برمجية",
    },
  };

  const l = labels[locale];

  return (
    <PageLayout breadcrumbs={[{ label: t("link.contact") }]}>
      <PageHero title={l.hero} lede={l.heroLede} />

      <Section>
        <div className="mx-auto max-w-xl">
          {formStatus === "success" && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              {l.success}
            </div>
          )}
          {formStatus === "error" && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {l.error}
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-navy">
                {l.name}
              </label>
              <Input
                id="name"
                type="text"
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                className={`mt-2 h-11 ${errors["name"] ? "border-red-500" : ""}`}
                aria-invalid={Boolean(errors["name"])}
                aria-describedby={errors["name"] ? "name-error" : undefined}
              />
              {errors["name"] && (
                <p id="name-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
                  {errors["name"]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy">
                {l.email}
              </label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                className={`mt-2 h-11 ${errors["email"] ? "border-red-500" : ""}`}
                aria-invalid={Boolean(errors["email"])}
                aria-describedby={errors["email"] ? "email-error" : undefined}
              />
              {errors["email"] && (
                <p id="email-error" role="alert" className="mt-1 text-xs font-medium text-red-600">
                  {errors["email"]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-navy">
                {l.company}
              </label>
              <Input
                id="company"
                type="text"
                value={values.company}
                onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
                className="mt-2 h-11"
              />
            </div>

            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-navy">
                {l.topic}
              </label>
              <select
                id="topic"
                value={values.topic}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    topic: e.target.value as
                      "general" | "support" | "sales" | "billing" | "privacy" | "security" | "api",
                  }))
                }
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="general">{l.general}</option>
                <option value="support">{l.support}</option>
                <option value="sales">{l.sales}</option>
                <option value="billing">{l.billing}</option>
                <option value="privacy">{l.privacy}</option>
                <option value="security">{l.security}</option>
                <option value="api">{l.api}</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-navy">
                {l.message}
              </label>
              <textarea
                id="message"
                value={values.message}
                onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
                rows={6}
                className={`mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ${
                  errors["message"] ? "border-red-500" : ""
                }`}
                aria-invalid={Boolean(errors["message"])}
                aria-describedby={errors["message"] ? "message-error" : undefined}
              />
              {errors["message"] && (
                <p
                  id="message-error"
                  role="alert"
                  className="mt-1 text-xs font-medium text-red-600"
                >
                  {errors["message"]}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="consent"
                  checked={values.consent}
                  onCheckedChange={(c) => setValues((v) => ({ ...v, consent: c === true }))}
                  aria-describedby={errors["consent"] ? "consent-error" : undefined}
                  className="mt-0.5"
                />
                <label htmlFor="consent" className="text-sm leading-relaxed text-muted-foreground">
                  {l.consent}
                </label>
              </div>
              {errors["consent"] && (
                <p id="consent-error" role="alert" className="text-xs font-medium text-red-600">
                  {errors["consent"]}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full rounded-lg font-semibold"
            >
              {submitting ? "Sending…" : l.send}
            </Button>
          </form>
        </div>
      </Section>
    </PageLayout>
  );
}
