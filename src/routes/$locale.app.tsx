import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { PageLayout, PageHero } from "@/components/site/PageLayout";
import { useLocale, useT } from "@/i18n/useLocale";
import { robotsMeta } from "@/config/seo";

/**
 * Client-side gate for the signed-in area. The session lives in localStorage,
 * so the check runs after hydration and unauthenticated visitors are sent to
 * the login page with a redirect back to where they were headed.
 */
export const Route = createFileRoute("/$locale/app")({
  ssr: false,
  component: AppLayout,
  // ssr:false stops the child routes from rendering on the server, and a
  // head that never runs emits no robots tag — every /app/* URL was served to
  // crawlers with no directive at all, which on an indexable deployment means
  // "index it". Declaring it on the layout covers the whole subtree, because
  // this route still matches server-side even though its component does not.
  head: () => ({ meta: [robotsMeta("app")] }),
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const locale = useLocale();
  const t = useT();

  useEffect(() => {
    if (loading || user) return;
    navigate({
      to: "/$locale/login",
      params: { locale },
      search: { redirect: window.location.pathname },
      replace: true,
    });
  }, [loading, user, navigate, locale]);

  if (loading || !user) {
    return (
      <PageLayout>
        <PageHero title={t("state.loading")} />
      </PageLayout>
    );
  }

  return <Outlet />;
}
