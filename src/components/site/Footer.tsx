import { Globe, ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";
import { AppLink } from "./AppLink";
import { footerColumns, path } from "@/config/nav";
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
        {/* Two columns on a phone so the short groups pair up instead of
            becoming one long scroll, then five once there is room: the brand
            and four link columns. items-start keeps the columns top-aligned
            when one runs longer than the rest. */}
        <div className="grid grid-cols-2 items-start gap-8 md:grid-cols-5 md:gap-10">
          <div className="col-span-2 min-w-0 md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-[240px] text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
            {/* Recognition runs in the browser, which is the strongest thing
                this site can say about privacy — worth saying beside the logo
                rather than only on the security page it links to. */}
            <AppLink
              href={path("security", locale)}
              className="mt-5 inline-flex max-w-[240px] items-start gap-2 text-xs leading-relaxed text-muted-foreground transition-colors hover:text-navy"
            >
              <ShieldCheck className="mt-px size-4 shrink-0 text-primary" aria-hidden="true" />
              {t("footer.security")}
            </AppLink>
          </div>

          {footerColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="min-w-0 space-y-8">
              {column.groups.map((group) => (
                <div key={group.titleKey}>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-navy">
                    {t(group.titleKey)}
                  </h3>
                  <ul className="space-y-2.5">
                    {group.items.map((item) => (
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
