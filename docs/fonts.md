# 字体与排版

2026-10-31：诗词正文改用内置「志莽行书 / Zhi Mang Xing」Regular 400；节气、时辰、签文和少量标题采用同字体。辅助信息使用系统中文无衬线字体，数字时钟和日期继续使用清晰的衬线数字。

字体直接从 Google Fonts 官方仓库获取，未改写、未子集化，离线可用。字体为魏志莽手写书法基础上的行书，不使用生成图片替代动态文字。

- 字体文件：`public/fonts/ZhiMangXing-Regular.ttf`
- 许可全文：`public/fonts/ZhiMangXing-OFL.txt`
- 上游：[google/fonts / ofl/zhimangxing](https://github.com/google/fonts/tree/main/ofl/zhimangxing)
- 原文件：[ZhiMangXing-Regular.ttf](https://raw.githubusercontent.com/google/fonts/main/ofl/zhimangxing/ZhiMangXing-Regular.ttf)
- 版权：Copyright 2018 The Zhi Mang Xing Project Authors
- 许可：SIL Open Font License 1.1，完整许可随应用资源分发
- 下载文件 SHA-256：`644e0cae9b40f0b10ab729a01bd32032e3973bac22be3dccae01bf6ae7fde969`

排版使用真实 400 字重，不模拟加粗；移除诗词模糊阴影。分别调整经典、横向、月轮与紧凑尺寸的字号及竖排节奏。新增内容若超出字体字符范围，会回退到系统楷体；应在扩充内容库时重新检查覆盖。
