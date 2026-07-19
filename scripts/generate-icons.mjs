// One-off asset generator: builds PWA + favicon icons from the AnzenCare logo.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

const SRC = "public/anzencare-logo-tr.png";
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 255, g: 255, b: 255, alpha: 0 };

// Emblem region within the 1024x1024 source (crops out the wordmark/tagline).
const EMBLEM = { left: 205, top: 50, width: 595, height: 595 };

async function emblemBuffer(inner, transparent) {
  return sharp(SRC)
    .extract(EMBLEM)
    .resize(inner, inner, {
      fit: "contain",
      background: transparent ? TRANSPARENT : WHITE,
    })
    .png()
    .toBuffer();
}

async function makeIcon(size, { padRatio, bg, transparent = false, out }) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const emblem = await emblemBuffer(inner, transparent);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: transparent ? TRANSPARENT : bg,
    },
  })
    .composite([{ input: emblem, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("wrote", out);
}

await mkdir("public/icons", { recursive: true });

// Standard app icons (white background matches the logo artwork).
await makeIcon(192, { padRatio: 0.08, bg: WHITE, out: "public/icons/icon-192.png" });
await makeIcon(512, { padRatio: 0.08, bg: WHITE, out: "public/icons/icon-512.png" });

// Maskable icons (extra safe-zone padding so Android masks don't clip content).
await makeIcon(192, { padRatio: 0.2, bg: WHITE, out: "public/icons/maskable-192.png" });
await makeIcon(512, { padRatio: 0.2, bg: WHITE, out: "public/icons/maskable-512.png" });

// Favicon + Next metadata icons.
await makeIcon(512, { padRatio: 0.06, bg: WHITE, out: "src/app/icon.png" });
// Apple touch icon must be opaque (iOS renders transparency as black).
await makeIcon(180, { padRatio: 0.1, bg: WHITE, out: "src/app/apple-icon.png" });

// favicon.ico (multi-resolution, PNG-encoded entries) — overrides the Next default.
async function faviconPng(size) {
  const inner = size; // no extra padding; emblem already has whitespace
  const emblem = await emblemBuffer(inner, true);
  return sharp({
    create: { width: size, height: size, channels: 4, background: TRANSPARENT },
  })
    .composite([{ input: emblem, gravity: "center" }])
    .png()
    .toBuffer();
}

function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const entries = [];
  const images = [];
  let offset = 6 + count * 16;
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    images.push(data);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...images]);
}

const icoSizes = [16, 32, 48, 64];
const icoPngs = [];
for (const size of icoSizes) {
  icoPngs.push({ size, data: await faviconPng(size) });
}
await writeFile("src/app/favicon.ico", buildIco(icoPngs));
console.log("wrote src/app/favicon.ico");

console.log("done");
