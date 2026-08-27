import { describe, expect, it } from "vitest";
import { formatPageSelection, invertSelection, parsePageSelection } from "./pages";

/**
 * Page selection is where an off-by-one does real damage: it removes the wrong
 * page from someone's document and the mistake is invisible until they open the
 * result. People type one-based ranges; everything downstream is zero-based.
 */

describe("reading what a person typed", () => {
  it("reads a single page", () => {
    expect(parsePageSelection("1", 5)).toEqual([0]);
    expect(parsePageSelection("5", 5)).toEqual([4]);
  });

  it("reads a range inclusively at both ends", () => {
    // "1-3" is three pages, not two.
    expect(parsePageSelection("1-3", 5)).toEqual([0, 1, 2]);
  });

  it("reads a mixed list", () => {
    expect(parsePageSelection("1-3, 7, 9", 10)).toEqual([0, 1, 2, 6, 8]);
  });

  it("treats an open end as the last page", () => {
    expect(parsePageSelection("3-", 5)).toEqual([2, 3, 4]);
  });

  it("treats an open start as the first page", () => {
    expect(parsePageSelection("-3", 5)).toEqual([0, 1, 2]);
  });

  it("accepts a range written backwards", () => {
    expect(parsePageSelection("5-2", 6)).toEqual([1, 2, 3, 4]);
  });

  it("collapses duplicates, so 3,1,1-2 and 1-3 mean the same thing", () => {
    expect(parsePageSelection("3,1,1-2", 5)).toEqual(parsePageSelection("1-3", 5));
  });

  it("tolerates loose spacing", () => {
    expect(parsePageSelection("  1 ,  3 - 4 ", 5)).toEqual([0, 2, 3]);
  });
});

describe("refusing what cannot be honoured", () => {
  it("refuses an empty selection", () => {
    expect(() => parsePageSelection("", 5)).toThrow();
    expect(() => parsePageSelection("   ", 5)).toThrow();
  });

  it("refuses a page past the end rather than quietly ignoring it", () => {
    expect(() => parsePageSelection("9", 5)).toThrow();
    expect(() => parsePageSelection("1-9", 5)).toThrow();
  });

  it("refuses page zero, because nobody's first page is zero", () => {
    expect(() => parsePageSelection("0", 5)).toThrow();
  });

  it("refuses text", () => {
    expect(() => parsePageSelection("first page", 5)).toThrow();
    expect(() => parsePageSelection("1;2", 5)).toThrow();
  });

  it("refuses a document with no pages", () => {
    expect(() => parsePageSelection("1", 0)).toThrow();
  });
});

describe("inverting a selection", () => {
  it("returns the pages that were not chosen", () => {
    expect(invertSelection([1, 3], 5)).toEqual([0, 2, 4]);
  });

  it("refuses to empty the document", () => {
    expect(() => invertSelection([0, 1], 2)).toThrow();
  });

  it("returns everything when nothing was chosen", () => {
    expect(invertSelection([], 3)).toEqual([0, 1, 2]);
  });
});

describe("showing a selection back", () => {
  it("collapses runs into ranges", () => {
    expect(formatPageSelection([0, 1, 2, 6])).toBe("1-3, 7");
  });

  it("leaves single pages alone", () => {
    expect(formatPageSelection([0, 2, 4])).toBe("1, 3, 5");
  });

  it("round-trips through the parser", () => {
    const original = "1-3, 7, 9-10";
    const indices = parsePageSelection(original, 10);
    expect(parsePageSelection(formatPageSelection(indices), 10)).toEqual(indices);
  });

  it("handles an empty list", () => {
    expect(formatPageSelection([])).toBe("");
  });
});
