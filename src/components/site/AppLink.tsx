import { Link, useRouterState, type LinkComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
  lang?: string;
  target?: string;
  rel?: string;
  "aria-label"?: string;
  "aria-current"?: "page" | undefined;
};

/**
 * Router-aware link that accepts a plain string href from the nav config.
 * Keeps client-side navigation (no full page reload) for every internal link.
 */
export function AppLink({ href, children, className, onClick, ...rest }: AppLinkProps) {
  const isHash = href.startsWith("#");
  const isExternal = /^https?:|^mailto:/.test(href);

  if (isHash || isExternal) {
    return (
      <a href={href} className={className} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  }

  const [rawTo, hash] = href.split("#");
  // split() always yields at least one element, but noUncheckedIndexedAccess
  // types it as possibly undefined — fall back to the href itself.
  const to = (rawTo || href) as NonNullable<LinkComponentProps["to"]>;
  return (
    <Link to={to} {...(hash ? { hash } : {})} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}

export function useIsActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (href: string, exact = false) => {
    const to = href.split("#")[0]!;
    if (/^\/(en|fr|ar)$/.test(to)) return pathname === to;
    if (to === "/") return pathname === "/";
    return exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  };
}

export const Container = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>
);
