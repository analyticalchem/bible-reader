// Renders the chosen SVG icon to the PNG sizes the web app manifest needs.
// Usage: node scripts/make-icons.mjs [icons/book-lines.svg]
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const src = process.argv[2] ?? 'icons/book-cross.svg';
const svg = readFileSync(src, 'utf8');
// Maskable icons must fill the whole square; ChromeOS masks them to a circle itself.
const square = svg.replace('<circle cx="256" cy="256" r="256" fill="#000"/>', '<rect width="512" height="512" fill="#000"/>');
mkdirSync('public/icons', { recursive: true });
await sharp(Buffer.from(svg)).resize(192, 192).png().toFile('public/icons/icon-192.png');
await sharp(Buffer.from(svg)).resize(512, 512).png().toFile('public/icons/icon-512.png');
await sharp(Buffer.from(square)).resize(512, 512).png().toFile('public/icons/icon-maskable-512.png');
writeFileSync('public/icons/favicon.svg', svg);
console.log('icons written from', src);
