import { Fragment, useEffect, useState } from "react";
import { ChevronDown, Globe, Menu, X, User } from "lucide-react";
import { Logo } from "./Logo";
import { AppLink, useIsActive } from "./AppLink";
import { authSlugs, headerMenus, path } from "@/config/nav";
import { localeLabels, locales, type MessageKey } from "@/i18n";
import { useLocale, useT, swapLocale } from "@/i18n/useLocale";
import { useAuth, signOut } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PdfMegaMenu, PdfMenuMobile } from "@/components/pdftools/PdfMegaMenu";
import { toolAccent, toolIcon } from "@/components/pdftools/surface";
import { pdfToolsCopy } from "@/content/pdftools";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

type RenderedColumn = { title?: string; items: { label: string; href: string; slug: string }[] };

function NavDropdown({ label, columns }: { label: string; columns: RenderedColumn[] }) {
  const isActive = useIsActive();
  const sectionActive = columns.some((c) => c.items.some((i) => isActive(i.href)));
  const wide = columns.length > 1;

  return (
    <DropdownMenu>
      {/* Radix DropdownMenu: opens on click/Enter/Space, arrow-key navigable,
          closes on Escape and outside click, works with touch. */}
      <DropdownMenuTrigger
        className={cn(
          "flex min-h-11 items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-navy/80 transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:text-navy",
          sectionActive && "text-navy",
        )}
      >
        {label}
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn("rounded-xl", wide ? "w-[min(92vw,620px)] p-4" : "w-64")}
      >
        <div className={cn(wide && "grid gap-x-6 gap-y-4 sm:grid-cols-3")}>
          {columns.map((column, index) => (
            <div key={column.title ?? index}>
              {column.title && (
                <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {column.title}
                </p>
              )}
              {column.items.map((item) => {
                // A tool link carries its family accent; a page link (Help,
                // About, a solution) has no icon, which is what tells the two
                // apart at a glance.
                const Icon = toolIcon(item.slug);
                const accent = toolAccent(item.slug);
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <AppLink
                      href={item.href}
                      className={cn(
                        "cursor-pointer gap-2.5 text-sm",
                        isActive(item.href) && "font-semibold text-primary",
                      )}
                    >
                      {Icon && (
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-md",
                            accent.tile,
                          )}
                        >
                          <Icon className={cn("size-3.5", accent.glyph)} aria-hidden="true" />
                        </span>
                      )}
                      {item.label}
                    </AppLink>
                  </DropdownMenuItem>
                );
              })}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LanguageSelector({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("nav.language")}
        className={cn(
          "flex min-h-11 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Globe className="size-4 opacity-70" aria-hidden="true" />
        {/* The code is the visible label; the full name is what is
            announced, so a screen reader does not hear "ar العربية". */}
        <span className="uppercase" aria-hidden="true">
          {locale}
        </span>
        <span className="sr-only">{localeLabels[locale]}</span>
        <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl">
        {locales.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <AppLink
              href={swapLocale(pathname, l)}
              className={cn("cursor-pointer text-sm", l === locale && "font-semibold text-primary")}
              lang={l}
            >
              {localeLabels[l]}
            </AppLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locale = useLocale();
  const t = useT();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const menus = headerMenus.map((menu) => ({
    title: t(menu.titleKey as MessageKey),
    columns: menu.columns.map((column) => ({
      ...(column.titleKey ? { title: t(column.titleKey) } : {}),
      items: column.items.map((i) => ({
        label: t(i.labelKey),
        href: path(i.slug, locale),
        slug: i.slug,
      })),
    })),
  }));

  const accountHref = path(authSlugs.settings, locale);
  const dashboardHref = path(authSlugs.app, locale);
  const loginHref = path(authSlugs.login, locale);
  const signupHref = path(authSlugs.signup, locale);

  /**
   * Signing out from anywhere on the site, not only from inside the account
   * area. The cached queries are cancelled and cleared first: they hold the
   * previous account's usage and billing rows, and leaving them in place shows
   * one person's figures to whoever signs in next on the same browser.
   *
   * Navigates through the router rather than assigning window.location, which
   * would reload the whole application to reach a page it already has.
   */
  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/$locale", params: { locale }, replace: true });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-[1200px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-6 xl:flex xl:justify-between">
        <AppLink href={path("", locale)} className="shrink-0" aria-label={t("nav.homeAria")}>
          <Logo />
        </AppLink>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label={t("nav.main")}>
          <NavDropdown key={menus[0]!.title} label={menus[0]!.title} columns={menus[0]!.columns} />
          <PdfMegaMenu />
          {menus.slice(1).map((menu) => (
            <NavDropdown key={menu.title} label={menu.title} columns={menu.columns} />
          ))}
          <AppLink
            href={`${path("", locale)}#pricing`}
            className="rounded-md px-2 py-1.5 text-sm font-medium text-navy/80 transition-colors hover:text-navy"
          >
            {t("nav.pricing")}
          </AppLink>
        </nav>

        <div className="hidden items-center gap-2.5 xl:flex">
          <LanguageSelector />
          {!loading && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-9 rounded-lg px-4 font-semibold">
                  <User className="size-4" aria-hidden="true" />
                  {t("cta.account")}
                  <ChevronDown className="size-4 opacity-70" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                {/* The address identifies which account is signed in — worth
                    showing when someone keeps a work and a personal login. */}
                <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">{user.email}</p>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <AppLink href={dashboardHref}>{t("cta.dashboard")}</AppLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <AppLink href={accountHref}>{t("account.title")}</AppLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>{t("cta.logout")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <AppLink
                href={loginHref}
                className="whitespace-nowrap text-sm font-medium text-navy/80 transition-colors hover:text-navy"
              >
                {t("cta.login")}
              </AppLink>
              <Button asChild size="sm" className="h-9 rounded-lg px-4 font-semibold">
                <AppLink href={signupHref}>{t("cta.startFree")}</AppLink>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="grid size-11 place-items-center rounded-lg border border-border text-navy xl:hidden"
              aria-label={open ? t("nav.menuClose") : t("nav.menuOpen")}
              aria-expanded={open}
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </SheetTrigger>
          {/* Radix Dialog locks background scroll and traps focus while open. */}
          {/* The drawer header below renders its own close button: translated,
              a full 44px, and on the correct side in Arabic. */}
          <SheetContent
            side="right"
            showClose={false}
            className="w-full max-w-sm overflow-x-hidden p-0"
          >
            <SheetTitle className="sr-only">{t("nav.siteNavigation")}</SheetTitle>
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                aria-label={t("nav.menuClose")}
                className="grid size-11 place-items-center rounded-lg border border-border"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <nav className="overflow-y-auto px-4 py-2 pb-10" aria-label={t("nav.mobile")}>
              <Accordion type="single" collapsible>
                {menus.map((menu, index) => (
                  <Fragment key={menu.title}>
                    <AccordionItem value={menu.title}>
                      <AccordionTrigger className="text-sm font-semibold text-navy">
                        {menu.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pb-1">
                          {menu.columns.map((column, columnIndex) => (
                            <div key={column.title ?? columnIndex}>
                              {column.title && (
                                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                  {column.title}
                                </p>
                              )}
                              <ul>
                                {column.items.map((item) => {
                                  const Icon = toolIcon(item.slug);
                                  const accent = toolAccent(item.slug);
                                  return (
                                    <li key={item.href}>
                                      <AppLink
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-2.5 py-2.5 text-sm text-muted-foreground"
                                      >
                                        {Icon && (
                                          <span
                                            className={cn(
                                              "grid size-6 shrink-0 place-items-center rounded-md",
                                              accent.tile,
                                            )}
                                          >
                                            <Icon
                                              className={cn("size-3.5", accent.glyph)}
                                              aria-hidden="true"
                                            />
                                          </span>
                                        )}
                                        {item.label}
                                      </AppLink>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    {/* Same order as the desktop row. */}
                    {index === 0 && (
                      <AccordionItem value="pdf-tools-menu">
                        <AccordionTrigger className="text-sm font-semibold text-navy">
                          {pdfToolsCopy(locale).index.eyebrow}
                        </AccordionTrigger>
                        <AccordionContent>
                          <PdfMenuMobile onNavigate={() => setOpen(false)} />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Fragment>
                ))}
              </Accordion>
              <AppLink
                href={`${path("", locale)}#pricing`}
                onClick={() => setOpen(false)}
                className="block border-b border-border py-4 text-sm font-semibold text-navy"
              >
                {t("nav.pricing")}
              </AppLink>
              <div className="flex items-center justify-between py-4">
                <LanguageSelector className="px-0" />
                {!loading && user ? (
                  <AppLink
                    href={accountHref}
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-navy"
                  >
                    {t("cta.account")}
                  </AppLink>
                ) : (
                  <AppLink
                    href={loginHref}
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-navy"
                  >
                    {t("cta.login")}
                  </AppLink>
                )}
              </div>
              {!loading && user ? (
                // The desktop header hides these behind a dropdown; on a phone
                // the sheet is already the menu, so they are listed outright.
                <div className="flex flex-col gap-2">
                  <Button asChild variant="outline" className="w-full rounded-lg font-semibold">
                    <AppLink href={dashboardHref} onClick={() => setOpen(false)}>
                      {t("cta.dashboard")}
                    </AppLink>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full rounded-lg font-semibold"
                    onClick={() => {
                      setOpen(false);
                      void handleSignOut();
                    }}
                  >
                    {t("cta.logout")}
                  </Button>
                </div>
              ) : (
                <Button asChild className="w-full rounded-lg font-semibold">
                  <AppLink href={signupHref} onClick={() => setOpen(false)}>
                    {t("cta.startFree")}
                  </AppLink>
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
