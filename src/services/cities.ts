import type { City } from "./storage";
export interface CityResult extends City {
  region: string;
}
export function parseCities(value: unknown): CityResult[] {
  const results = (value as { results?: unknown })?.results;
  if (results === undefined) return [];
  if (!Array.isArray(results)) throw new Error("城市数据格式不正确");
  return results.flatMap((r) => {
    if (
      !r ||
      r.country_code !== "CN" ||
      typeof r.id !== "number" ||
      typeof r.name !== "string" ||
      !r.name.trim() ||
      !Number.isFinite(r.latitude) ||
      Math.abs(r.latitude) > 90 ||
      !Number.isFinite(r.longitude) ||
      Math.abs(r.longitude) > 180
    )
      return [];
    return [
      {
        id: `geo-${r.id}`,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        region: [r.admin1, r.admin2, r.admin3]
          .filter(
            (v, i, a) =>
              typeof v === "string" && v && a.indexOf(v) === i && v !== r.name,
          )
          .join(" · "),
      },
    ];
  });
}
export async function searchCities(query: string, signal: AbortSignal) {
  const name = query.trim().replace(/市$/, "");
  if (name.length < 2) throw new Error("请输入至少两个字的城市名或拼音");
  const params = new URLSearchParams({
    name,
    count: "30",
    language: "zh",
    format: "json",
    countryCode: "CN",
  });
  const response = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    {
      signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
      credentials: "omit",
    },
  );
  if (!response.ok) throw new Error("城市服务暂不可用");
  return parseCities(await response.json());
}
