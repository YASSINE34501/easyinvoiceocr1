import { Globe } from "lucide-react";
import { Logo } from "./Logo";
import { AppLink } from "./AppLink";
import { footerMenus, path } from "@/config/nav";
import { localeLabels } from "@/i18n";
import { useLocale, useT } from "@/i18n/useLocale";
import { openCookiePreferences } from "./CookieConsent";
import { PaymentMarks } from "./PaymentMarks";

export function Footer() {
  const locale = useLocale();
  const t = useT();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
          <div className="min-w-0">
            <Logo />
            <p className="mt-4 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          {footerMenus.map((col) => (
            <div key={col.titleKey} className="min-w-0">
              <h3 className="text-sm font-semibold text-navy">{t(col.titleKey)}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.slug}>
                    <AppLink
                      href={path(item.slug, locale)}
                      className="text-sm text-muted-foreground transition-colors hover:text-navy"
                    >
                      {t(item.labelKey)}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border">
        {/* Three groups, so the bar needs more room than the previous two did:
            it stays stacked and centred until lg, rather than crushing the
            payment marks against the copyright on a tablet. */}
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 py-5 text-center text-sm text-muted-foreground sm:px-6 lg:flex-row lg:justify-between lg:gap-6 lg:text-start">
          <p>
            © {new Date().getFullYear()} EasyInvoiceOCR. {t("footer.rights")}
          </p>
          <PaymentMarks label={t("footer.payments")} />

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={openCookiePreferences}
              className="underline-offset-4 transition-colors hover:text-navy hover:underline"
            >
              {t("footer.cookieSettings")}
            </button>
            <span className="inline-flex items-center gap-1.5">
              <Globe className="size-4" aria-hidden="true" /> {localeLabels[locale]}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
