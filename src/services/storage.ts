import { isTauri } from "@tauri-apps/api/core";
import { load } from "@tauri-apps/plugin-store";
import { poems, fortunes } from "../content";
export type Theme = "paper" | "blossom" | "rain" | "moon" | "snow";
export type Layout = "classic" | "horizontal" | "moon";
export interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}
export interface State {
  schemaVersion: 2;
  theme: Theme;
  layout: Layout;
  themeMode: "manual" | "daily" | "auto";
  dailyThemes: Record<string, Theme>;
  timeMode: "both" | "modern" | "traditional";
  reducedMotion: boolean;
  pinned: boolean;
  locked: boolean;
  city: City | null;
  favorites: string[];
  dailyPoems: Record<string, string>;
  recentPoems?: string[];
  draws: Record<string, number>;
}
export const initialState = (): State => ({
  schemaVersion: 2,
  theme: "paper",
  layout: "classic",
  themeMode: "manual",
  dailyThemes: {},
  timeMode: "both",
  reducedMotion: false,
  pinned: false,
  locked: false,
  city: null,
  favorites: [],
  dailyPoems: {},
  recentPoems: [],
  draws: {},
});
let state = initialState();
const listeners = new Set<() => void>();
const poemIds = new Set(poems.map((p) => p.id));
let persist: (value: State) => Promise<void>;
let queue = Promise.resolve();
const themeNames = ["paper", "blossom", "rain", "moon", "snow"];
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function validateState(value: unknown): State {
  if (
    !record(value) ||
    (value.schemaVersion !== 1 && value.schemaVersion !== 2)
  )
    throw new Error("本地数据版本不兼容");
  const v = (value.schemaVersion === 1
    ? { ...initialState(), ...value, schemaVersion: 2 }
    : value) as unknown as State;
  if (
    !themeNames.includes(v.theme) ||
    !["classic", "horizontal", "moon"].includes(v.layout) ||
    !["manual", "daily", "auto"].includes(v.themeMode) ||
    !["both", "modern", "traditional"].includes(v.timeMode) ||
    typeof v.reducedMotion !== "boolean" ||
    typeof v.pinned !== "boolean" ||
    typeof v.locked !== "boolean" ||
    !Array.isArray(v.favorites) ||
    !v.favorites.every((id) => poemIds.has(id)) ||
    (v.recentPoems !== undefined &&
      (!Array.isArray(v.recentPoems) ||
        v.recentPoems.length > 30 ||
        !v.recentPoems.every((id) => poemIds.has(id)))) ||
    !record(v.dailyPoems) ||
    !record(v.draws) ||
    !record(v.dailyThemes)
  )
    throw new Error("本地数据格式不正确");
  const validDay = (key: string) => /^\d{4}-\d{2}-\d{2}$/.test(key);
  for (const [key, id] of Object.entries(v.dailyPoems))
    if (!validDay(key) || !poemIds.has(id)) throw new Error("诗词记录损坏");
  for (const [key, id] of Object.entries(v.draws))
    if (!validDay(key) || !fortunes.some((f) => f.id === id))
      throw new Error("灵签记录损坏");
  for (const [key, id] of Object.entries(v.dailyThemes))
    if (!validDay(key) || !themeNames.includes(id))
      throw new Error("皮肤记录损坏");
  if (
    v.city !== null &&
    (!record(v.city) ||
      typeof v.city.id !== "string" ||
      typeof v.city.name !== "string" ||
      !v.city.name.trim() ||
      !Number.isFinite(v.city.latitude) ||
      Math.abs(v.city.latitude) > 90 ||
      !Number.isFinite(v.city.longitude) ||
      Math.abs(v.city.longitude) > 180)
  )
    throw new Error("城市配置损坏");
  return v;
}
export async function initializeStorage() {
  if (isTauri()) {
    const store = await load("shijian.json", { defaults: {}, autoSave: false });
    const saved = await store.get<unknown>("state");
    state = saved === undefined ? initialState() : validateState(saved);
    persist = async (value) => {
      await store.set("state", value);
      await store.save();
    };
  } else {
    const saved = localStorage.getItem("shijian-v1");
    state = saved === null ? initialState() : validateState(JSON.parse(saved));
    persist = async (value) => {
      localStorage.setItem("shijian-v1", JSON.stringify(value));
    };
  }
}
export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getSnapshot = () => state;
export function updateState(change: (current: State) => State): Promise<void> {
  const task = queue.then(async () => {
    const next = validateState(change(state));
    if (next === state) return;
    await persist(next);
    state = next;
    listeners.forEach((fn) => fn());
  });
  queue = task.catch(() => {});
  return task;
}
export async function drawFortune(day: string) {
  await updateState((s) =>
    s.draws[day]
      ? s
      : {
          ...s,
          draws: {
            ...s.draws,
            [day]:
              fortunes[
                crypto.getRandomValues(new Uint32Array(1))[0] % fortunes.length
              ].id,
          },
        },
  );
}
