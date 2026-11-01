import type { Layout, State, Theme } from "./storage";
export const themes: { id: Theme; name: string; detail: string }[] = [
  { id: "paper", name: "宣纸雅韵", detail: "竹影 · 米黄" },
  { id: "blossom", name: "桃花春雨", detail: "桃花 · 浅粉" },
  { id: "rain", name: "烟雨江南", detail: "烟雨 · 青绿" },
  { id: "moon", name: "玄青月色", detail: "月色 · 暖金" },
  { id: "snow", name: "雪落长安", detail: "霜雪 · 梅枝" },
];
export const layouts: {
  id: Layout;
  name: string;
  width: number;
  height: number;
}[] = [
  { id: "classic", name: "经典竖版", width: 280, height: 700 },
  { id: "horizontal", name: "横向诗钟", width: 520, height: 390 },
  { id: "moon", name: "月轮竖版", width: 300, height: 720 },
];
export function randomTheme(day: string): Theme {
  const hash = [...day].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0);
  return themes[hash % themes.length].id;
}
export function recommendedTheme(date: Date, weatherCode?: number): Theme {
  if (date.getHours() < 6 || date.getHours() >= 19) return "moon";
  if (
    weatherCode !== undefined &&
    [71, 73, 75, 77, 85, 86].includes(weatherCode)
  )
    return "snow";
  if (
    weatherCode !== undefined &&
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(
      weatherCode,
    )
  )
    return "rain";
  const month = date.getMonth() + 1;
  return month >= 3 && month <= 5
    ? "blossom"
    : month === 12 || month <= 2
      ? "snow"
      : "paper";
}
export function effectiveTheme(
  state: State,
  date: Date,
  day: string,
  weatherCode?: number,
): Theme {
  if (state.themeMode === "manual") return state.theme;
  if (state.themeMode === "daily")
    return state.dailyThemes[day] ?? randomTheme(day);
  return recommendedTheme(date, weatherCode);
}
