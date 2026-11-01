import { describe, it, expect } from "vitest";
import { initialState, validateState } from "./storage";
import { effectiveTheme, randomTheme, recommendedTheme } from "./themes";
import { parseWeather, weatherDescription } from "./weather";
describe("主题选择", () => {
  it("夜晚优先，白天雪雨与季节依次判断", () => {
    expect(recommendedTheme(new Date(2026, 2, 1, 20), 61)).toBe("moon");
    expect(recommendedTheme(new Date(2026, 2, 1, 12), 71)).toBe("snow");
    expect(recommendedTheme(new Date(2026, 2, 1, 12), 61)).toBe("rain");
    expect(recommendedTheme(new Date(2026, 2, 1, 12))).toBe("blossom");
    expect(recommendedTheme(new Date(2026, 11, 1, 12))).toBe("snow");
  });
  it("手动选择不受天气影响，每日随机跨重启稳定", () => {
    const state = initialState(),
      date = new Date(2026, 9, 31, 20);
    expect(effectiveTheme(state, date, "2026-10-31", 71)).toBe("paper");
    expect(randomTheme("2026-10-31")).toBe(randomTheme("2026-10-31"));
    expect(
      effectiveTheme(
        { ...state, themeMode: "daily", dailyThemes: { "2026-10-31": "rain" } },
        date,
        "2026-10-31",
        71,
      ),
    ).toBe("rain");
  });
});
describe("旧数据迁移", () => {
  it("保留收藏签文，新增布局与皮肤字段", () => {
    const old = {
      schemaVersion: 1,
      theme: "moon",
      timeMode: "both",
      reducedMotion: false,
      favorites: ["qiuxi"],
      dailyPoems: { "2026-10-31": "qiuxi" },
      draws: { "2026-10-31": 2 },
    };
    const migrated = validateState(old);
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.layout).toBe("classic");
    expect(migrated.favorites).toEqual(["qiuxi"]);
    expect(migrated.draws).toEqual(old.draws);
  });
  it("拒绝损坏的旧数据和异常城市坐标", () => {
    expect(() =>
      validateState({ ...initialState(), schemaVersion: 1, draws: [] }),
    ).toThrow();
    expect(() =>
      validateState({
        ...initialState(),
        city: { id: "x", name: "错误", latitude: NaN, longitude: 0 },
      }),
    ).toThrow();
  });
});
describe("天气数据校验", () => {
  it("拒绝缺失或异常值，合法数据保留真实时次", () => {
    expect(() =>
      parseWeather({ current: { temperature_2m: null } }, "shanghai"),
    ).toThrow();
    const result = parseWeather(
      {
        current: {
          temperature_2m: 18.2,
          weather_code: 61,
          relative_humidity_2m: 75,
          wind_speed_10m: 5,
          time: 1700000000,
        },
      },
      "shanghai",
    );
    expect(result.observedAt).toBe(1700000000000);
    expect(result.temperature).toBe(18.2);
  });
  it("冻雨不会误判为雪", () => {
    expect(weatherDescription(67)[0]).toBe("雨");
    expect(weatherDescription(77)[0]).toBe("雪");
  });
});
