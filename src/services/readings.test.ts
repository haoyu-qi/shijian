import { describe, it, expect } from "vitest";
import { poems } from "../content";
import { poemReadings, readingCount } from "./readings";
import imported from "../data/poem-readings.imported.json";
import curated from "../data/poem-readings.curated.json";
describe("离线解读库", () => {
  it("436 首解读均关联现有作品，19 首有释义和词语注释", () => {
    expect(readingCount).toBe(436);
    expect(Object.keys(curated)).toHaveLength(19);
    for (const [id, reading] of Object.entries(poemReadings)) {
      expect(poems.some((p) => p.id === id)).toBe(true);
      expect(reading.appreciation.trim().length).toBeGreaterThan(30);
    }
    for (const r of Object.values(curated)) {
      expect(r.translation.length).toBeGreaterThan(1);
      expect(r.notes.length).toBeGreaterThan(1);
    }
  });
  it("430 条参考赏析与所关联的完整原文指纹一致，避免同名诗误配", async () => {
    expect(Object.keys(imported)).toHaveLength(430);
    for (const [id, r] of Object.entries(imported)) {
      const poem = poems.find((p) => p.id === id)!;
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(poem.full),
      );
      expect(r.source.contentSha256).toBe(
        Array.from(new Uint8Array(digest), (n) =>
          n.toString(16).padStart(2, "0"),
        ).join(""),
      );
      expect(r.kind).toBe("ai-reference");
    }
    const du = poems.find((p) => p.title === "春望" && p.author === "杜甫")!;
    const yang = poems.find(
      (p) => p.title === "春望" && p.author === "羊士谔",
    )!;
    expect(poemReadings[du.id]).not.toBe(poemReadings[yang.id]);
  });
  it("本地整理覆盖同篇参考赏析，保留原文字句异文提示", () => {
    for (const [id, reading] of Object.entries(curated))
      expect(poemReadings[id]).toEqual(reading);
    expect(
      poemReadings["cp-ca2c489a-e433-4c0f-8248-77d354f0665e"].versionNote,
    ).toContain("床前看月光");
  });
});
