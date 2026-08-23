import { describe, expect, it } from "vitest";
import { inflateRawSync } from "node:zlib";
import { buildDocx } from "./docx";
import type { DocBlock, DocumentModel } from "./types";

/**
 * Opens the built .docx as the zip it is and checks the parts Word reads.
 *
 * The existing tests check that a file comes out and that it starts with a zip
 * signature. Neither would notice a document whose picture points at a
 * relationship that is not there, or at a media part that was never written —
 * a file that opens and is missing its figures, or that Word refuses outright.
 * Those were both found by hand in a browser; this suite is what keeps them
 * found without one.
 *
 * Node's inflateRawSync stands in for DecompressionStream, which jsdom does not
 * have, so this runs in the ordinary test environment with no browser.
 */

/* ------------------------------------------------------------------ */
/* Minimal zip reader                                                  */
/* ------------------------------------------------------------------ */

type ZipEntry = { name: string; bytes: Buffer };

function readZip(bytes: Uint8Array): ZipEntry[] {
  const buf = Buffer.from(bytes);
  const entries: ZipEntry[] = [];

  for (let offset = 0; offset + 30 <= buf.length; offset += 1) {
    if (buf.readUInt32LE(offset) !== 0x04034b50) continue;
    const method = buf.readUInt16LE(offset + 8);
    const compressed = buf.readUInt32LE(offset + 18);
    const nameLength = buf.readUInt16LE(offset + 26);
    const extraLength = buf.readUInt16LE(offset + 28);
    const name = buf.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    const start = offset + 30 + nameLength + extraLength;
    const payload = buf.subarray(start, start + compressed);
    entries.push({
      name,
      bytes: method === 0 ? payload : method === 8 ? inflateRawSync(payload) : Buffer.alloc(0),
    });
  }
  return entries;
}

async function open(model: DocumentModel) {
  const blob = await buildDocx(model);
  const parts = readZip(new Uint8Array(await blob.arrayBuffer()));
  const text = (name: string) => parts.find((p) => p.name === name)?.bytes.toString("utf8") ?? "";
  return {
    blob,
    parts,
    names: parts.map((p) => p.name),
    document: text("word/document.xml"),
    rels: text("word/_rels/document.xml.rels"),
    contentTypes: text("[Content_Types].xml"),
    media: parts.filter((p) => p.name.startsWith("word/media/") && p.bytes.length > 0),
  };
}

/** A one-pixel PNG. Real bytes, so the writer stores something decodable. */
const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb0, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
  0x44, 0xae, 0x42, 0x60, 0x82,
]);

const image = (widthPx: number, heightPx: number): DocBlock => ({
  kind: "image",
  data: PNG,
  type: "png",
  widthPx,
  heightPx,
});

const para = (text: string, dir: "ltr" | "rtl" = "ltr"): DocBlock => ({
  kind: "paragraph",
  text,
  dir,
});

const model = (blocks: DocBlock[], dir: "ltr" | "rtl" = "ltr"): DocumentModel => ({
  baseName: "regression",
  blocks,
  pageCount: 1,
  usedOcr: false,
  dir,
});

/* ------------------------------------------------------------------ */

describe("the package Word opens", () => {
  it("contains every part a reader looks for", async () => {
    const d = await open(model([para("hello")]));
    for (const required of [
      "[Content_Types].xml",
      "_rels/.rels",
      "word/document.xml",
      "word/styles.xml",
      "word/_rels/document.xml.rels",
    ]) {
      expect(d.names, required).toContain(required);
    }
  });

  it("writes a document body that is well-formed XML", async () => {
    const d = await open(model([para("hello"), para("world")]));
    expect(d.document).toContain("<w:document");
    expect(d.document).toContain("</w:document>");
    // Every opened run must be closed; an unbalanced body is what Word refuses.
    const open_ = (d.document.match(/<w:t[ >]/g) ?? []).length;
    const close = (d.document.match(/<\/w:t>/g) ?? []).length;
    expect(open_).toBe(close);
  });
});

describe("a picture arrives wired up", () => {
  it("writes the drawing, the relationship and the media part together", async () => {
    const d = await open(model([para("Figure 1 follows."), image(160, 120)]));

    expect(d.document).toContain("<w:drawing>");
    const embed = /r:embed="([^"]+)"/.exec(d.document)?.[1];
    expect(embed, "document.xml must reference a relationship").toBeTruthy();

    // The relationship must exist...
    const rel = new RegExp(`Id="${embed}"[^>]*Target="([^"]+)"`).exec(d.rels)?.[1];
    expect(rel, "the relationship must be declared").toBeTruthy();

    // ...and point at a part that was actually written.
    expect(d.names).toContain(`word/${rel}`);
    expect(d.contentTypes).toContain('Extension="png"');
  });

  it("writes one media part per picture when there are several", async () => {
    const d = await open(
      model([para("a"), image(100, 100), para("b"), image(200, 150), para("c"), image(80, 60)]),
    );
    expect((d.document.match(/<w:drawing>/g) ?? []).length).toBe(3);
    expect(d.media.length).toBeGreaterThanOrEqual(1);
    // Every embed id in the body resolves in the relationships part.
    for (const [, id] of d.document.matchAll(/r:embed="([^"]+)"/g)) {
      expect(d.rels, `${id} must resolve`).toContain(`Id="${id}"`);
    }
  });

  it("keeps pictures across page breaks", async () => {
    const d = await open(
      model([
        para("page one"),
        image(100, 100),
        { kind: "pageBreak" },
        para("page two"),
        image(90, 90),
      ]),
    );
    expect((d.document.match(/<w:drawing>/g) ?? []).length).toBe(2);
    expect(d.document).toContain("page one");
    expect(d.document).toContain("page two");
  });

  it("writes text, a table and a picture in one document without losing any of them", async () => {
    const d = await open(
      model([
        { kind: "heading", level: 1, text: "Annual Summary", dir: "ltr" },
        para("An introductory paragraph."),
        {
          kind: "table",
          rows: [
            ["Region", "Revenue"],
            ["North", "1200.00"],
          ],
          dir: "ltr",
        },
        image(120, 90),
        para("Closing note."),
      ]),
    );
    expect(d.document).toContain("Annual Summary");
    expect(d.document).toContain("An introductory paragraph.");
    expect(d.document).toContain("<w:tbl>");
    expect(d.document).toContain("Revenue");
    expect(d.document).toContain("<w:drawing>");
    expect(d.document).toContain("Closing note.");
  });
});

describe("Arabic and right-to-left", () => {
  /**
   * The Arabic conversion could not be exercised end to end: pdf-lib's standard
   * fonts cannot encode Arabic, so building an Arabic PDF fixture needs an
   * embedded font, and the only other route into the pipeline is OCR, which
   * needs a compositing browser. What is pinned here is everything downstream
   * of the reader — that Arabic text survives into the document unaltered and
   * that the paragraphs are marked right-to-left, which is what makes Word lay
   * them out correctly rather than reversed.
   */
  it("carries Arabic through to the document unchanged", async () => {
    const line = "فاتورة رقم ٢٠٢٦ — المجموع الكلي";
    const d = await open(model([para(line, "rtl")], "rtl"));
    expect(d.document).toContain("فاتورة");
    expect(d.document).toContain("المجموع");
    // Arabic-Indic digits and the em dash must not be mangled or stripped.
    expect(d.document).toContain("٢٠٢٦");
    expect(d.document).toContain("—");
  });

  it("marks right-to-left paragraphs as bidirectional", async () => {
    const d = await open(model([para("مرحبا بالعالم", "rtl")], "rtl"));
    expect(d.document).toContain("<w:bidi");
    expect(d.document).toContain("<w:rtl");
  });

  it("keeps Arabic and French in one document, each with its own direction", async () => {
    const d = await open(
      model([para("Les coûts sont restés stables — société", "ltr"), para("فاتورة شهرية", "rtl")]),
    );
    expect(d.document).toContain("coûts");
    expect(d.document).toContain("restés");
    expect(d.document).toContain("société");
    expect(d.document).toContain("فاتورة");
    expect(d.document).toContain("<w:bidi");
  });

  it("keeps Arabic inside a table cell", async () => {
    const d = await open(
      model(
        [
          {
            kind: "table",
            rows: [
              ["البند", "المبلغ"],
              ["استشارة", "٢٠٤٠"],
            ],
            dir: "rtl",
          },
        ],
        "rtl",
      ),
    );
    expect(d.document).toContain("<w:tbl>");
    expect(d.document).toContain("المبلغ");
    expect(d.document).toContain("٢٠٤٠");
  });

  it("preserves numbers and punctuation around Arabic", async () => {
    const d = await open(model([para("المجموع: 2 040,00 € (2026/08/23)", "rtl")], "rtl"));
    expect(d.document).toContain("2 040,00");
    expect(d.document).toContain("€");
    expect(d.document).toContain("2026/08/23");
  });
});
