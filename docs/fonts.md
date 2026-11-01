# 字体与排版

2026-11-01（0.4.2）：仅诗词正文使用内置「志莽行书 / Zhi Mang Xing」Regular 400，包括主界面竖排诗句、诗词全文、收藏与历史中的诗句。其余文字统一使用楷体，包括时钟与日期数字、节气、时辰、诗名作者、标题、按钮、设置、天气与所有灵签内容。

楷体统一由 `--font-ui` 驱动，字体栈为 `KaiTi`、`STKaiti`、`Kaiti SC`、serif；Windows 优先使用系统楷体。系统字体不随应用复制或分发；若系统未安装上述楷体，会回退至系统衬线字体。本机已安装并通过浏览器实际字体检查确认使用 KaiTi。辅助文字保留较粗字重，系统楷体允许合成加粗；诗词行书仍用原始 400 字重，不合成加粗。

0.4.3：诗名、朝代与作者合为同一竖列，不再强制换列。横版署名采用 9 px 楷体；超长诗名在原列省略并保留作者，完整信息可悬停查看或打开诗词全文。

字体直接从 Google Fonts 官方仓库获取，未改写、未子集化，离线可用。字体为魏志莽手写书法基础上的行书，不使用生成图片替代动态文字。

- 字体文件：`public/fonts/ZhiMangXing-Regular.ttf`
- 许可全文：`public/fonts/ZhiMangXing-OFL.txt`
- 上游：[google/fonts / ofl/zhimangxing](https://github.com/google/fonts/tree/main/ofl/zhimangxing)
- 原文件：[ZhiMangXing-Regular.ttf](https://raw.githubusercontent.com/google/fonts/main/ofl/zhimangxing/ZhiMangXing-Regular.ttf)
- 版权：Copyright 2018 The Zhi Mang Xing Project Authors
- 许可：SIL Open Font License 1.1，完整许可随应用资源分发
- 下载文件 SHA-256：`644e0cae9b40f0b10ab729a01bd32032e3973bac22be3dccae01bf6ae7fde969`

诗词排版使用真实 400 字重，不模拟加粗；移除诗词模糊阴影。分别调整经典、横向、月轮与紧凑尺寸的字号及竖排节奏。新增诗词若超出字体字符范围，会回退到系统楷体；应在扩充诗库时重新检查覆盖。
