import { afterEach, describe, expect, it, vi } from "vitest";
import { verificationMeta } from "./seo";

/**
 * Ownership verification is easy to get subtly wrong: the site keeps rendering,
 * every page looks right, and the only symptom is a Search Console property
 * that never verifies. These pin the distinction that causes it.
 */

afterEach(() => vi.unstubAllEnvs());

describe("nothing is claimed unless a token is configured", () => {
  it("renders no tag when the variables are unset", () => {
    vi.stubEnv("VITE_GOOGLE_SITE_VERIFICATION", "");
    vi.stubEnv("VITE_BING_SITE_VERIFICATION", "");
    expect(verificationMeta()).toEqual([]);
  });

  it("ignores whitespace-only configuration", () => {
    vi.stubEnv("VITE_GOOGLE_SITE_VERIFICATION", "   ");
    expect(verificationMeta()).toEqual([]);
  });
});

describe("the HTML-file token is refused as a meta tag", () => {
  // google + 16 hex is the token for the file method. Google reads it in a meta
  // tag and rejects it, so emitting one buys nothing and hides the mistake.
  it("does not emit a file-method token", () => {
    vi.stubEnv("VITE_GOOGLE_SITE_VERIFICATION", "google5c6318784a4b8677");
    expect(verificationMeta()).toEqual([]);
  });

  it("refuses it regardless of case", () => {
    vi.stubEnv("VITE_GOOGLE_SITE_VERIFICATION", "GOOGLE5C6318784A4B8677");
    expect(verificationMeta()).toEqual([]);
  });

  it("still accepts a real HTML-tag token, which is longer and not hex", () => {
    const token = "AbC123_dEf456-GhI789jKlMnOpQrStUvWxYz0123456";
    vi.stubEnv("VITE_GOOGLE_SITE_VERIFICATION", token);
    expect(verificationMeta()).toEqual([{ name: "google-site-verification", content: token }]);
  });
});

describe("Bing uses its own tag name", () => {
  it("emits msvalidate.01, not google-site-verification", () => {
    vi.stubEnv("VITE_GOOGLE_SITE_VERIFICATION", "");
    vi.stubEnv("VITE_BING_SITE_VERIFICATION", "ABCDEF0123456789");
    expect(verificationMeta()).toEqual([{ name: "msvalidate.01", content: "ABCDEF0123456789" }]);
  });
});

describe("the file that verifies this property today", () => {
  it("says what Google expects it to say", async () => {
    const fs = await import("node:fs/promises");
    const body = await fs.readFile("public/google5c6318784a4b8677.html", "utf8");
    // Google fetches the file and matches this line exactly; the name of the
    // file is part of the expected content, which is why a rename breaks it.
    expect(body.trim()).toBe("google-site-verification: google5c6318784a4b8677.html");
  });
});
