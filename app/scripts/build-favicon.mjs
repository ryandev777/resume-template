// One-off script: packs the 32x32 and 16x16 PNGs (already rendered from the app icon graphic,
// fetched via curl from the two temporary /tmp-favicon-* routes) into a single valid .ico file
// using only Node's built-in fs/Buffer — no image library needed, since a "PNG-format" ICO entry
// is just the ICO directory header followed by the raw PNG bytes as-is.
import { readFileSync, writeFileSync } from "node:fs";

const png32 = readFileSync(process.argv[2]);
const png16 = readFileSync(process.argv[3]);
const outPath = process.argv[4];

const images = [
  { size: 32, data: png32 },
  { size: 16, data: png16 },
];

const HEADER_SIZE = 6;
const ENTRY_SIZE = 16;
let offset = HEADER_SIZE + ENTRY_SIZE * images.length;

const header = Buffer.alloc(HEADER_SIZE);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = icon
header.writeUInt16LE(images.length, 4); // image count

const entries = [];
const dataChunks = [];
for (const { size, data } of images) {
  const entry = Buffer.alloc(ENTRY_SIZE);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // width (0 means 256)
  entry.writeUInt8(size === 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // color count (0 = no palette, PNG)
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(data.length, 8); // size of image data
  entry.writeUInt32LE(offset, 12); // offset of image data
  offset += data.length;
  entries.push(entry);
  dataChunks.push(data);
}

writeFileSync(outPath, Buffer.concat([header, ...entries, ...dataChunks]));
console.log(`Wrote ${outPath}`);
