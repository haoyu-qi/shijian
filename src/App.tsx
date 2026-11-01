import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { poems, fortunes } from "./content";
import { useClock } from "./hooks";
import { calendar, dayPeriod, localDateKey } from "./services/calendar";
import { dailyPoemId, nextPoemId } from "./services/poetry";
import {
  drawFortune,
  getSnapshot,
  subscribe,
  updateState,
  type State,
} from "./services/storage";
import { effectiveTheme, randomTheme } from "./services/themes";
import { applyLayout } from "./services/desktop";
import { TimeWidget } from "./components/TimeWidget";
import { FortuneCard } from "./components/FortuneCard";
import { SettingsPanel } from "./components/SettingsPanel";
import { useWeather, WeatherWidget } from "./components/WeatherWidget";
type Panel = "settings" | "poem" | "fortune" | "history" | "favorites" | null;
export default function App() {
  const state = useSyncExternalStore(subscribe, getSnapshot),
    now = useClock(),
    day = localDateKey(now),
    cal = calendar(now);
  const weather = useWeather(state.city, now);
  const theme = effectiveTheme(
    state,
    now,
    day,
    weather.failed ? undefined : weather.data?.code,
  );
  const poem = poems.find(
    (p) =>
      p.id ===
      (state.dailyPoems[day] ??
        dailyPoemId(
          day,
          now.getMonth() + 1,
          state.dailyPoems,
          state.recentPoems,
        )),
  )!;
  const fortune = fortunes.find((f) => f.id === state.draws[day]);
  const [panel, setPanel] = useState<Panel>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const title =
    panel === "settings"
      ? "笺上设置"
      : panel === "poem"
        ? poem.title
        : panel === "fortune"
          ? "今日灵签"
          : panel === "favorites"
            ? "我的藏诗"
            : "往日笺影";
  async function action(task: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await task();
    } catch {
      setError("操作未完成，请重试。已有记录已保留。");
    } finally {
      setBusy(false);
    }
  }
  const change = (patch: Partial<State>) => {
    void action(() => updateState((s) => ({ ...s, ...patch })));
  };
  useEffect(() => {
    void updateState((s) => {
      if (s.dailyPoems[day] && (s.themeMode !== "daily" || s.dailyThemes[day]))
        return s;
      const selected =
        s.dailyPoems[day] ??
        dailyPoemId(day, now.getMonth() + 1, s.dailyPoems, s.recentPoems);
      return {
        ...s,
        recentPoems: s.dailyPoems[day]
          ? s.recentPoems
          : [...(s.recentPoems ?? []), selected].slice(-30),
        dailyPoems: {
          ...s.dailyPoems,
          [day]: selected,
        },
        dailyThemes:
          s.themeMode === "daily"
            ? {
                ...s.dailyThemes,
                [day]: s.dailyThemes[day] ?? randomTheme(day),
              }
            : s.dailyThemes,
      };
    }).catch(() => setError("今日记录暂未保存，请稍后重试。"));
  }, [day, state.themeMode]);
  useEffect(() => {
    if (panel && !dialog.current?.open) dialog.current?.showModal();
    if (!panel && dialog.current?.open) dialog.current.close();
  }, [panel]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 2400);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    if (isTauri())
      void applyLayout(state.layout).catch(() =>
        setError("窗口尺寸未能调整，请尝试其他形制。"),
      );
  }, [state.layout]);
  useEffect(() => {
    if (isTauri())
      void getCurrentWindow()
        .setAlwaysOnTop(state.pinned)
        .catch(() => setError("置顶设置未能应用，请重试。"));
  }, [state.pinned]);
  const favorite = () =>
    action(() =>
      updateState((s) => ({
        ...s,
        favorites: s.favorites.includes(poem.id)
          ? s.favorites.filter((id) => id !== poem.id)
          : [...s.favorites, poem.id],
      })),
    );
  return (
    <main
      className={`calendar layout-${state.layout} theme-${theme} ${state.reducedMotion ? "reduced-motion" : ""}`}
      onPointerDown={(event) => {
        if (
          !isTauri() ||
          event.button !== 0 ||
          !(event.target instanceof Element)
        )
          return;
        if (
          event.target.closest(
            'button,input,select,textarea,a,dialog,[role="button"]',
          )
        )
          return;
        void getCurrentWindow()
          .startDragging()
          .catch(() => setError("窗口暂时无法拖动，请重试。"));
      }}
    >
      <div
        className="art-background"
        key={theme}
        style={{ backgroundImage: `url('/themes/${theme}-v1.png')` }}
        aria-hidden="true"
      />
      <header className="brand" title="按住空白区域可拖动，模板尺寸固定">
        <span className="brand-name">
          诗 笺 <small>SHI JIAN</small>
        </span>
        <nav className="quick-actions" aria-label="快捷操作">
          <button
            aria-label="收藏与历史"
            title="收藏与历史"
            onClick={() => setPanel("history")}
          >
            历史
          </button>
          <button
            aria-label="设置"
            title="设置"
            onClick={() => setPanel("settings")}
          >
            设置
          </button>
          {isTauri() && (
            <>
              <button
                aria-label="最小化"
                onClick={() => void action(() => getCurrentWindow().minimize())}
              >
                −
              </button>
              <button
                aria-label="关闭诗笺"
                onClick={() => void action(() => getCurrentWindow().close())}
              >
                ×
              </button>
            </>
          )}
        </nav>
      </header>
      <TimeWidget now={now} mode={state.timeMode} />
      <div className="moment">
        <span>
          {dayPeriod(now)} · {theme === "moon" ? "月色入怀" : "静赏好时光"}
        </span>
        <span className="tiny-dot">◆</span>
      </div>
      <section className="almanac" aria-label="天气与节气">
        <WeatherWidget
          city={state.city}
          weather={weather.data}
          loading={weather.loading}
          failed={weather.failed}
          onConfigure={() => setPanel("settings")}
        />
        <div className="solar-term">
          <strong>{cal.term}</strong>
          <span>
            {cal.festivals || (cal.isTermDay ? "今日交节" : "四时有序")}
          </span>
        </div>
      </section>
      <section className="poetry-section" aria-label="每日诗词">
        <span className="poetry-caption">一 日 一 诗</span>
        <button
          className="poetry"
          aria-label={`阅读《${poem.title}》全文`}
          onClick={() => setPanel("poem")}
        >
          <span className="poem-lines">
            {poem.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
          <span className="poem-attribution">
            《{poem.title}》<br />〔{poem.dynasty}〕{poem.author}
          </span>
        </button>
        <span className="poem-seal" aria-hidden="true">
          诗意
        </span>
        <div className="poem-actions">
          <button
            disabled={busy}
            onClick={() =>
              void action(() =>
                updateState((s) => {
                  const selected = nextPoemId(
                    s.dailyPoems[day] ?? poem.id,
                    day,
                    s.dailyPoems,
                    s.recentPoems,
                  );
                  return {
                    ...s,
                    dailyPoems: { ...s.dailyPoems, [day]: selected },
                    recentPoems: [...(s.recentPoems ?? []), selected].slice(
                      -30,
                    ),
                  };
                }),
              )
            }
          >
            ↻ 换一首
          </button>
          <button
            disabled={busy}
            aria-pressed={state.favorites.includes(poem.id)}
            onClick={() => void favorite()}
          >
            {state.favorites.includes(poem.id) ? "♥ 已藏" : "♡ 藏诗"}
          </button>
        </div>
      </section>
      <section className="date-widget" aria-label="今日日期">
        <div className="divider">
          <span>❖</span>
        </div>
        <div className="date-row">
          <strong>{String(now.getDate()).padStart(2, "0")}</strong>
          <div>
            <time dateTime={day}>
              {now.getFullYear()} /{" "}
              {String(now.getMonth() + 1).padStart(2, "0")}
            </time>
            <span>{cal.weekday}</span>
            <small>{cal.lunar}</small>
          </div>
        </div>
      </section>
      <footer>
        <button className="fortune-entry" onClick={() => setPanel("fortune")}>
          <span aria-hidden="true">卜</span>{" "}
          {fortune ? "重温今日签" : "今日灵签"}{" "}
          <span aria-hidden="true">›</span>
        </button>
        <button
          className="footer-settings"
          aria-label="打开设置"
          onClick={() => setPanel("settings")}
        >
          ☷
        </button>
      </footer>
      {error && (
        <div className="error" role="alert">
          {error}
          <button aria-label="关闭提示" onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      <dialog
        ref={dialog}
        className={`panel theme-${theme} ${state.layout === "moon" && panel === "fortune" ? "side-scroll" : ""}`}
        onCancel={() => setPanel(null)}
        onClose={() => setPanel(null)}
      >
        <header className="panel-heading">
          <h1>{title}</h1>
          <button aria-label="关闭面板" onClick={() => setPanel(null)}>
            ×
          </button>
        </header>
        {panel === "settings" && (
          <SettingsPanel
            state={state}
            busy={busy}
            onChange={change}
            onHistory={() => setPanel("history")}
            onFavorites={() => setPanel("favorites")}
            onRefresh={weather.refresh}
          />
        )}
        {panel === "poem" && (
          <article className="poem-detail">
            <p className="muted">
              〔{poem.dynasty}〕{poem.author}
            </p>
            <p className="full-poem">{poem.full}</p>
            <h2>{poem.meaning ? "读诗小记" : "原文来源"}</h2>
            <p>
              {poem.meaning ||
                "中华诗词（chinese-poetry）开源诗库 · 简体整理。"}
            </p>
            <div className="button-row">
              <button disabled={busy} onClick={() => void favorite()}>
                {state.favorites.includes(poem.id) ? "取消收藏" : "收藏此诗"}
              </button>
              <button
                onClick={() =>
                  void action(async () => {
                    await navigator.clipboard.writeText(
                      `${poem.full}\n——〔${poem.dynasty}〕${poem.author}《${poem.title}》\n${day} · 诗笺`,
                    );
                    setNotice("诗词已复制");
                  })
                }
              >
                复制诗词
              </button>
            </div>
          </article>
        )}
        {panel === "fortune" && (
          <FortuneCard
            theme={theme}
            fortune={fortune}
            day={day}
            busy={busy}
            onDraw={() => void action(() => drawFortune(day))}
            onHistory={() => setPanel("history")}
          />
        )}
        {panel === "favorites" && (
          <div className="record-list">
            {!state.favorites.length && (
              <p className="empty">
                还没有藏诗。遇到喜欢的句子，轻点「藏诗」。
              </p>
            )}
            {state.favorites.map((id) => {
              const p = poems.find((p) => p.id === id)!;
              return (
                <article key={id}>
                  <h2>
                    {p.title} · {p.author}
                  </h2>
                  <p className="poem-excerpt">{p.lines.join("，")}。</p>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void action(() =>
                        updateState((s) => ({
                          ...s,
                          favorites: s.favorites.filter((p) => p !== id),
                        })),
                      )
                    }
                  >
                    移出收藏
                  </button>
                </article>
              );
            })}
          </div>
        )}
        {panel === "history" && (
          <div className="record-list">
            <button
              className="text-button"
              onClick={() => setPanel("favorites")}
            >
              查看我的藏诗 ›
            </button>
            {Object.keys({ ...state.dailyPoems, ...state.draws })
              .sort()
              .reverse()
              .map((d) => {
                const p = poems.find((p) => p.id === state.dailyPoems[d]),
                  f = fortunes.find((f) => f.id === state.draws[d]);
                return (
                  <article key={d}>
                    <time>{d}</time>
                    {p && (
                      <>
                        <h2>
                          {p.title} · {p.author}
                        </h2>
                        <p className="poem-excerpt">{p.lines.join("，")}。</p>
                      </>
                    )}
                    {f && (
                      <p className="history-fortune">
                        第 {f.id} 签 · {f.verse}
                        <small>{f.meaning}</small>
                      </p>
                    )}
                  </article>
                );
              })}
            <p className="muted small">仅记录实际展示的诗词与已抽取的签文。</p>
          </div>
        )}
      </dialog>
    </main>
  );
}
