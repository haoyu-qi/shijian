# 本地解读库 · 0.4.4

2,008 首完整原文继续离线提供。阅读页采用「原文 / 解读」切换；主界面、收藏与历史都能打开对应诗词，切换阅读页时重置滚动位置。没有外部浏览器跳转、运行时抓取、在线生成或 API 密钥。

## 当前覆盖

- 436 首有本地解读。
- 19 首由项目整理白话释义、词语注释与赏析，包括原有 8 首及部分常见篇目；保留原文字句的版本差异提示。
- 417 首展示上游 AI 辅助整理的参考赏析，在界面标注「AI整理 · 阅读参考」，不将其声称为逐篇人工校订的权威注释。
- 其余 1,572 首标注「本地详解待补充」，不隐藏作品、不缩小推荐池，也不以模板文案冒充逐篇释义。

## 参考赏析来源

来源：[open-chinese/poetry-collection](https://github.com/open-chinese/poetry-collection)，固定提交 `58690b76f47f7dff0131b8374ff0d133f0fab155`，MIT License，Copyright (c) 2024 Open Chinese | 开放中文。完整许可保存在 `public/licenses/poetry-collection-MIT.txt`，随安装包和便携包分发。

从四个鉴赏文件读取 19,058 条记录，OpenCC 转简体并规范化空白、标点及 NFC。仅在作者与完整原文完全一致、且单个源文件内只有一条候选时关联；同篇在不同文件中重复时按固定文件顺序选用一条。不仅凭诗名猜配，不用上游 UUID 直接连接两个不同数据源。匹配得到 430 首，13 首由项目整理内容覆盖，最终合计 436 首。

保留上游路径、提交、记录 ID、原文 SHA-256 及下载文件的 Git blob/SHA-256。参考赏析只取原有 summary，不使用评分筛掉低分诗，不凭摘要编造译文或注释。未完成全量人工校勘，后续应继续检查历史背景、字词理解与异文。

## 文件与复现

- `src/data/poem-readings.curated.json`：19 首项目整理内容。
- `src/data/poem-readings.imported.json`：430 首匹配的参考赏析。
- `src/data/readings.provenance.json`：固定来源及四个文件的指纹。
- `src/services/readings.ts`：合并内容，项目整理优先。
- `node scripts/import-readings.mjs --fetch`：首次下载固定版本文件至被忽略的 `data-source/poetry-readings/` 并校验 Git blob。
- `node scripts/import-readings.mjs`：利用本地缓存重新导入，不联网。

业务检查验证内容 ID 存在、完整原文指纹一致、同名不同作者不串配、整理内容优先及版本提示。浏览器检查覆盖三套模板、离线原文与解读、未覆盖提示、收藏历史阅读以及滚动恢复。
