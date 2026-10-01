# 运营方授权演练：对 `4454.0.tape` 的链上数据拉取

**模拟攻击**：攻击者不访问 `https://4454-0.tapekit.org`、不安装 Service Worker，仅用公开 BSC RPC + TapeKit 内核读取 SiteRegistry。

**结果**：公开 DeWEB 站点 **7 个文件、247695 字节** 全部拉取并校验 SHA-256。**`_tapevault/` 密文 0 条** — 无法获得保险箱明文（无密文、无钱包签名）。

## 产物路径（本仓库内）

| 文件 | 说明 |
|------|------|
| `4454-0-ATTACK-REPORT.json` | 元数据 + 每文件 sha256 |
| `4454-0/` | 与链上一致的文件树 |
| `../dump/4454-0/` | `npm run fetch:4454` 同步副本 |
| `../reports/4454-0.json` | 解析结果快照 |

## 复现

```bash
cd tapekit-crack
npm run fetch:4454
node scripts/exfil-site.mjs 4454.0.tape   # 若已添加
```

## 链上身份（拉取时）

见 `4454-0-ATTACK-REPORT.json` 内 `resolve` 字段。
