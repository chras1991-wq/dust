#!/usr/bin/env node
/** 运营/红队演练：绕过网关，拉取指定 tape 站点全部容器路径 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createKernel } from '../.tape/kernel/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const name = process.argv[2] || '4454.0.tape';
const slug = name.replace(/\.tape$/i, '').replace(/\./g, '-');
const outDir = resolve(ROOT, 'exfil', slug);

const k = createKernel({ locale: 'zh' });
const res = await k.resolve(name, { fresh: true });
const man = await k.manifest(res);
const report = {
  exercise: 'chain exfil without gateway',
  at: new Date().toISOString(),
  target: { name: res.name, gateway: `https://${slug.replace(/-/g, '-').replace(/^(\d+)-(\d+)$/, '$1-$2')}.tapekit.org` },
  resolve: JSON.parse(JSON.stringify(res, (_, v) => (typeof v === 'bigint' ? v.toString() : v))),
  manifest: { paths: man.paths, tapevault: man.paths.filter((p) => p.startsWith('_tapevault/')) },
  files: [],
};

mkdirSync(outDir, { recursive: true });
for (const p of man.paths) {
  const f = await k.getFile(res, man, p);
  if (!f || f.status !== 'ok') {
    report.files.push({ path: p, status: f?.status || 'missing' });
    continue;
  }
  const dest = join(outDir, p);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, Buffer.from(f.bytes));
  report.files.push({ path: p, status: 'ok', size: f.size, sha256: f.sha256, contentType: f.contentType });
}

const reportPath = resolve(ROOT, 'exfil', `${slug}-ATTACK-REPORT.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log('Wrote', outDir, 'and', reportPath);
