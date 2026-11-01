import fs from "node:fs/promises";
import crypto from "node:crypto";
import * as OpenCC from "opencc-js";
const root = new URL("../", import.meta.url);
const cache = new URL("data-source/poetry-readings/", root);
const repository = "https://github.com/open-chinese/poetry-collection";
const revision = "58690b76f47f7dff0131b8374ff0d133f0fab155";
const files = [
  ["80-85分段.json", "c1f087a4db235b8d12354084bb91251269fc3a78"],
  ["85-90分段.json", "c0fd04bbdc12df788dadd675755debcb2205add7"],
  ["90-95分段.json", "fce323c12d113fe72a23aa3f5be6894d0ad28c7c"],
  ["95-100分段.json", "f9d6e663361d159c222a702e3ee3879c6b1a87b0"],
];
await fs.mkdir(cache, { recursive: true });
const convert = OpenCC.Converter({ from: "tw", to: "cn" });
const normalize = (value) =>
  convert(String(value ?? ""))
    .normalize("NFC")
    .replace(/[\s\p{P}\p{S}]/gu, "");
const poems = (
  await Promise.all(
    ["curated", "imported"].map(async (name) =>
      JSON.parse(
        await fs.readFile(new URL(`src/data/poems.${name}.json`, root), "utf8"),
      ),
    ),
  )
).flat();
const readings = {};
const manifest = [];
let sourceRecords = 0;
for (const [name, blob] of files) {
  let bytes;
  const file = new URL(encodeURIComponent(name), cache);
  try {
    bytes = await fs.readFile(file);
  } catch {
    if (!process.argv.includes("--fetch"))
      throw new Error(`Missing cached ${name}; run with --fetch`);
    const path = `appreciation/AI鉴赏与评分/${name}`;
    const response = await fetch(
      `https://raw.githubusercontent.com/open-chinese/poetry-collection/${revision}/${path.split("/").map(encodeURIComponent).join("/")}`,
      { signal: AbortSignal.timeout(60000) },
    );
    if (!response.ok) throw new Error(`${name}: ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(file, bytes);
  }
  const actualBlob = crypto
    .createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
  if (actualBlob !== blob) throw new Error(`Source blob mismatch: ${name}`);
  manifest.push({
    path: `appreciation/AI鉴赏与评分/${name}`,
    blob,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  });
  const records = JSON.parse(bytes);
  sourceRecords += records.length;
  const index = new Map();
  for (const r of records) {
    const summary = r.appreciation?.summary;
    if (
      typeof summary !== "string" ||
      summary.length < 30 ||
      summary.length > 3000
    )
      continue;
    const key = normalize(r.author) + "|" + normalize(r.content);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(r);
  }
  for (const poem of poems) {
    if (readings[poem.id]) continue;
    const matches = index.get(
      normalize(poem.author) + "|" + normalize(poem.full),
    );
    if (!matches || matches.length !== 1) continue;
    const source = matches[0];
    readings[poem.id] = {
      appreciation: convert(source.appreciation.summary).trim(),
      kind: "ai-reference",
      source: {
        repository,
        revision,
        path: manifest.at(-1).path,
        id: source.uuid,
        author: source.author,
        contentSha256: crypto
          .createHash("sha256")
          .update(poem.full)
          .digest("hex"),
      },
    };
  }
}
await fs.writeFile(
  new URL("src/data/poem-readings.imported.json", root),
  JSON.stringify(readings, null, 2) + "\n",
);
await fs.writeFile(
  new URL("src/data/readings.provenance.json", root),
  JSON.stringify(
    {
      repository,
      revision,
      license: "MIT",
      matching:
        "OpenCC + NFC + punctuation/space removal; one exact author/full-text candidate within a source file; first matching file wins",
      sourceRecords,
      matched: Object.keys(readings).length,
      files: manifest,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    sourceRecords,
    matched: Object.keys(readings).length,
    total: poems.length,
  }),
);
