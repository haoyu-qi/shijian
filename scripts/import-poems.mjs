import fs from "node:fs/promises";
import crypto from "node:crypto";
import * as OpenCC from "opencc-js";
import * as fontkit from "fontkit";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url),
  cache = new URL("data-source/chinese-poetry/", root);
const manifest = JSON.parse(
  await fs.readFile(new URL("manifest.json", cache), "utf8"),
);
const curated = JSON.parse(
  await fs.readFile(new URL("src/data/poems.curated.json", root), "utf8"),
);
const convert = OpenCC.Converter({ from: "tw", to: "cn" }),
  font = fontkit.openSync(
    fileURLToPath(new URL("public/fonts/ZhiMangXing-Regular.ttf", root)),
  );
const supported = new Map();
const supports = (s) =>
  [...s]
    .filter((c) => /\p{Script=Han}/u.test(c))
    .every((c) => {
      if (!supported.has(c))
        supported.set(c, font.hasGlyphForCodePoint(c.codePointAt(0)));
      return supported.get(c);
    });
const normalize = (s) =>
  convert(String(s ?? ""))
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
const key = (a, t) => a + "|" + t.replace(/[\s·・其（）()]/g, "");
const seenTitles = new Set(curated.map((p) => key(p.author, p.title))),
  seenFull = new Set(curated.map((p) => p.full.replace(/[\s\p{P}]/gu, "")));
const candidates = [],
  stats = { read: 0, invalid: 0, missingGlyph: 0, duplicate: 0, eligible: 0 };
function seasons(text) {
  const result = [];
  if (/春|桃花|柳絮|燕子|清明|寒食/.test(text)) result.push(3, 4, 5);
  if (/夏|荷花|莲花|暑|蝉/.test(text)) result.push(6, 7, 8);
  if (/秋|菊|霜|落叶/.test(text)) result.push(9, 10, 11);
  if (/冬|雪|梅花|腊/.test(text)) result.push(12, 1, 2);
  return [...new Set(result)];
}
function visit(record, path, anthology, dynasty = "唐") {
  if (Array.isArray(record)) {
    record.forEach((r) => visit(r, path, anthology, dynasty));
    return;
  }
  if (!record || typeof record !== "object") return;
  if (!Array.isArray(record.paragraphs)) {
    if (record.content) visit(record.content, path, anthology, dynasty);
    return;
  }
  stats.read++;
  let title = normalize(record.title ?? record.chapter),
    author = normalize(record.author);
  const era = author.match(/^[（(]([^）)]+)[）)]/);
  if (era) {
    dynasty = era[1];
    author = author.slice(era[0].length);
  }
  const paragraphs = record.paragraphs.map(normalize),
    full = paragraphs.join("\n");
  if (
    !title ||
    title.length > 12 ||
    !author ||
    author.length > 6 ||
    paragraphs.length < 1 ||
    paragraphs.length > 8 ||
    full.length > 240 ||
    /[□�{}【】]/.test(full) ||
    !paragraphs.every((p) => /^[\p{Script=Han}，。！？、；：]+$/u.test(p))
  ) {
    stats.invalid++;
    return;
  }
  const pairs = paragraphs.flatMap((p) => {
    const match = p.match(
      /^([\p{Script=Han}]{5}|[\p{Script=Han}]{7})，([\p{Script=Han}]{5}|[\p{Script=Han}]{7})[。！？]$/u,
    );
    return match && match[1].length === match[2].length
      ? [[match[1], match[2]]]
      : [];
  });
  if (!pairs.length) {
    stats.invalid++;
    return;
  }
  if (!supports(full + title + author)) {
    stats.missingGlyph++;
    return;
  }
  const tk = key(author, title),
    fk = full.replace(/[\s\p{P}]/gu, "");
  if (seenTitles.has(tk) || seenFull.has(fk)) {
    stats.duplicate++;
    return;
  }
  seenTitles.add(tk);
  seenFull.add(fk);
  const lines = pairs
    .map((pair, i) => ({
      pair,
      i,
      score: [...pair.join("")].filter((c) =>
        "山水风月花雨雪竹松云日江湖鸟春秋".includes(c),
      ).length,
    }))
    .sort((a, b) => b.score - a.score || a.i - b.i)[0].pair;
  const upstreamId =
    record.id ??
    crypto
      .createHash("sha256")
      .update(author + "|" + title + "|" + full)
      .digest("hex")
      .slice(0, 24);
  candidates.push({
    id: `cp-${upstreamId}`,
    title,
    author,
    dynasty,
    lines,
    full,
    meaning: "",
    seasons: seasons(title + " " + full),
    source: { path, id: String(upstreamId) },
    anthology,
  });
}
for (const item of manifest.files) {
  if (!item.path.endsWith(".json")) continue;
  const raw = await fs.readFile(new URL(encodeURIComponent(item.file), cache));
  if (crypto.createHash("sha256").update(raw).digest("hex") !== item.sha256)
    throw Error("Source checksum mismatch: " + item.path);
  visit(JSON.parse(raw), item.path, !/poet\.tang\.\d+/.test(item.path));
}
stats.eligible = candidates.length;
const selected = candidates.filter((p) => p.anthology),
  rest = candidates.filter((p) => !p.anthology);
const hash = (p) => crypto.createHash("sha256").update(p.id).digest("hex");
rest.sort((a, b) => hash(a).localeCompare(hash(b)));
// Round-robin authors avoids filling the entire calendar with one prolific poet.
const groups = new Map();
for (const p of rest) {
  if (!groups.has(p.author)) groups.set(p.author, []);
  groups.get(p.author).push(p);
}
while (selected.length < 2000 && groups.size) {
  for (const [author, group] of groups) {
    if (selected.length >= 2000) break;
    selected.push(group.shift());
    if (!group.length) groups.delete(author);
  }
}
const imported = selected.map(({ anthology, ...p }) => p);
await fs.writeFile(
  new URL("src/data/poems.imported.json", root),
  JSON.stringify(imported, null, 2) + "\n",
);
await fs.mkdir(new URL("public/licenses/", root), { recursive: true });
await fs.copyFile(
  new URL("LICENSE", cache),
  new URL("public/licenses/chinese-poetry-MIT.txt", root),
);
const all = [...curated, ...imported];
const report = {
  repository: manifest.repository,
  revision: manifest.revision,
  license: "MIT",
  imported: imported.length,
  legacy: curated.length,
  total: all.length,
  authors: new Set(all.map((p) => p.author)).size,
  stats,
  seasonal: Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [
      i + 1,
      all.filter((p) => p.seasons.includes(i + 1)).length,
    ]),
  ),
  general: all.filter((p) => !p.seasons.length).length,
  files: manifest.files,
};
await fs.writeFile(
  new URL("src/data/poems.provenance.json", root),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify({ ...report, files: report.files.length }, null, 2));
