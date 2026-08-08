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
      text,
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
                              text: cell,
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
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const isZip =
    header[0] === 0x50 && header[1] === 0x4b && (header[2] === 0x03 || header[2] === 0x05);
  if (!isZip) throw new ConversionError("output_invalid", "output_invalid");
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
