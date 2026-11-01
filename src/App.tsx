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
import { PoemDetail } from "./components/PoemDetail";
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
    [readingId, setReadingId] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const readingPoem = poems.find((p) => p.id === readingId) ?? poem;
  function openPoem(id = poem.id) {
    setReadingId(id);
    setPanel("poem");
  }
  const title =
    panel === "settings"
      ? "笺上设置"
      : panel === "poem"
        ? readingPoem.title
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
    const element = dialog.current;
    if (!element) return;
    if (panel) {
      if (!element.open) element.showModal();
      element.scrollTop = 0;
    } else if (element.open) element.close();
  }, [panel, readingPoem.id]);
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
  const favorite = (id = poem.id) =>
    action(() =>
      updateState((s) => ({
        ...s,
        favorites: s.favorites.includes(id)
          ? s.favorites.filter((saved) => saved !== id)
          : [...s.favorites, id],
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
          onClick={() => openPoem()}
        >
          <span className="poem-lines">
            {poem.lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
          <span
            className="poem-attribution"
            title={`《${poem.title}》〔${poem.dynasty}〕${poem.author}`}
          >
            <span className="poem-title">《{poem.title}》</span>
            <span className="poem-author">
              〔{poem.dynasty}〕{poem.author}
            </span>
          </span>
        </button>
        <span className="poem-seal" aria-hidden="true">
          诗意
        </span>
        <div className="poem-actions">
          <button onClick={() => openPoem()}>阅读全文</button>
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
      <dialog
        ref={dialog}
        className={`panel theme-${theme} ${panel === "poem" ? "poem-panel" : ""} ${state.layout === "moon" && panel === "fortune" ? "side-scroll" : ""}`}
        aria-labelledby="panel-title"
        onCancel={() => setPanel(null)}
        onClose={() => setPanel(null)}
      >
        <header className="panel-heading">
          <h1 id="panel-title">{title}</h1>
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
          <PoemDetail
            key={readingPoem.id}
            poem={readingPoem}
            day={day}
            favorite={state.favorites.includes(readingPoem.id)}
            busy={busy}
            onFavorite={() => void favorite(readingPoem.id)}
          />
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
                    <button
                      className="record-title"
                      onClick={() => openPoem(p.id)}
                    >
                      {p.title} · {p.author}
                    </button>
                  </h2>
                  <p className="poem-excerpt">
                    <button
                      className="record-excerpt"
                      onClick={() => openPoem(p.id)}
                    >
                      {p.lines.join("，")}。
                    </button>
                  </p>
                  <button
                    className="record-read"
                    onClick={() => openPoem(p.id)}
                  >
                    阅读全文 ›
                  </button>
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
                          <button
                            className="record-title"
                            onClick={() => openPoem(p.id)}
                          >
                            {p.title} · {p.author}
                          </button>
                        </h2>
                        <p className="poem-excerpt">
                          <button
                            className="record-excerpt"
                            onClick={() => openPoem(p.id)}
                          >
                            {p.lines.join("，")}。
                          </button>
                        </p>
                        <button
                          className="record-read"
                          onClick={() => openPoem(p.id)}
                        >
                          阅读全文 ›
                        </button>
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
