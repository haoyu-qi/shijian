import { describe, it, expect } from "vitest";
import { poems } from "../content";
import { dailyPoemId, nextPoemId } from "./poetry";
import { initialState, validateState } from "./storage";
describe("扩充诗词库", () => {
  it("保留旧 ID，新增诗词正文和来源可追溯", () => {
    expect(poems.length).toBe(2008);
    expect(new Set(poems.map((p) => p.id)).size).toBe(poems.length);
    for (const id of [
      "qiuxi",
      "zhuliguan",
      "chunxiao",
      "xiaochi",
      "jiangxue",
      "wangyue",
      "shanju",
      "yinjiu",
    ])
      expect(poems.some((p) => p.id === id)).toBe(true);
    for (const p of poems.filter((p) => p.source)) {
      expect(
        p.lines.every((line) =>
          /^(?:\p{Script=Han}{5}|\p{Script=Han}{7})$/u.test(line),
        ),
      ).toBe(true);
      expect(p.source?.path).toBeTruthy();
      expect(p.full).toContain(p.lines[0]);
      expect(p.full).toContain(p.lines[1]);
      expect(p.meaning).toBe("");
    }
  });
  it("连续 90 日无近 30 日重复，并保留同日已选结果", () => {
    const history: Record<string, string> = {};
    let trail: string[] = [];
    for (let i = 0; i < 90; i++) {
      const date = new Date(Date.UTC(2026, 9, 1 + i)),
        day = date.toISOString().slice(0, 10),
        id = dailyPoemId(day, date.getUTCMonth() + 1, history, trail);
      expect(trail).not.toContain(id);
      history[day] = id;
      trail = [...trail, id].slice(-30);
      expect(dailyPoemId(day, date.getUTCMonth() + 1, history, trail)).toBe(id);
    }
  });
  it("连续手动换诗不在最近 30 次中重复", () => {
    let id = "qiuxi",
      trail = [id];
    for (let i = 0; i < 100; i++) {
      const next = nextPoemId(id, "2026-11-01", {}, trail);
      expect(trail).not.toContain(next);
      trail = [...trail, next].slice(-30);
      id = next;
    }
  });
  it("旧收藏、旧历史以及新导入诗词记录均能加载", () => {
    const state = initialState();
    state.favorites = ["qiuxi", poems.at(-1)!.id];
    state.dailyPoems = {
      "2026-10-31": "qiuxi",
      "2026-11-01": poems.at(-1)!.id,
    };
    expect(validateState(state).favorites).toEqual(state.favorites);
  });
});
