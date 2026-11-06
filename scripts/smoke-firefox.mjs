// Prueba de humo en Firefox, sin dependencias: maneja Firefox por WebDriver BiDi.
// Uso: con `npm start` corriendo, `npm run smoke:firefox`.
// Variables: APP_URL (por defecto http://localhost:4200), FIREFOX_BIN (ruta de Firefox), HEADED=1 (ventana visible).
// No envía postulaciones: no deja datos en el backend.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP_URL = (process.env.APP_URL || 'http://localhost:4200').replace(/\/$/, '');
const BIN =
  process.env.FIREFOX_BIN ||
  [
    'C:/Program Files/Mozilla Firefox/firefox.exe',
    'C:/Program Files (x86)/Mozilla Firefox/firefox.exe',
    '/Applications/Firefox.app/Contents/MacOS/firefox',
    '/usr/bin/firefox',
  ].find(existsSync);
if (!BIN) {
  console.error('No se encontró Firefox. Indicá la ruta con FIREFOX_BIN.');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = 9900 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'gg-firefox-'));
writeFileSync(
  join(profile, 'user.js'),
  ['browser.shell.checkDefaultBrowser', 'datareporting.policy.dataSubmissionEnabled', 'browser.aboutwelcome.enabled']
    .map((pref) => `user_pref("${pref}", false);`)
    .join('\n'),
);
const firefox = spawn(
  BIN,
  ['-no-remote', '-profile', profile, `--remote-debugging-port=${port}`, ...(process.env.HEADED === '1' ? [] : ['-headless'])],
  { stdio: 'ignore' },
);
const finish = (code) => {
  firefox.kill();
  setTimeout(() => {
    rmSync(profile, { recursive: true, force: true });
    process.exit(code);
  }, 500);
};
setTimeout(() => {
  console.error('Tiempo agotado.');
  finish(1);
}, 120_000);

let ws;
for (let i = 0; i < 120 && !ws; i++) {
  await sleep(250);
  try {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/session`);
    await new Promise((ok, ko) => ((socket.onopen = ok), (socket.onerror = ko)));
    ws = socket;
  } catch {}
}
if (!ws) {
  console.error('No se pudo conectar con Firefox.');
  finish(1);
}

let id = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.id && pending.has(msg.id)) pending.get(msg.id)(msg), pending.delete(msg.id);
  if (msg.method === 'log.entryAdded' && msg.params.level === 'error') consoleErrors.push(msg.params.text);
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, (msg) => (msg.type === 'error' ? reject(new Error(`${method}: ${msg.message}`)) : resolve(msg.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });

await send('session.new', { capabilities: {} });
await send('session.subscribe', { events: ['log.entryAdded'] });
const context = (await send('browsingContext.getTree')).contexts[0].context;
const version = (await send('script.evaluate', { expression: 'navigator.userAgent', target: { context }, awaitPromise: false })).result.value;

/** Ejecuta código en la página; las ayudas `until`, `btn` y `type` están disponibles. */
const run = async (body) => {
  const expression = `(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const until = async (fn, what, ms = 15000) => { for (let t = 0; t < ms; t += 100) { const v = fn(); if (v) return v; await sleep(100); } throw new Error('No apareció: ' + what); };
    const btn = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(text));
    const type = (el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('blur')); };
    ${body}
  })()`;
  const res = await send('script.evaluate', { expression, target: { context }, awaitPromise: true });
  if (res.type === 'exception') throw new Error(res.exceptionDetails.text);
  return res.result.value;
};
const open = async (path, viewport = { width: 1440, height: 900 }) => {
  await send('browsingContext.setViewport', { context, viewport });
  await send('browsingContext.navigate', { context, url: APP_URL + path, wait: 'complete' });
};

const checks = [
  [
    'Portada: tres figuras con WebGL',
    async () => {
      await open('/');
      return run(`
        await until(() => document.querySelectorAll('app-persona-figure canvas').length === 3, 'las figuras 3D');
        const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
        if (!gl) throw new Error('Firefox no tiene WebGL');`);
    },
  ],
  [
    'Portada: ofertas del backend o del mock',
    () =>
      run(`
        (await until(() => document.querySelector('app-persona-figure .hit'), 'la figura del postulante')).click();
        (await until(() => btn('Ver todas las ofertas'), 'el botón de ofertas')).click();
        await until(() => document.querySelector('[appOfferResults] .job'), 'las ofertas');`),
  ],
  [
    'Formulario: valida los cinco campos, email incluido',
    () =>
      run(`
        (await until(() => btn('Dejar mi CV con IA'), 'Dejar mi CV')).click();
        (await until(() => btn('Prefiero completar'), 'completar a mano')).click();
        (await until(() => btn('Enviar postulación'), 'el formulario')).click();
        await sleep(300);
        const summary = document.querySelector('.summary').textContent;
        if (summary !== 'Revisá 5 campos.') throw new Error('Resumen inesperado: ' + summary);
        type(document.querySelector('#cf-email'), 'nombre@ejemplo');
        await sleep(200);
        if (!document.querySelector('#cf-email-err')) throw new Error('No marcó el email inválido');`),
  ],
  [
    'Celular (390 px): sin desborde horizontal',
    async () => {
      await open('/', { width: 390, height: 844 });
      return run(`
        await until(() => document.querySelector('app-persona-figure'), 'la portada');
        await sleep(500);
        const extra = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        if (extra > 0) throw new Error('Desborda ' + extra + ' px');`);
    },
  ],
  [
    'Backoffice: ingreso de ejemplo y edición con deshacer',
    async () => {
      await open('/backoffice/ingresar');
      return run(`
        (await until(() => btn('Entrar con datos de ejemplo'), 'el ingreso')).click();
        await until(() => !location.pathname.includes('ingresar'), 'el editor');
        (await until(() => btn('Nombre y apellido'), 'las capas')).click();
        const label = await until(() => document.querySelector('app-field-inspector input'), 'el inspector');
        type(label, 'Prueba Firefox');
        await sleep(300);
        const preview = () => document.querySelector('app-canvas-preview').textContent;
        if (!preview().includes('Prueba Firefox')) throw new Error('La vista previa no se actualizó');
        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
        await sleep(300);
        if (preview().includes('Prueba Firefox')) throw new Error('Ctrl+Z no deshizo el cambio');`);
    },
  ],
];

console.log(`Firefox: ${version}\nApp: ${APP_URL}\n`);
let failed = 0;
for (const [name, check] of checks) {
  try {
    await check();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failed++;
    console.log(`  FALLA ${name}\n        ${error.message}`);
  }
}
if (consoleErrors.length) {
  failed++;
  console.log(`\n  FALLA Errores en la consola:\n${consoleErrors.map((e) => '        ' + e).join('\n')}`);
}
console.log(failed ? `\n${failed} problema(s).` : '\nTodo bien en Firefox.');
finish(failed ? 1 : 0);
