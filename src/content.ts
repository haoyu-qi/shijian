import curatedPoems from "./data/poems.curated.json" with { type: "json" };
import importedPoems from "./data/poems.imported.json" with { type: "json" };
import fortuneData from "./data/fortunes.json" with { type: "json" };
export interface Poem {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  lines: [string, string];
  full: string;
  meaning: string;
  seasons: number[];
  source?: { path: string; id: string };
}
// 保留旧 ID，确保已有收藏和历史继续可用。
export const poems: Poem[] = [...curatedPoems, ...importedPoems] as Poem[];
export interface Fortune {
  id: number;
  verse: string;
  meaning: string;
  note: string;
  category?: string;
  origin?: string;
}
// 原有六个签号和内容保持不变，兼容已保存的每日结果。
export const fortunes: Fortune[] = fortuneData;
