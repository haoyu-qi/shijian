import { Solar } from "lunar-typescript";
export const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const branches = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];
export const shichen = (date: Date) =>
  branches[Math.floor((date.getHours() + 1) / 2) % 12] + "时";
export const dayPeriod = (date: Date) =>
  date.getHours() < 6
    ? "夜深"
    : date.getHours() < 11
      ? "清晨"
      : date.getHours() < 17
        ? "日间"
        : date.getHours() < 19
          ? "薄暮"
          : "夜深";
export function calendar(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (name: string) =>
    Number(parts.find((p) => p.type === name)?.value);
  const lunar = Solar.fromYmdHms(
    part("year"),
    part("month"),
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  ).getLunar();
  return {
    lunar: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    term: lunar.getPrevJieQi(false).getName(),
    isTermDay: !!lunar.getJieQi(),
    festivals: lunar.getFestivals().join(" · "),
    weekday: new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(date),
  };
}
export function nextMinuteDelay(date: Date) {
  return 60_000 - (date.getTime() % 60_000) + 25;
}
