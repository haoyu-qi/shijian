import type { City } from "./storage";
export interface Weather {
  cityId: string;
  temperature: number;
  code: number;
  humidity: number;
  wind: number;
  observedAt: number;
  fetchedAt: number;
}
export const presets: City[] = [
  { id: "shanghai", name: "上海", latitude: 31.23, longitude: 121.47 },
  { id: "hangzhou", name: "杭州", latitude: 30.27, longitude: 120.15 },
  { id: "beijing", name: "北京", latitude: 39.9, longitude: 116.41 },
  { id: "chengdu", name: "成都", latitude: 30.57, longitude: 104.07 },
  { id: "guangzhou", name: "广州", latitude: 23.13, longitude: 113.26 },
  { id: "xian", name: "西安", latitude: 34.34, longitude: 108.94 },
];
export const WEATHER_TTL = 30 * 60 * 1000;
export const cityCacheKey = (city: City) =>
  `shijian-weather-${city.id}-${city.latitude}-${city.longitude}`;
export function weatherDescription(code: number): [string, string] {
  if (code === 0) return ["晴", "☀"];
  if (code <= 3) return ["多云", "☁"];
  if ([45, 48].includes(code)) return ["雾", "≋"];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["雪", "❄"];
  if (code >= 95) return ["雷雨", "ϟ"];
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return ["雨", "☂"];
  return ["天气", "☁"];
}
export function parseWeather(value: unknown, cityId: string): Weather {
  const c = (value as { current?: Record<string, unknown> })?.current;
  if (
    !c ||
    ![
      "temperature_2m",
      "weather_code",
      "relative_humidity_2m",
      "wind_speed_10m",
      "time",
    ].every((k) => typeof c[k] === "number" && Number.isFinite(c[k]))
  )
    throw new Error("天气响应不完整");
  return {
    cityId,
    temperature: c.temperature_2m as number,
    code: c.weather_code as number,
    humidity: c.relative_humidity_2m as number,
    wind: c.wind_speed_10m as number,
    observedAt: (c.time as number) * 1000,
    fetchedAt: Date.now(),
  };
}
export async function fetchWeather(
  city: City,
  signal: AbortSignal,
): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m",
    timeformat: "unixtime",
    timezone: "auto",
    forecast_days: "1",
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    {
      signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
      credentials: "omit",
    },
  );
  if (!response.ok) throw new Error(`天气服务 ${response.status}`);
  return parseWeather(await response.json(), city.id);
}
export function readWeatherCache(city: City): Weather | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(cityCacheKey(city)) ?? "null",
    ) as Weather | null;
    return value &&
      value.cityId === city.id &&
      [
        "temperature",
        "code",
        "humidity",
        "wind",
        "observedAt",
        "fetchedAt",
      ].every((k) => Number.isFinite(value[k as keyof Weather]))
      ? value
      : null;
  } catch {
    return null;
  }
}
