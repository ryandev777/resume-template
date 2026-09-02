// Copies the pdfjs-dist worker into public/ so extractPdfText (src/lib/pdfImport.ts) can load
// it from the app's own origin instead of an external CDN. Runs on postinstall so the copy
// stays in sync whenever the pdfjs-dist version changes.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");

const source = join(appRoot, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = join(appRoot, "public");
const dest = join(destDir, "pdf.worker.min.mjs");

if (!existsSync(source)) {
  console.warn(`[copy-pdf-worker] source not found, skipping: ${source}`);
  process.exit(0);
}

if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
copyFileSync(source, dest);
console.log(`[copy-pdf-worker] copied pdf.worker.min.mjs to public/`);
