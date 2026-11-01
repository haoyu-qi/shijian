import { poems } from "../content";
const ids = new Set(poems.map((p) => p.id));
function hash(text: string) {
  let n = 2166136261;
  for (const c of text) {
    n ^= c.codePointAt(0)!;
    n = Math.imul(n, 16777619);
  }
  return n >>> 0;
}
function recentIds(
  day: string,
  history: Record<string, string>,
  trail: string[],
) {
  const time = Date.parse(day + "T00:00:00Z");
  return new Set([
    ...Object.entries(history)
      .filter(([d]) => {
        const age = time - Date.parse(d + "T00:00:00Z");
        return age > 0 && age <= 30 * 86400000;
      })
      .map(([, id]) => id),
    ...trail.slice(-30),
  ]);
}
function pick(options: typeof poems, seed: string, month?: number) {
  return options
    .map((p) => ({
      id: p.id,
      score:
        -Math.log((hash(seed + "|" + p.id) + 1) / 4294967297) /
        (month && p.seasons.includes(month) ? 3 : 1),
    }))
    .sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))[0].id;
}
export function dailyPoemId(
  day: string,
  month: number,
  history: Record<string, string> = {},
  trail: string[] = [],
) {
  if (ids.has(history[day])) return history[day];
  const recent = recentIds(day, history, trail);
  let options = poems.filter(
    (p) =>
      !recent.has(p.id) && (!p.seasons.length || p.seasons.includes(month)),
  );
  if (!options.length) options = poems.filter((p) => !recent.has(p.id));
  return pick(options.length ? options : poems, day, month);
}
export function nextPoemId(
  id: string,
  day = "manual",
  history: Record<string, string> = {},
  trail: string[] = [],
) {
  const recent = recentIds(day, history, trail);
  recent.add(id);
  const options = poems.filter((p) => !recent.has(p.id));
  return pick(
    options.length ? options : poems.filter((p) => p.id !== id),
    day + "|" + id,
  );
}
