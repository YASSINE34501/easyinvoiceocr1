import { describe, expect, it } from "vitest";
import { adsConfig, adsRuntimeReady, isAdEligiblePath, slugFromPath } from "./ads";
import { sortedProducts } from "./products";

describe("slugFromPath", () => {
  it("strips the locale segment", () => {
    expect(slugFromPath("/fr/pdf-to-word")).toBe("pdf-to-word");
    expect(slugFromPath("/ar/blog/how-ocr-works")).toBe("blog/how-ocr-works");
  });

  it("treats an unknown first segment as part of the slug", () => {
    expect(slugFromPath("/pdf-to-word")).toBe("pdf-to-word");
  });

  it("drops query strings and hashes", () => {
    expect(slugFromPath("/en/blog?page=2")).toBe("blog");
    expect(slugFromPath("/en/help#top")).toBe("help");
  });
});

describe("isAdEligiblePath", () => {
  const allowed = [
    "/en",
    "/fr",
    "/en/documentation",
    "/en/help",
    "/en/blog",
    "/en/blog/how-ocr-works",
    "/en/solutions/accountants",
    "/ar/pdf-to-word",
    "/fr/image-to-pdf",
  ];

  const denied = [
    "/en/login",
    "/en/signup",
    "/en/forgot-password",
    "/en/reset-password",
    "/en/verify-email",
    "/en/app",
    "/en/app/settings",
    "/en/app/billing",
    "/en/app/admin",
    "/en/choose-plan",
    "/en/contact",
    "/en/terms",
    "/en/privacy",
    "/en/cookies",
    "/en/security",
  ];

  it.each(allowed)("allows advertising on %s", (path) => {
    expect(isAdEligiblePath(path)).toBe(true);
  });

  it.each(denied)("never allows advertising on %s", (path) => {
    expect(isAdEligiblePath(path)).toBe(false);
  });

  it("allows every product page in the registry", () => {
    for (const product of sortedProducts) {
      expect(isAdEligiblePath(`/en/${product.slug}`)).toBe(true);
    }
  });

  it("does not allow an unknown route by default", () => {
    expect(isAdEligiblePath("/en/some-page-that-does-not-exist")).toBe(false);
  });
});

describe("adsRuntimeReady", () => {
  it("is false in this build, because no publisher id is configured", () => {
    // The flag and the publisher id both have to be set, and the build must not
    // be a development build. None of that is true in the test environment.
    expect(adsRuntimeReady()).toBe(false);
  });

  it("defaults to withholding ads entirely when consent is absent", () => {
    expect(adsConfig.allowNonPersonalisedWithoutConsent).toBe(false);
  });
});
