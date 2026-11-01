import React from "react";
import { createRoot } from "react-dom/client";
import { initializeStorage } from "./services/storage";
import App from "./App";
import "./style.css";
import "./refinements.css";
import "./layouts.css";
import "./fonts.css";
import "./polish.css";
import "./fortune-art.css";
import "./fortune-theme.css";
const root = createRoot(document.getElementById("root")!);
initializeStorage()
  .then(() =>
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    ),
  )
  .catch(() =>
    root.render(
      <div className="startup-error">
        <h1>诗笺暂未打开</h1>
        <p>本地记录无法读取。为保护已有收藏与灵签，没有覆盖原数据。</p>
        <button onClick={() => location.reload()}>重试读取</button>
      </div>,
    ),
  );
