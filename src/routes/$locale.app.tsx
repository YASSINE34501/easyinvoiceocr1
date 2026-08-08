import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { PageLayout, PageHero } from "@/components/site/PageLayout";
import { useLocale, useT } from "@/i18n/useLocale";

/**
 * Client-side gate for the signed-in area. The session lives in localStorage,
 * so the check runs after hydration and unauthenticated visitors are sent to
 * the login page with a redirect back to where they were headed.
 */
export const Route = createFileRoute("/$locale/app")({
  ssr: false,
  component: AppLayout,
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
