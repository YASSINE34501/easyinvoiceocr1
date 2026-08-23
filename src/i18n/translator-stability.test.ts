import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * The translator must keep its identity between renders.
 *
 * useT used to build a new closure on every call. Everywhere that only renders
 * a string, that is invisible. In a dependency array it is not: an effect
 * listing `t`, or a useCallback derived from it, re-runs on every single
 * render. The PayPal button is owned by exactly such an effect and closes the
 * button on cleanup, so clicking "Subscribe" created the subscription at PayPal
 * and then destroyed the approval window on the re-render that
 * setStatus("approving") caused. The visitor saw nothing happen.
 *
 * There is no React renderer in this suite, so the guarantee is asserted
 * against the source: useT must memoise on the locale, and the PayPal effect
 * must not list values that churn.
 */

const useLocaleSrc = readFileSync("src/i18n/useLocale.ts", "utf8");
const payPalSrc = readFileSync("src/components/billing/PayPalSubscribeButton.tsx", "utf8");

describe("useT is stable across renders", () => {
  it("memoises the translator", () => {
    const body = useLocaleSrc.slice(useLocaleSrc.indexOf("export function useT"));
    expect(body).toContain("useMemo");
  });

  it("keys the memo on the locale, so switching language still re-translates", () => {
    const body = useLocaleSrc.slice(useLocaleSrc.indexOf("export function useT"));
    const memo = body.slice(0, body.indexOf("}\n"));
    expect(memo).toMatch(/\[\s*locale\s*\]/);
  });
});

describe("the effect that owns the PayPal button", () => {
  const deps = /\}, \[([^\]]*)\]\);/g;
  const arrays = [...payPalSrc.matchAll(deps)].map((m) => m[1]!.trim());

  it("depends only on what forces the button to be rebuilt", () => {
    // The button effect is the one naming planCode.
    const buttonDeps = arrays.find((a) => a.includes("planCode"));
    expect(buttonDeps, "the button effect must exist").toBeTruthy();
    const listed = buttonDeps!
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    expect(listed.sort()).toEqual(["interval", "label", "locale", "planCode"]);
  });

  it("does not list refresh, which changes whenever billing data is refetched", () => {
    const buttonDeps = arrays.find((a) => a.includes("planCode"))!;
    expect(buttonDeps).not.toMatch(/\brefresh\b/);
  });

  it("does not list onActivated, which callers pass as an inline arrow", () => {
    const buttonDeps = arrays.find((a) => a.includes("planCode"))!;
    expect(buttonDeps).not.toMatch(/\bonActivated\b/);
  });

  it("reaches the changing values through refs instead", () => {
    expect(payPalSrc).toContain("refreshRef.current()");
    expect(payPalSrc).toContain("onActivatedRef.current?.(");
    expect(payPalSrc).toContain("labelRef.current(");
  });

  it("still tears the button down on cleanup, which is why the deps matter", () => {
    // If this stops being true the dependency discipline above stops mattering
    // — and if it is true with churning deps, checkout breaks.
    expect(payPalSrc).toContain("instance?.close?.()");
  });
});
