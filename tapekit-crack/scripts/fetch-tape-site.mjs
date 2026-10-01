#!/usr/bin/env node
/**
 * 从 BNB Chain（TapeOut SiteRegistry）拉取 tape:// 站点的全部链上文件。
 * 不依赖 https://*.tapekit.org 的 Service Worker，等价于网关内核的 loadSite()。
 *
 * 用法:
 *   node scripts/fetch-tape-site.mjs 4454.0.tape
 *   node scripts/fetch-tape-site.mjs 4454.0.tape --out ./dump/4454-0
 */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createKernel } from '../.tape/kernel/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseArgs(argv) {
  const args = [...argv];
  const name = args.find((a) => !a.startsWith('-'));
  if (!name) {
    console.error('用法: node scripts/fetch-tape-site.mjs <链上名字> [--out 目录] [--json 报告.json]');
    process.exit(1);
  }
  let out = join(ROOT, 'dump', name.replace(/\.tape$/i, '').replace(/\./g, '-'));
  let json = join(ROOT, 'reports', name.replace(/\.tape$/i, '').replace(/\./g, '-') + '.json');
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) out = resolve(args[++i]);
    if (args[i] === '--json' && args[i + 1]) json = resolve(args[++i]);
  }
  return { name, out, json };
}

function bigReplacer(_k, v) {
  return typeof v === 'bigint' ? v.toString() : v;
}

async function main() {
  const { name, out, json } = parseArgs(process.argv.slice(2));
  const kernel = createKernel({ locale: 'zh' });

  console.log(`解析 ${name} …`);
  const res = await kernel.resolve(name, { fresh: true });
  if (res.status !== 'ok') {
    console.error('站点状态:', res.status, res);
    process.exit(2);
  }

  const man = await kernel.manifest(res);
  const tapevaultPaths = man.paths.filter((p) => p.startsWith('_tapevault/'));
  const webPaths = man.paths.filter((p) => !p.startsWith('_tapevault/'));

  console.log(`区块 ${res.block} · 容器 ${res.container}`);
  console.log(`链上路径 ${man.paths.length}（网站 ${webPaths.length} · TapeVault ${tapevaultPaths.length}）`);

  const loaded = await kernel.loadSite(res);
  mkdirSync(out, { recursive: true });
  mkdirSync(dirname(json), { recursive: true });

  for (const [relPath, file] of loaded.files) {
    if (file.status !== 'ok' || !file.bytes) {
      console.warn('跳过', relPath, file.status);
      continue;
    }
    const dest = join(out, relPath);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, Buffer.from(file.bytes));
  }

  const report = {
    fetchedAt: new Date().toISOString(),
    input: name,
    resolve: JSON.parse(JSON.stringify(res, bigReplacer)),
    manifest: {
      registry: man.registry,
      paths: man.paths,
      webPaths,
      tapevaultPaths,
      truncated: man.truncated,
    },
    load: {
      totalBytes: loaded.totalBytes,
      problems: loaded.problems,
      files: [...loaded.files.entries()].map(([path, f]) => ({
        path,
        status: f.status,
        size: f.size,
        sha256: f.sha256,
        contentType: f.contentType,
      })),
    },
    notes: {
      gateway: 'https://4454-0.tapekit.org 仅提供 SW 引导；真实字节来自链上 SiteRegistry。',
      vault:
        tapevaultPaths.length === 0
          ? '当前容器没有 _tapevault/ 密文文件；TapeVault 保险箱内容需持有人钱包签名才能解密，链上只有密文。'
          : '发现 _tapevault/ 路径；可用钱包 personal_sign 派生密钥后解密（见 TapeVault 源码 Fe/It/ge）。',
    },
  };

  writeFileSync(json, JSON.stringify(report, null, 2));
  writeFileSync(join(out, '_report.json'), JSON.stringify(report, null, 2));

  console.log(`已写入 ${out}（${loaded.totalBytes} 字节）`);
  console.log(`报告 ${json}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
