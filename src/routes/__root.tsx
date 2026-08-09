import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/auth/AuthProvider";
import { BillingProvider } from "@/billing/BillingProvider";
import { CookieConsent } from "@/components/site/CookieConsent";
import { useVisitorSession } from "@/lib/analytics/useVisitorSession";
import { SOCIAL_IMAGE, absoluteUrl } from "@/config/seo";
import { localeDir, localeFromPathname, localeHtmlLang } from "@/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EasyInvoiceOCR" },
      { name: "description", content: "AI-powered invoice and receipt OCR." },
      { property: "og:site_name", content: "EasyInvoiceOCR" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#00a470" },
      // Default card art. A page may override og:image; without this a shared
      // link renders as a bare text stub.
      { property: "og:image", content: absoluteUrl(SOCIAL_IMAGE) },
      { name: "twitter:image", content: absoluteUrl(SOCIAL_IMAGE) },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon", sizes: "48x48" },
      // SVG first: browsers that support it get a mark that stays sharp at any
      // density, and the .ico remains for those that do not.
      { rel: "icon", href: "/icons/icon.svg", type: "image/svg+xml", sizes: "any" },
      { rel: "apple-touch-icon", href: "/icons/icon.svg" },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * The document shell.
 *
 * `lang` and `dir` are resolved from the URL here, during render, so they are
 * correct in the raw HTTP response. They were previously hard-coded to
 * `lang="en"` with no `dir` at all, and only corrected client-side after
 * hydration — so every crawler reading the initial HTML of /fr/* and /ar/*
 * was told the page was English left-to-right.
 *
 * The pathname is read from router state rather than from route params,
 * because the shell renders above the route tree and has no params of its own.
 * Deriving both attributes from the same value the server used to route the
 * request is what keeps the server and client markup identical, so there is no
 * hydration mismatch to warn about.
 */
function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const locale = localeFromPathname(pathname);

  return (
    <html lang={localeHtmlLang[locale]} dir={localeDir[locale]}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Mounts the visitor beacon once for the whole application.
 *
 * Renders nothing. It exists as a component only because the hook needs to run
 * inside the tree, and mounting it here rather than per route is what keeps it
 * to one beacon per session instead of one per navigation.
 */
function VisitorSession() {
  useVisitorSession();
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AuthProvider>
        <BillingProvider>
          <VisitorSession />
          <Outlet />
          <CookieConsent />
        </BillingProvider>
      </AuthProvider>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
