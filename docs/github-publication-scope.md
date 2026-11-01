# GitHub 发布范围

仓库：`haoyu-qi/shijian`，公开。用户已于 2026-11-01 明确确认以下源码范围与 Release 附件的公开发布。

拟上传内容：

- `src/`：应用源码、2,008 首诗词、导入来源清单和业务测试。
- `public/`：字体及许可、主题图片、历史灵签素材和图标。
- `src-tauri/`：Rust 源码、锁文件、窗口权限配置和各平台图标；排除 target 与生成目录。
- `scripts/`：诗词获取/导入、第三方许可收集脚本。
- `tests/`：浏览器测试代码。
- `docs/`、README、开发计划和进度、`release-support/`：使用说明、设计/生图提示词、字体来源、第三方声明和发布说明。
- 根目录的 npm 锁文件、构建/测试/TypeScript 配置及 .gitignore。

GitHub Release v0.4.0 附件：安装版 EXE、便携 ZIP、SHA256SUMS.txt 和使用说明。

不上传：本地测试用户数据 `release-qa/`，原始下载缓存 `data-source/`，依赖与 npm 缓存，测试截图、target、dist、本地 releases 目录和 .env 文件。安装包仅通过 Release 附件分发。

本地检查未发现已暂存内容含上述排除目录或常见 GitHub/OpenAI 凭据及私钥标记；这种模式检查不能证明不存在所有敏感内容。公开可见性和完整上传范围已得到用户确认。
