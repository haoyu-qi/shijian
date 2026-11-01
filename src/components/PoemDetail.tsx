import { Fragment, useState } from "react";
import type { Poem } from "../content";
import { poemReadings } from "../services/readings";

export function PoemDetail({
  poem,
  day,
  favorite,
  busy,
  onFavorite,
}: {
  poem: Poem;
  day: string;
  favorite: boolean;
  busy: boolean;
  onFavorite: () => void;
}) {
  const [view, setView] = useState<"original" | "reading">("original");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const reading = poemReadings[poem.id];
  async function copy() {
    setError("");
    setCopied(false);
    try {
      await navigator.clipboard.writeText(
        `${poem.full}\n——〔${poem.dynasty}〕${poem.author}《${poem.title}》\n${day} · 诗笺`,
      );
      setCopied(true);
    } catch {
      setError("复制未完成，请重试。");
    }
  }
  return (
    <article className="poem-detail">
      <p className="muted">
        〔{poem.dynasty}〕{poem.author}
      </p>
      <nav className="reader-tabs" aria-label="诗词阅读">
        {(
          [
            ["original", "原文"],
            ["reading", "解读"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            aria-pressed={view === id}
            onClick={(event) => {
              setView(id);
              const dialog = event.currentTarget.closest("dialog");
              if (dialog) dialog.scrollTop = 0;
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {view === "original" ? (
        <>
          <h2>原文</h2>
          <p className="full-poem">
            {poem.full.split("\n").map((paragraph, index) => (
              <Fragment key={index}>
                {index > 0 && "\n"}
                {paragraph
                  .split(/(?<=[，。！？；：])/u)
                  .map((sentence, part) => (
                    <span className="poem-sentence" key={part}>
                      {sentence}
                    </span>
                  ))}
              </Fragment>
            ))}
          </p>
          <p className="reader-availability">
            {reading?.translation
              ? "本地已收录白话释义、词语注释与赏析，点击「解读」阅读。"
              : reading || poem.meaning
                ? "本地已收录阅读参考，点击「解读」阅读。"
                : "全文已保存在本地，此诗详解待补充。"}
          </p>
        </>
      ) : (
        <div className="poem-reading">
          {reading ? (
            <>
              {reading.versionNote && (
                <p className="version-note">{reading.versionNote}</p>
              )}
              {reading.translation && (
                <section aria-label="白话释义">
                  <h2>白话释义</h2>
                  {reading.translation.map((text, i) => (
                    <p key={i}>{text}</p>
                  ))}
                </section>
              )}
              {reading.notes && (
                <section aria-label="词语注释">
                  <h2>词语注释</h2>
                  <dl>
                    {reading.notes.map((note) => (
                      <div key={note.term}>
                        <dt>{note.term}</dt>
                        <dd>{note.text}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
              <section aria-label="赏析">
                <h2>赏析</h2>
                {reading.kind === "ai-reference" && (
                  <p className="reading-badge">AI整理 · 阅读参考</p>
                )}
                <p>{reading.appreciation}</p>
              </section>
              <p className="muted small">
                {reading.kind === "project"
                  ? "释义与注释：诗笺整理，供阅读参考。"
                  : "赏析来源：诗歌总集（MIT）· AI辅助整理，未经逐篇人工校订。"}
              </p>
            </>
          ) : poem.meaning ? (
            <section aria-label="读诗小记">
              <h2>读诗小记</h2>
              <p>{poem.meaning}</p>
            </section>
          ) : (
            <section className="reading-empty">
              <h2>本地详解待补充</h2>
              <p>完整原文可离线阅读，释义与赏析将在后续版本继续补充。</p>
            </section>
          )}
        </div>
      )}
      <p className="muted small poem-source">
        {poem.source ? "原文：中华诗词开源诗库 · 简体整理" : "原文：本地诗词库"}
      </p>
      {error && (
        <p className="reader-error" role="alert">
          {error}
        </p>
      )}
      {copied && (
        <p className="reader-feedback" role="status">
          诗词已复制
        </p>
      )}
      <div className="button-row">
        <button disabled={busy} onClick={onFavorite}>
          {favorite ? "取消收藏" : "收藏此诗"}
        </button>
        <button onClick={() => void copy()}>复制诗词</button>
      </div>
    </article>
  );
}
