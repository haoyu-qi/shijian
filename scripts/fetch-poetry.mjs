import fs from "node:fs/promises";
import crypto from "node:crypto";
const revision = "b8594f81a89752241442f2ce267d6f66f96704ee";
const root = new URL("../data-source/chinese-poetry/", import.meta.url);
await fs.mkdir(root, { recursive: true });
let tree;
try {
  tree = JSON.parse(
    (await fs.readFile(new URL("tree.json", root), "utf8")).replace(
      /^\uFEFF/,
      "",
    ),
  );
} catch {
  const response = await fetch(
    `https://api.github.com/repos/chinese-poetry/chinese-poetry/git/trees/${revision}?recursive=1`,
  );
  if (!response.ok) throw Error("Cannot fetch source tree");
  tree = (await response.json()).tree;
  await fs.writeFile(new URL("tree.json", root), JSON.stringify(tree));
}
const paths = [
  "LICENSE",
  "全唐诗/唐诗三百首.json",
  "蒙学/qianjiashi.json",
  ...tree
    .filter((f) => /^全唐诗\/poet\.tang\.\d+\.json$/.test(f.path))
    .map((f) => f.path)
    .sort(),
];
let cursor = 0;
const manifest = [];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (cursor < paths.length) {
      const path = paths[cursor++];
      const file = new URL(
        encodeURIComponent(path.replaceAll("/", "__")),
        root,
      );
      let data;
      try {
        data = await fs.readFile(file);
      } catch {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetch(
              `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/${revision}/${path.split("/").map(encodeURIComponent).join("/")}`,
              { signal: AbortSignal.timeout(45000) },
            );
            if (!response.ok) throw Error(`${response.status}: ${path}`);
            data = Buffer.from(await response.arrayBuffer());
            await fs.writeFile(file, data);
            break;
          } catch (error) {
            if (attempt === 2) throw error;
          }
        }
      }
      manifest.push({
        path,
        file: decodeURIComponent(file.pathname.split("/").at(-1)),
        sha256: crypto.createHash("sha256").update(data).digest("hex"),
        bytes: data.length,
      });
    }
  }),
);
manifest.sort((a, b) => paths.indexOf(a.path) - paths.indexOf(b.path));
await fs.writeFile(
  new URL("manifest.json", root),
  JSON.stringify(
    {
      repository: "https://github.com/chinese-poetry/chinese-poetry",
      revision,
      files: manifest,
    },
    null,
    2,
  ),
);
console.log(`Fetched ${manifest.length} pinned source files`);
