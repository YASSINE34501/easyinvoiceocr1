/**
 * Writes the shared document model to a real .docx file.
 *
 * The output is produced by a proper OOXML writer, not a renamed HTML or text
 * file: it opens in Word, LibreOffice, Pages and Google Docs, and every
 * paragraph stays editable. Right-to-left paragraphs are marked bidirectional
 * and aligned to the right so Arabic reads correctly rather than appearing
 * reversed.
 *
 * A conversion that produced no text never reaches this module — see
 * assertUsableModel — so an empty or truncated .docx is never handed to the
 * user.
 */

import { ConversionError, type DocBlock, type DocumentModel, countTextBlocks } from "./types";

const ORDERED_REFERENCE = "eio-ordered";

/** Rejects a model that would produce a document with nothing in it. */
/**
 * Strips the characters that cannot legally appear in an XML document.
 *
 * XML 1.0 forbids the C0 control range apart from tab, newline and carriage
 * return, and a .docx is a zip full of XML. A PDF text layer and OCR output
 * both emit those bytes routinely — a stray 0x0B from a column break, a 0x03
 * from a damaged glyph run. The docx library writes what it is handed, so one
 * of them was enough to produce a file that packs correctly, passes a zip-
 * signature check, and then makes Word refuse the whole document with
 * "Word encountered an error trying to open the file".
 *
 * Lone surrogates go too: they survive a JavaScript string but are not valid
 * XML characters either, and OCR on a damaged scan can produce them.
 *
 * Removing rather than replacing is deliberate. These characters carry no
 * meaning a reader would miss, and substituting a visible placeholder would put
 * something in the document that was never in the source.
 */
export function xmlSafe(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    // Tab, newline and carriage return are the only C0 characters XML allows.
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) continue;
    if (code >= 0x7f && code <= 0x9f) continue;
    if (code === 0xfffe || code === 0xffff) continue;
    // A surrogate is legal only as half of a matched pair.
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (Number.isNaN(next) || next < 0xdc00 || next > 0xdfff) continue;
      out += text[i]! + text[i + 1]!;
      i += 1;
      continue;
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue;
    out += text[i];
  }
  return out;
}

export function assertUsableModel(model: DocumentModel): void {
  const text = countTextBlocks(model.blocks);
  const images = model.blocks.filter((block) => block.kind === "image").length;
  if (text === 0 && images === 0) throw new ConversionError("empty_result", "empty_result");
}

/**
 * Builds the .docx. Returns a Blob whose bytes have been checked to be a real
 * ZIP container of a plausible size before it is offered for download.
 */
export async function buildDocx(model: DocumentModel): Promise<Blob> {
  assertUsableModel(model);

  const docx = await import("docx");
  const {
    AlignmentType,
    Document,
    HeadingLevel,
    ImageRun,
    LevelFormat,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = docx;

  const headingFor = (level: 1 | 2 | 3) =>
    level === 1
      ? HeadingLevel.HEADING_1
      : level === 2
        ? HeadingLevel.HEADING_2
        : HeadingLevel.HEADING_3;

  // Arabic and other complex scripts are given a font with wide coverage;
  // Latin text keeps the default body face.
  const runsFor = (text: string, dir: "ltr" | "rtl") => [
    new TextRun({
      text: xmlSafe(text),
      rightToLeft: dir === "rtl",
      ...(dir === "rtl" ? { font: { ascii: "Arial", cs: "Arial", hAnsi: "Arial" } } : {}),
    }),
  ];

  const paragraphProps = (dir: "ltr" | "rtl") => ({
    bidirectional: dir === "rtl",
    alignment: dir === "rtl" ? AlignmentType.RIGHT : AlignmentType.LEFT,
  });

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];

  for (const block of model.blocks) {
    switch (block.kind) {
      case "heading":
        children.push(
          new Paragraph({
            heading: headingFor(block.level),
            ...paragraphProps(block.dir),
            children: runsFor(block.text, block.dir),
          }),
        );
        break;

      case "paragraph":
        children.push(
          new Paragraph({
            ...paragraphProps(block.dir),
            spacing: { after: 120 },
            children: runsFor(block.text, block.dir),
          }),
        );
        break;

      case "list":
        for (const item of block.items) {
          children.push(
            new Paragraph({
              ...paragraphProps(block.dir),
              ...(block.ordered
                ? { numbering: { reference: ORDERED_REFERENCE, level: 0 } }
                : { bullet: { level: 0 } }),
              children: runsFor(item, block.dir),
            }),
          );
        }
        break;

      case "table": {
        const columnCount = Math.max(1, ...block.rows.map((row) => row.length));
        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            visuallyRightToLeft: block.dir === "rtl",
            rows: block.rows.map(
              (row, rowIndex) =>
                new TableRow({
                  tableHeader: rowIndex === 0,
                  children: Array.from({ length: columnCount }, (_, columnIndex) => {
                    const cell = row[columnIndex] ?? "";
                    return new TableCell({
                      width: { size: Math.floor(100 / columnCount), type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          ...paragraphProps(block.dir),
                          children: [
                            new TextRun({
                              text: xmlSafe(cell),
                              bold: rowIndex === 0,
                              rightToLeft: block.dir === "rtl",
                            }),
                          ],
                        }),
                      ],
                    });
                  }),
                }),
            ),
          }),
        );
        // Word merges consecutive tables that are not separated by a paragraph.
        children.push(new Paragraph({ text: "" }));
        break;
      }

      case "image": {
        const { width, height } = fitWithin(block.widthPx, block.heightPx, 600, 780);
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: block.type,
                data: block.data,
                transformation: { width, height },
              }),
            ],
          }),
        );
        break;
      }

      case "pageBreak":
        children.push(new Paragraph({ pageBreakBefore: true, text: "" }));
        break;
    }
  }

  const document = new Document({
    creator: "EasyInvoiceOCR",
    title: model.baseName,
    description: "Converted with EasyInvoiceOCR",
    numbering: {
      config: [
        {
          reference: ORDERED_REFERENCE,
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.START,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(document);
  await assertValidDocx(blob);
  return blob;
}

/** Scales an image down to fit a printable area, in points. */
export function fitWithin(
  widthPx: number,
  heightPx: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (widthPx <= 0 || heightPx <= 0) return { width: maxWidth, height: maxHeight };
  const scale = Math.min(maxWidth / widthPx, maxHeight / heightPx, 1);
  return {
    width: Math.max(1, Math.round(widthPx * scale)),
    height: Math.max(1, Math.round(heightPx * scale)),
  };
}

/**
 * A .docx is a ZIP archive. Checking the magic number and a floor on the size
 * catches a writer that silently produced nothing, so the download button
 * never hands over a file Word will refuse to open.
 */
export async function assertValidDocx(blob: Blob): Promise<void> {
  if (blob.size < 1000) throw new ConversionError("output_invalid", "output_invalid");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05);
  if (!isZip) throw new ConversionError("output_invalid", "output_invalid");

  // A zip signature and a plausible size were the whole check, and both are
  // satisfied by a file Word refuses to open: a single control character in the
  // text makes word/document.xml invalid XML while the container stays perfectly
  // well-formed. The document itself is read back and parsed here, so a file
  // that would fail in Word fails during conversion instead — where the visitor
  // gets a real error rather than a download that turns out to be broken.
  // The package must at least contain the part every reader opens first.
  if (!containsDocumentPart(bytes)) {
    throw new ConversionError("output_invalid", "output_invalid");
  }

  // Reading the XML back needs Blob.stream and DecompressionStream. Both exist
  // in every browser this runs in; neither exists under jsdom. Where they are
  // missing the container checks above still apply — the deep check is a
  // stronger guarantee where it can run, never a requirement for the module to
  // load.
  const xml = await readDocumentXml(bytes);
  if (xml === null) return;
  if (typeof DOMParser === "undefined") return;
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  if (parsed.getElementsByTagName("parsererror").length > 0) {
    throw new ConversionError("output_invalid", "output_invalid");
  }
}

/**
 * Pulls word/document.xml out of the package.
 *
 * Reads the local file headers directly rather than pulling in a zip library
 * for one lookup. Returns null when the part is missing, which is itself a
 * reason to reject the file.
 */
/** Whether the package declares a word/document.xml entry at all. */
function containsDocumentPart(bytes: Uint8Array): boolean {
  const needle = "word/document.xml";
  const decoder = new TextDecoder();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = 0; offset < bytes.length - 30; offset += 1) {
    if (view.getUint32(offset, true) !== 0x04034b50) continue;
    const nameLength = view.getUint16(offset + 26, true);
    if (decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLength)) === needle) {
      return true;
    }
  }
  return false;
}

async function readDocumentXml(bytes: Uint8Array): Promise<string | null> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();

  for (let offset = 0; offset < bytes.length - 30; offset += 1) {
    if (view.getUint32(offset, true) !== 0x04034b50) continue;
    const method = view.getUint16(offset + 8, true);
    const compressed = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const name = decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameLength));
    if (name !== "word/document.xml") continue;

    const start = offset + 30 + nameLength + extraLength;
    const payload = bytes.subarray(start, start + compressed);
    if (method === 0) return decoder.decode(payload);
    if (method !== 8 || typeof DecompressionStream === "undefined") return null;
    const copy = new Uint8Array(payload.length);
    copy.set(payload);
    const blob = new Blob([copy.buffer as ArrayBuffer]);
    if (typeof blob.stream !== "function") return null;
    const stream = blob.stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return await new Response(stream).text();
  }
  return null;
}

/** Convenience for callers that only have a flat list of blocks. */
export function toModel(
  baseName: string,
  blocks: DocBlock[],
  pageCount: number,
  usedOcr: boolean,
  dir: "ltr" | "rtl",
): DocumentModel {
  return { baseName, blocks, pageCount, usedOcr, dir };
}
