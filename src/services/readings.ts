import imported from "../data/poem-readings.imported.json" with { type: "json" };
import curated from "../data/poem-readings.curated.json" with { type: "json" };

export interface PoemReading {
  kind: "project" | "ai-reference";
  translation?: string[];
  notes?: { term: string; text: string }[];
  appreciation: string;
  versionNote?: string;
  source?: {
    repository: string;
    revision: string;
    path: string;
    id: string;
    author: string;
    contentSha256: string;
  };
}
export const poemReadings: Record<string, PoemReading> = {
  ...imported,
  ...curated,
} as Record<string, PoemReading>;
export const readingCount = Object.keys(poemReadings).length;
