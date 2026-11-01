import { describe, expect, it } from "vitest";
import { calendar, localDateKey, nextMinuteDelay, shichen } from "./calendar";
import { dailyPoemId, nextPoemId } from "./poetry";
import { poems } from "../content";
import { initialState, validateState } from "./storage";
describe("时间与历法边界", () => {
  it.each([
    [22, 59, "亥时"],
    [23, 0, "子时"],
    [0, 59, "子时"],
    [1, 0, "丑时"],
    [8, 59, "辰时"],
    [9, 0, "巳时"],
    [10, 59, "巳时"],
    [11, 0, "午时"],
  ])("%i:%i → %s", (hour, minute, expected) =>
    expect(shichen(new Date(2026, 9, 31, hour, minute))).toBe(expected),
  );
  it("使用本地日期作为每日记录键", () =>
    expect(localDateKey(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01"));
  it("每次从真实时间计算下一个分钟边界", () => {
    expect(nextMinuteDelay(new Date("2026-10-31T01:02:59.900Z"))).toBe(125);
    expect(nextMinuteDelay(new Date("2026-10-31T01:03:00.000Z"))).toBe(60025);
  });
  it("独立历法样例：2024 年春节为正月初一", () => {
    const c = calendar(new Date("2024-02-10T04:00:00Z"));
    expect(c.lunar).toContain("正月初一");
    expect(c.festivals).toContain("春节");
  });
  it("独立历法样例：2023 年闰二月初一", () =>
    expect(calendar(new Date("2023-03-22T04:00:00Z")).lunar).toContain(
      "闰二月初一",
    ));
});
describe("每日诗词", () => {
  it("同日结果稳定且匹配季节", () => {
    const id = dailyPoemId("2026-10-31", 10);
    expect(dailyPoemId("2026-10-31", 10)).toBe(id);
    const selected = poems.find((p) => p.id === id)!;
    expect(selected.seasons.length === 0 || selected.seasons.includes(10)).toBe(
      true,
    );
  });
  it("手动换诗不会立即重复", () => {
    for (const p of poems) expect(nextPoemId(p.id)).not.toBe(p.id);
  });
});
describe("本地数据保护", () => {
  it("允许有效数据", () =>
    expect(validateState(initialState()).schemaVersion).toBe(2));
  it("拒绝不兼容版本或损坏记录", () => {
    expect(() =>
      validateState({ ...initialState(), schemaVersion: 99 }),
    ).toThrow();
    expect(() =>
      validateState({ ...initialState(), draws: { "2026-10-31": 999 } }),
    ).toThrow();
    expect(() =>
      validateState({
        ...initialState(),
        dailyPoems: { "2026-10-31": "missing" },
      }),
    ).toThrow();
  });
});
