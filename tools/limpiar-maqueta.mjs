#!/usr/bin/env node
/**
 * limpiar-maqueta.mjs
 *
 * Toma un HTML "todo en uno" (con videos, modelos 3D, imágenes y páginas
 * embebidas en base64) y genera una versión liviana para leer y portar a
 * Angular, extrayendo los recursos pesados a archivos separados.
 *
 * Uso:
 *   node tools/limpiar-maqueta.mjs <entrada.html> [carpetaSalida]
 *
 * Ejemplo:
 *   node tools/limpiar-maqueta.mjs maqueta/Portada.html maqueta/limpia
 *
 * Qué hace:
 *   - Strings base64 grandes (videos webm/mp4, modelos .glb, imágenes)
 *     -> assets/<nombre>.<ext>, y en el HTML queda "ASSET:assets/<nombre>.<ext>"
 *   - Páginas comprimidas (gzip + base64) -> se descomprimen a su propio .html
 *     y se limpian con el mismo proceso (recursivo).
 *   - data: URIs grandes (src, url(), etc.) -> assets/ con ruta relativa real.
 *   - <script> inline muy grandes (librerías como three.js) -> vendor/*.js
 *   - manifest.json con el detalle de todo lo extraído.
 *
 * Importante: la versión limpia es una REFERENCIA para leer el código.
 * Los reemplazos "ASSET:..." no se ejecutan como el original; la maqueta
 * original sigue siendo la demo funcional.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const MIN_B64 = 2000;        // largo mínimo de un string base64 para extraerlo
const MIN_DATAURI = 1000;    // largo mínimo de una data: URI para extraerla
const MAX_INLINE_SCRIPT = 100_000; // scripts inline más grandes van a vendor/

const [, , input, outArg] = process.argv;
if (!input) {
  console.error('Uso: node tools/limpiar-maqueta.mjs <entrada.html> [carpetaSalida]');
  process.exit(1);
}
const outDir = outArg || path.join(path.dirname(input), 'limpia');
const assetsDir = path.join(outDir, 'assets');
const vendorDir = path.join(outDir, 'vendor');
fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(vendorDir, { recursive: true });

const manifest = [];
const usedNames = new Set();

function uniqueName(base, ext) {
  base = (base || 'asset').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'asset';
  let name = `${base}.${ext}`;
  let i = 2;
  while (usedNames.has(name)) name = `${base}-${i++}.${ext}`;
  usedNames.add(name);
  return name;
}

function sniff(buf) {
  const h = buf.subarray(0, 16);
  const ascii = h.toString('latin1');
  if (h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3) return 'webm';
  if (ascii.slice(4, 8) === 'ftyp') return /avif/.test(ascii) ? 'avif' : 'mp4';
  if (ascii.startsWith('glTF')) return 'glb';
  if (h[0] === 0x1f && h[1] === 0x8b) return 'gz';
  if (h[0] === 0x89 && ascii.slice(1, 4) === 'PNG') return 'png';
  if (h[0] === 0xff && h[1] === 0xd8) return 'jpg';
  if (ascii.startsWith('RIFF') && ascii.slice(8, 12) === 'WEBP') return 'webp';
  if (ascii.startsWith('GIF8')) return 'gif';
  if (ascii.startsWith('wOF2')) return 'woff2';
  if (ascii.startsWith('wOFF')) return 'woff';
  if (ascii.startsWith('OggS')) return 'ogg';
  if (ascii.startsWith('ID3') || (h[0] === 0xff && (h[1] & 0xe0) === 0xe0)) return 'mp3';
  const txt = buf.subarray(0, 300).toString('utf8').trimStart().toLowerCase();
  if (txt.startsWith('<svg') || txt.startsWith('<?xml')) return 'svg';
  if (txt.startsWith('<!doctype html') || txt.startsWith('<html') || txt.startsWith('<')) return 'html';
  return 'bin';
}

const MIME_EXT = {
  'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/avif': 'avif',
  'image/gif': 'gif', 'image/svg+xml': 'svg', 'video/mp4': 'mp4', 'video/webm': 'webm',
  'font/woff2': 'woff2', 'font/woff': 'woff', 'audio/mpeg': 'mp3', 'model/gltf-binary': 'glb',
};

/** Nombre sugerido a partir del identificador que precede al string. */
function contextName(text, idx) {
  const before = text.slice(Math.max(0, idx - 300), idx);
  const m = before.match(/([A-Za-z_$][\w$]*)\s*(?:[:=]\s*\[?\s*(?:"[^"]*"\s*,\s*)*|:\s*)$/)
    || before.match(/([A-Za-z_$][\w$]*)\W*$/);
  return m ? m[1] : 'asset';
}

/** Nombre para un string base64; si es un elemento más de un array, reutiliza el nombre anterior. */
let lastCtx = 'asset';
function arrayAwareName(text, idx) {
  const before = text.slice(Math.max(0, idx - 20), idx);
  if (/["']\s*,\s*$/.test(before)) return lastCtx;
  lastCtx = contextName(text, idx);
  return lastCtx;
}

/** Limpia un HTML (string) y devuelve la versión liviana. */
function clean(html, label, relPrefix) {
  // 1) data: URIs grandes -> archivos con ruta relativa real
  html = html.replace(/data:([\w.+-]+\/[\w.+-]+)((?:;[\w-]+=[^;,"')\s]*)*);base64,([A-Za-z0-9+/=]+)/g,
    (full, mime, _p, b64, offset) => {
      if (full.length < MIN_DATAURI) return full;
      const buf = Buffer.from(b64, 'base64');
      const ext = MIME_EXT[mime] || sniff(buf);
      const name = uniqueName(`${label}-${contextName(html, offset)}`, ext);
      fs.writeFileSync(path.join(assetsDir, name), buf);
      manifest.push({ origen: label, tipo: 'data-uri', mime, archivo: `assets/${name}`, bytes: buf.length });
      return `${relPrefix}assets/${name}`;
    });

  // 2) strings base64 grandes dentro de JS ("..." o '...')
  const re = new RegExp(`(["'])([A-Za-z0-9+/]{${MIN_B64},}={0,2})\\1`, 'g');
  html = html.replace(re, (full, q, b64, offset) => {
    let buf;
    try { buf = Buffer.from(b64, 'base64'); } catch { return full; }
    let ext = sniff(buf);
    const ctx = arrayAwareName(html, offset);
    if (ext === 'gz') {
      let inner;
      try { inner = zlib.gunzipSync(buf); } catch { inner = null; }
      if (inner && sniff(inner) === 'html') {
        // Nombre: usa el "title" que sigue al string (p. ej. 'Portal del postulante'), o el hash/variable
        const after = html.slice(offset + full.length, offset + full.length + 200).match(/title:\s*['"]([^'"]+)['"]/);
        const key = html.slice(Math.max(0, offset - 200), offset).match(/hash:\s*['"]([\w-]+)['"]/);
        const name = uniqueName(after ? after[1] : `pagina-${key ? key[1] : ctx}`, 'html');
        const sub = clean(inner.toString('utf8'), name.replace(/\.html$/, ''), '');
        fs.writeFileSync(path.join(outDir, name), sub);
        manifest.push({ origen: label, tipo: 'pagina-gzip', archivo: name, bytesOriginal: inner.length, bytesLimpio: Buffer.byteLength(sub) });
        return `${q}PAGE:${name}${q}`;
      }
      if (inner) { buf = inner; ext = sniff(inner); }
    }
    const name = uniqueName(`${label}-${ctx}`, ext);
    fs.writeFileSync(path.join(assetsDir, name), buf);
    manifest.push({ origen: label, tipo: 'base64-js', variable: ctx, archivo: `assets/${name}`, bytes: buf.length });
    return `${q}ASSET:${relPrefix}assets/${name}${q}`;
  });

  // 3) scripts inline grandes (librerías) -> vendor/
  html = html.replace(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g, (full, attrs = '', body) => {
    if (body.length < MAX_INLINE_SCRIPT) return full;
    // Librería conocida (comentario "node_modules/<lib>/...") o código propio de la maqueta
    const lib = body.match(/node_modules\/((?:@[\w.-]+\/)?[\w.-]+)\/(?:[\w.-]+\/)*([\w.-]+)\.m?js/)
      || body.match(/(\w*)\/?([\w.-]+)\.m?js:\s*\n\s*\(\*\*[\s\S]{0,40}@license/); // comentario de licencia de esbuild
    const name = uniqueName(lib ? lib[2] : `${label}-app`, 'js');
    fs.writeFileSync(path.join(vendorDir, name), body);
    manifest.push({ origen: label, tipo: 'script-inline', archivo: `vendor/${name}`, bytes: Buffer.byteLength(body) });
    return `<script${attrs} src="${relPrefix}vendor/${name}"></script>`;
  });

  return html;
}

const src = fs.readFileSync(input, 'utf8');
const out = clean(src, 'portada', '');
fs.writeFileSync(path.join(outDir, 'index.html'), out);
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`Original: ${kb(Buffer.byteLength(src))}`);
console.log(`Limpio (index.html): ${kb(Buffer.byteLength(out))}`);
for (const f of fs.readdirSync(outDir).filter((f) => f.endsWith('.html') && f !== 'index.html')) {
  console.log(`  ${f}: ${kb(fs.statSync(path.join(outDir, f)).size)}`);
}
console.log(`Recursos extraídos: ${manifest.length} (ver ${path.join(outDir, 'manifest.json')})`);
