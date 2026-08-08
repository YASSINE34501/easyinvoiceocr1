/**
 * Vendors every Tesseract runtime asset into public/tesseract/.
 *
 * Recognition must not depend on a third-party CDN at run time: a CDN failure
 * previously left conversions wedged mid-flight with quota already reserved.
 * After this script runs, the worker, the WASM core and the language models are
 * all served from our own origin.
 *
 * The worker and core are copied from node_modules, so they always match the
 * installed tesseract.js. The language models are not published to npm, so they
 * are downloaded once here — at setup time, never at run time.
 *
 * The 4.0.0 (standard) models are used deliberately: they are byte-identical to
 * what tesseract.js v7 fetches by default, so self-hosting changes where the
 * bytes come from without changing recognition accuracy.
 *
 * Usage: node scripts/vendor-tesseract.mjs
 */

import { createWriteStream } from "node:fs";
import { copyFile, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "tesseract");
const langDir = join(outDir, "lang");

const LANGUAGES = ["eng", "fra", "ara"];
const TESSDATA_BASE = "https://tessdata.projectnaptha.com/4.0.0";

/** Core files tesseract.js may request, depending on the browser's SIMD support. */
const CORE_PATTERN = /^tesseract-core.*\.(js|wasm)$/;

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copyWorker() {
  const from = join(root, "node_modules", "tesseract.js", "dist", "worker.min.js");
  if (!(await exists(from))) {
    throw new Error("tesseract.js/dist/worker.min.js not found — run npm install first");
  }
  await copyFile(from, join(outDir, "worker.min.js"));
  return 1;
}

async function copyCore() {
  const from = join(root, "node_modules", "tesseract.js-core");
  if (!(await exists(from))) {
    throw new Error("tesseract.js-core not found — run npm install first");
  }
  const files = (await readdir(from)).filter((name) => CORE_PATTERN.test(name));
  if (files.length === 0) throw new Error("no tesseract-core files found in tesseract.js-core");
  for (const name of files) {
    await copyFile(join(from, name), join(outDir, name));
  }
  return files.length;
}

async function downloadLanguages() {
  let downloaded = 0;
  for (const lang of LANGUAGES) {
    const target = join(langDir, `${lang}.traineddata.gz`);
    if (await exists(target)) {
      console.log(`  ${lang}.traineddata.gz already vendored — skipped`);
      continue;
    }
    const url = `${TESSDATA_BASE}/${lang}.traineddata.gz`;
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw new Error(`could not download ${lang}: HTTP ${response.status}`);
    }
    await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
    const { size } = await stat(target);
    console.log(`  ${lang}.traineddata.gz  ${(size / 1024 / 1024).toFixed(1)} MB`);
    downloaded += 1;
  }
  return downloaded;
}

await mkdir(outDir, { recursive: true });
await mkdir(langDir, { recursive: true });

console.log("Vendoring Tesseract assets into public/tesseract/");
console.log(`  worker files : ${await copyWorker()}`);
console.log(`  core files   : ${await copyCore()}`);
await downloadLanguages();
console.log("Done. No CDN is contacted at run time.");
