# tapekit-crack

与 satdust 无关的独立实验：从 [TapeKit 网关](https://4454-0.tapekit.org) 背后的 **链上站点** `4454.0.tape` 拉取并校验内容。

## 这个 URL 是什么？

| 层级 | 说明 |
|------|------|
| `https://4454-0.tapekit.org` | 仅托管引导页 + Service Worker + 开源内核 `/.tape/kernel/*` |
| `4454.0.tape` | BNB Chain 上电路 **#4454**、**0 号处理器（Genesis CPU）** 的链上名字 |
| 真实内容 | 存在容器 `SiteRegistry` 里，由 SW 通过 RPC 读取并 SHA-256 校验 |

浏览器里第一次打开只会看到「正在准备…」，是因为必须先注册 Service Worker；本目录用 **Node + TapeKit 内核** 跳过浏览器，直接读链。

## 快速使用

```bash
cd tapekit-crack
npm run fetch:4454
# 或
node scripts/fetch-tape-site.mjs 4454.0.tape --out ./dump/4454-0
```

产物：

- `dump/4454-0/` — 链上网站文件（已校验哈希）
- `reports/4454-0.json` — 解析结果、容器地址、持有人等元数据

## 对 `4454.0.tape` 的结论（截至拉取时）

- **站点应用**：链上 DeWEB 应用 **TapeVault**（加密保险箱 UI），7 个文件约 248 KB（`index.html`、`src/app.*.js` 等）。
- **容器**：`0x3104dccd8fbc1eb17b69faed757f7ab76afff20a`
- **持有人**：`0x937a5d2985a94f900e5ab00eaebaf5271d98d743`
- **电路 NFT**：`0x50a994e71615474b55559ff4f500928fbc339dd9`
- **`_tapevault/` 密文**：当前 **0 个路径** — 保险箱里若有人上传文件，会以 `_tapevault/f/<id>` 等形式出现在同一容器的 `pathCount` 里；文件名与内容均为钱包签名派生密钥后的密文，无法在无私钥时「破解」。

若要解密保险箱文件，需要：

1. 初始化该文件夹时使用的 **EOA 钱包** 对固定文案 `Fe(container, chainId)` 做 `personal_sign`；
2. 用 HKDF 得到 AES 密钥（见 `dump/.../src/app.*.js` 中的 `It` / `ge`）；
3. 读取链上 `_tapevault/`  blob 并按 TVF1 格式解密。

遗产托付（守护人/继承人 + `tvs1:` 碎片）是另一条密钥路径，同样依赖链上 `_tapevault/legacy/` 记录与线下分发的私钥/碎片。

## 内核来源

`/.tape/kernel/` 从网关静态资源同步（与 [TapeOutProtocol/TapeKit](https://github.com/TapeOutProtocol/TapeKit) 一致），仅用于 **只读** `createKernel().resolve()` / `loadSite()`。

## 许可

内核文件遵循 TapeKit 上游许可（MIT）；本目录脚本为本地实验用途。
