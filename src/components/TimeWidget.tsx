import { shichen } from "../services/calendar";
import type { State } from "../services/storage";
export function TimeWidget({
  now,
  mode,
}: {
  now: Date;
  mode: State["timeMode"];
}) {
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return (
    <section
      className={`time-widget ${mode === "traditional" ? "traditional" : ""}`}
      aria-label={`现在 ${time} ${shichen(now)}`}
    >
      <span className="corner tl" />
      <span className="corner br" />
      {mode !== "traditional" && (
        <time dateTime={now.toISOString()}>{time}</time>
      )}
      {mode !== "modern" && <span className="hour-seal">{shichen(now)}</span>}
    </section>
  );
}
