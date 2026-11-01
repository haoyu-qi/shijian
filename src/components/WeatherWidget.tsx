import { useEffect, useRef, useState } from "react";
import type { City } from "../services/storage";
import {
  cityCacheKey,
  fetchWeather,
  readWeatherCache,
  WEATHER_TTL,
  weatherDescription,
  type Weather,
} from "../services/weather";
export function useWeather(city: City | null, now: Date) {
  const [result, setResult] = useState<{
    key: string;
    data: Weather | null;
    loading: boolean;
    failed: boolean;
  }>({ key: "", data: null, loading: false, failed: false });
  const [retry, setRetry] = useState(0);
  const key = city ? cityCacheKey(city) : "";
  const failedAt = useRef<Record<string, number>>({});
  const previousRetry = useRef(0);
  useEffect(() => {
    if (!city) {
      setResult({ key: "", data: null, loading: false, failed: false });
      return;
    }
    const controller = new AbortController();
    let active = true;
    const cached = readWeatherCache(city);
    const forced = previousRetry.current !== retry;
    previousRetry.current = retry;
    if (
      !forced &&
      failedAt.current[key] &&
      Date.now() - failedAt.current[key] >= 0 &&
      Date.now() - failedAt.current[key] < 5 * 60000
    ) {
      setResult({ key, data: cached, loading: false, failed: true });
      return;
    }
    setResult({
      key,
      data: cached,
      loading: !cached || Date.now() - cached.fetchedAt >= WEATHER_TTL,
      failed: false,
    });
    if (
      cached &&
      Date.now() - cached.fetchedAt >= 0 &&
      Date.now() - cached.fetchedAt < WEATHER_TTL
    )
      return () => {
        active = false;
        controller.abort();
      };
    fetchWeather(city, controller.signal)
      .then((data) => {
        if (!active) return;
        delete failedAt.current[key];
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch {}
        setResult({ key, data, loading: false, failed: false });
      })
      .catch(() => {
        if (active) {
          failedAt.current[key] = Date.now();
          setResult({ key, data: cached, loading: false, failed: true });
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [key, Math.floor(now.getTime() / 60000), retry]);
  useEffect(() => {
    const online = () => setRetry((v) => v + 1);
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, []);
  return {
    ...(result.key === key
      ? result
      : { key, data: null, loading: !!city, failed: false }),
    refresh: () => setRetry((v) => v + 1),
  };
}
export function WeatherWidget({
  city,
  weather,
  loading,
  failed,
  onConfigure,
}: {
  city: City | null;
  weather: Weather | null;
  loading: boolean;
  failed: boolean;
  onConfigure: () => void;
}) {
  const [description, icon] = weatherDescription(weather?.code ?? 3);
  const stale =
    !!weather && (Date.now() - weather.fetchedAt >= WEATHER_TTL || failed);
  const observed = weather
    ? new Date(weather.observedAt).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return (
    <button
      className="weather"
      onClick={onConfigure}
      aria-label="设置天气城市"
      title={
        weather
          ? `${city?.name} · 湿度 ${weather.humidity}% · 风速 ${weather.wind} km/h · ${observed} 时次 · Open-Meteo`
          : "选择城市查看天气"
      }
    >
      <span className="weather-icon" aria-hidden="true">
        {weather ? icon : "☁"}
      </span>
      <span>
        <strong>
          {weather ? `${Math.round(weather.temperature)}°C` : "知天时"}
        </strong>
        <small>
          {!city
            ? "选择天气城市"
            : weather
              ? `${city.name} · ${description}${stale ? " · 已过期" : ""}`
              : loading
                ? `${city.name} · 更新中`
                : `${city.name} · 暂不可用`}
        </small>
      </span>
    </button>
  );
}
