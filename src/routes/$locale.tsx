import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { isLocale, localeDir, localeHtmlLang, asLocale } from "@/i18n";
import { PageHero, PageLayout } from "@/components/site/PageLayout";
import { AppLink } from "@/components/site/AppLink";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) throw notFound();
  },
  component: LocaleLayout,
  notFoundComponent: LocaleNotFound,
  errorComponent: LocaleError,
});

function LocaleLayout() {
  const { locale } = Route.useParams();
  const l = asLocale(locale);

  // The document element lives in the root shell, so language and direction
  // are applied here where the active locale is known.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = localeHtmlLang[l];
    root.dir = localeDir[l];
  }, [l]);

  return <Outlet />;
}

function LocaleNotFound() {
  return (
    <PageLayout>
      <PageHero
        title="Page not found"
        lede="The page you're looking for doesn't exist or has been moved."
      >
        <Button asChild className="h-11 rounded-lg">
          <AppLink href="/en">Go to homepage</AppLink>
        </Button>
      </PageHero>
    </PageLayout>
  );
}

function LocaleError() {
  return (
    <PageLayout>
      <PageHero title="This page didn't load" lede="Please refresh, or head back to the homepage.">
        <Button asChild className="h-11 rounded-lg">
          <AppLink href="/en">Go to homepage</AppLink>
        </Button>
      </PageHero>
    </PageLayout>
  );
}
