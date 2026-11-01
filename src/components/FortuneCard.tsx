import { fortunes, type Fortune } from "../content";
import type { Theme } from "../services/storage";
export function FortuneCard({
  fortune,
  day,
  busy,
  onDraw,
  onHistory,
  theme,
}: {
  fortune: Fortune | undefined;
  day: string;
  busy: boolean;
  onDraw: () => void;
  onHistory: () => void;
  theme: Theme;
}) {
  return (
    <article
      className={`fortune-card fortune-redesign ${fortune ? "is-drawn" : ""}`}
      data-fortune-theme={theme}
    >
      <div
        className="fortune-scene"
        style={{ backgroundImage: `url('/themes/${theme}-v1.png')` }}
        aria-hidden="true"
      />
      <div className="fortune-overline">一日一签 · 静候好意</div>
      {fortune ? (
        <>
          <div className="fortune-number">
            第 {String(fortune.id).padStart(2, "0")} 签
          </div>
          <div className="fortune-scroll">
            <span className="scroll-cap" aria-hidden="true" />
            <div className="fortune-verse">
              {fortune.verse.split(/[，,]/).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <span className="scroll-cap" aria-hidden="true" />
          </div>
          <section className="fortune-interpretation">
            <h2>签意</h2>
            <p>{fortune.meaning}</p>
          </section>
          <section className="fortune-wish">
            <h2>今日寄语</h2>
            <p>{fortune.note}</p>
          </section>
          <p className="fortune-date">{day} · 已为你留存，今日无需重抽</p>
        </>
      ) : (
        <>
          <div
            className={`fortune-symbol ${busy ? "drawing" : ""}`}
            aria-hidden="true"
          >
            <svg viewBox="0 0 120 150" fill="none">
              <g
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M42 87 28 28l9-2 15 59M55 84 53 14h10l1 70M72 87l15-63 9 2-15 61" />
                <path d="M29 78q31 10 62 0l-5 53q-26 15-52 0zM33 90q27 8 54 0M34 126q26 12 52 0" />
                <path d="M50 104h20M60 98v21M50 113h20" />
              </g>
              <circle
                cx="60"
                cy="74"
                r="47"
                stroke="currentColor"
                opacity=".12"
              />
            </svg>
          </div>
          <h2 className="fortune-invite">
            <span>放慢片刻</span>
            <span>问候今日</span>
          </h2>
          <p className="fortune-intro">
            {fortunes.length} 条生活签，为今天留一句寄语。
          </p>
          <button
            className="primary fortune-draw"
            disabled={busy}
            onClick={onDraw}
          >
            {busy ? "正在落签…" : "抽取今日签"}
          </button>
          <p className="fortune-once">每日一次 · 结果自动保存</p>
        </>
      )}
      <p className="entertainment">传统文化娱乐体验，签文仅作生活寄语。</p>
      <button className="text-button" onClick={onHistory}>
        查看往日灵签 ›
      </button>
    </article>
  );
}
