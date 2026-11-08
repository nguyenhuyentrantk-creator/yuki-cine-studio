import { cp, mkdir, rm } from 'node:fs/promises';
const target = new URL('../www/', import.meta.url);
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const file of ['index.html','style.css','app.js','manifest.webmanifest','sw.js','icon.svg']) {
  await cp(new URL('../' + file, import.meta.url), new URL('../www/' + file, import.meta.url));
}
console.log('Web app copied to www/');
