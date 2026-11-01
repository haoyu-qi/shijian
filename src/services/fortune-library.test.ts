import { describe, expect, it, vi } from "vitest";
import { fortunes } from "../content";
import legacy from "../../tests/fixtures/fortunes-legacy.json";
import {
  drawFortune,
  getSnapshot,
  initialState,
  initializeStorage,
  validateState,
} from "./storage";

describe("灵签库扩充", () => {
  it("共六十条，签号连续且签文不重复", () => {
    expect(fortunes).toHaveLength(60);
    expect(fortunes.map((f) => f.id)).toEqual(
      Array.from({ length: 60 }, (_, i) => i + 1),
    );
    expect(new Set(fortunes.map((f) => f.verse)).size).toBe(60);
    for (const f of fortunes) {
      expect(f.verse.trim()).not.toBe("");
      expect(f.meaning.trim()).not.toBe("");
      expect(f.note.trim()).not.toBe("");
    }
    expect(new Set(fortunes.slice(6).map((f) => f.category)).size).toBe(6);
    expect(fortunes.slice(6).every((f) => f.origin === "项目编写")).toBe(true);
  });
  it("原有六签原文、签号不变", () => {
    expect(fortunes.slice(0, 6)).toEqual(legacy);
  });
  it("新旧签号均可恢复历史，库外签号仍被拒绝", () => {
    for (const f of fortunes) {
      const saved = { ...initialState(), draws: { "2026-11-01": f.id } };
      expect(validateState(saved).draws).toEqual(saved.draws);
    }
    for (const id of [0, 61, -1, 1.5])
      expect(() =>
        validateState({ ...initialState(), draws: { "2026-11-01": id } }),
      ).toThrow();
  });
  it("抽签覆盖新增的末号，重抽和重启保留当日结果", async () => {
    let saved: string | null = null;
    vi.stubGlobal("localStorage", {
      getItem: () => saved,
      setItem: (_key: string, value: string) => {
        saved = value;
      },
    });
    const rng = vi
      .spyOn(crypto, "getRandomValues")
      .mockImplementation((array) => {
        (array as Uint32Array)[0] = 59;
        return array;
      });
    try {
      await initializeStorage();
      await drawFortune("2026-11-01");
      expect(getSnapshot().draws["2026-11-01"]).toBe(60);
      await drawFortune("2026-11-01");
      expect(rng).toHaveBeenCalledTimes(1);
      await initializeStorage();
      expect(getSnapshot().draws["2026-11-01"]).toBe(60);
    } finally {
      rng.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
