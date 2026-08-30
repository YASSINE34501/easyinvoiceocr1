/**
 * The language picker and the vendored models must agree.
 *
 * They did not. OCR_LANGUAGES offered Deutsch and Español, the picker in PDF to
 * Word and Image to Word rendered both with labels, and neither model was ever
 * vendored — so selecting one asked our own origin for
 * /tesseract/lang/deu.traineddata.gz, got a 404, and the conversion failed.
 * Nothing in the test suite tied the offered list to the shipped files, which
 * is exactly how it reached production.
 *
 * Self-hosting means the languages you offer and the languages you ship are two
 * separate lists. This test is what keeps them one. It checks the invariant
 * twice, because the two checks fail in different situations:
 *
 *  - against scripts/vendor-tesseract.mjs, which is the list prebuild acts on,
 *    so this catches the drift on any machine with no network and no assets;
 *  - against public/tesseract/lang/, which proves the script actually ran here.
 *    Those files are gitignored build output, so a clone that has never run
 *    predev/prebuild legitimately has none and that half is skipped.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { OCR_LANGUAGES } from "./ocr";

/** Composites like "eng+ara" load one model per part. */
const requiredModels = [...new Set(OCR_LANGUAGES.flatMap((code) => code.split("+")))].sort();

const LANG_DIR = "public/tesseract/lang";

/** The literal the vendor script downloads from, read as source so no network or asset is needed. */
function vendorScriptLanguages(): string[] {
  const source = readFileSync("scripts/vendor-tesseract.mjs", "utf8");
  const match = source.match(/const LANGUAGES = \[([^\]]*)\]/);
  if (!match?.[1]) throw new Error("could not find the LANGUAGES literal in vendor-tesseract.mjs");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1] as string).sort();
}

describe("every offered OCR language has a vendored model", () => {
  it("splits composites into their component models", () => {
    // Guards the split itself: a composite that stopped being split would make
    // the assertions below look for "eng+ara", which is not a model.
    expect(requiredModels).toContain("eng");
    expect(requiredModels).toContain("ara");
    expect(requiredModels).not.toContain("eng+ara");
  });

  it("the vendor script downloads exactly the models the picker offers", () => {
    // Both directions at once: a language offered but never vendored 404s in
    // production, and a model vendored but never offered is dead megabytes.
    expect(vendorScriptLanguages()).toEqual(requiredModels);
  });

  const vendored = existsSync(LANG_DIR)
    ? readdirSync(LANG_DIR)
        .filter((name) => name.endsWith(".traineddata.gz"))
        .map((name) => name.replace(".traineddata.gz", ""))
        .sort()
    : null;

  it.skipIf(vendored === null)("has those models on disk in this checkout", () => {
    expect(vendored).toEqual(requiredModels);
  });
});
