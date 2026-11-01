# 诗笺

[下载安装包](https://github.com/haoyu-qi/shijian/releases/latest) · [中华诗词来源](https://github.com/chinese-poetry/chinese-poetry)

东方美学桌面日历，基于 Tauri 2 + React + TypeScript。当前是 0.4.1「风物版」，已支持三套布局、五套生图主题、在线天气与内置志莽行书，并提供 Windows x64 Release 安装包。

## 启动

需要 Node.js 22.12+、Rust、Windows C++ 构建工具和 WebView2；具体环境以 [Tauri 官方前置要求](https://v2.tauri.app/start/prerequisites/) 为准。

```powershell
npm install
npm run dev
```

浏览器预览地址为 `http://127.0.0.1:1420`，预览数据保存在该站点的 localStorage。

```powershell
npm run tauri dev
```

桌面版使用 Tauri Store 保存 `shijian.json`，数据位于标识 `cn.shijian.calendar` 对应的应用数据目录。预览版与桌面版数据独立。三套桌面模板尺寸固定，禁止手动缩放；可按住非交互空白区域拖动。顶部按钮在移入时显示、移出后隐藏，键盘聚焦时显示。

## 检查

```powershell
npm test
npm run test:e2e
npm run build
npm run tauri build -- --no-bundle
```

`npm run tauri build -- --no-bundle` 只编译程序。运行 `npm run release` 会收集第三方许可并生成中文 NSIS 安装包，输出位于 `src-tauri/target/release/bundle/nsis`。本次交付副本及校验文件位于 `releases/0.4.1`。发行版采用 Release 优化编译，尚未使用代码签名证书签名。

## 已实现与后续

- 经典竖版、横向诗钟、月轮竖版，独立 TimeWidget、24 小时/时辰/双时间、分钟边界调度和焦点恢复校准。
- 真实农历、节气、传统节日。农历与节气采用北京时间，时钟跟随系统时区。
- 2,008 首本地诗词、季节推荐、当日稳定选择、手动换诗、全文、收藏、历史、文本复制。
- 60 条灵签、每天一次、结果先保存再展示、灵签历史。
- 五套独立生图背景：宣纸竹影、桃花春雨、烟雨江南、玄青月色、雪落长安。支持手动固定、每日随机、昼夜/天气/季节自动选择；皮肤与布局分别保存。
- 国内城市/区县搜索、六个常用城市快捷选择和在线天气、30 分钟缓存、失败回退、切城取消旧请求和超时处理。城市由用户手动选择，默认不联网请求。
- 本地存储串行写入、版本和内容校验、写入失败提示；损坏数据不自动覆盖。
- 桌面最小化、关闭、置顶设置持久化，切换模板时使用固定尺寸；允许拖动位置，禁用手动缩放。

待完成：原生休眠事件、多屏拔插和位置恢复、托盘、图像分享、持续校对与完善诗词标签、用户可操作的数据恢复工具、代码签名与完整 V1.1 发布验收。日期回顾目前提供记录列表，尚无交互式日历选日。旧版本 schemaVersion 1 的收藏、诗词和签文会迁移至版本 2。0.4.0 安装、运行和卸载已在当前机器的隔离目录验证，尚未在全新操作系统环境验证 WebView2 的首次安装流程。

## 天气来源与使用范围

天气由 [Open-Meteo](https://open-meteo.com/) 提供，采用模型当前天气值，并非本机传感器或城市气象站实测。首次选择城市后才向其发送经纬度；不发送诗词、收藏或签文。公共免费 API 按其[服务条款](https://open-meteo.com/en/terms)仅用于非商业用途；正式商业发布应切换符合用途的订阅或其他供应商，不在桌面包中内置共享私钥。

`npm run test:e2e` 默认使用可控天气响应验证异常流程；设置 `SHIJIAN_LIVE_WEATHER=1` 后运行 `playwright test tests/live-weather.spec.ts` 可进行真实接口联调。常用城市包括上海、杭州、北京、成都、广州、西安；可另外搜索国内城市和区县；网络不可用时显示最后成功缓存及过期标记，无缓存时不显示虚构温度。

## 内容与素材

原诗为古典公版作品，存在通行版本差异，见 `src/content.ts`；白话读诗小记为项目编写。灵签是传统语句与自写生活寄语，不用于事实预测。界面背景使用内置 ImageGen 生成，提示词与素材路径见 `docs/imagegen-prompts.md`，原有 SVG 保留在源码中但主界面已替换为生图背景。诗词及部分标题内置 Google Fonts 官方「志莽行书」，许可证随资源保存于 `public/fonts/ZhiMangXing-OFL.txt`；辅助文字使用系统中文字体。字体来源与校验值见 `docs/fonts.md`。

历法使用 [lunar-typescript](https://github.com/6tail/lunar-typescript)；第三方依赖的许可证随依赖维护，正式发布前统一整理 NOTICE。完整任务见 [开发计划](./诗笺V1.1开发计划.md)。



## 灵签随肤
灵签复用当前皮肤的背景、配色与边框；签筒为随主题着色的轻量线描。五主题换肤不重新抽签。

## 0.4.1 扩充签库

新增 54 条项目编写的生活签，共 60 条，涵盖从容、行动、相处、求知、自省和调养。原有六签、历史和每日已抽结果保持不变。新增短句不标作古籍引文或庙签，详见 [签库说明](./docs/fortune-library.md)。


## 中华诗词导入
从 chinese-poetry/chinese-poetry 固定提交整理导入 2,000 首，保留原有 8 首。新增内容标注原文来源，不编造译文；自动推荐和换诗加入近期去重。许可及导入规则、统计和复现命令见 docs/poetry-library.md。

