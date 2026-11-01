import { useEffect, useRef, useState } from "react";
import type { City } from "../services/storage";
import { presets } from "../services/weather";
import { searchCities, type CityResult } from "../services/cities";
export function CityPicker({
  city,
  busy,
  onSelect,
}: {
  city: City | null;
  busy: boolean;
  onSelect: (city: City | null) => void;
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<CityResult[] | null>(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const options =
    city && !presets.some((p) => p.id === city.id)
      ? [city, ...presets]
      : presets;
  return (
    <section className="city-picker">
      <label className="setting-row">
        所在城市
        <select
          aria-label="天气城市"
          value={city?.id ?? ""}
          disabled={busy}
          onChange={(e) =>
            onSelect(options.find((p) => p.id === e.target.value) ?? null)
          }
        >
          <option value="">暂不启用</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <form
        className="city-search"
        onSubmit={async (e) => {
          e.preventDefault();
          controller.current?.abort();
          const c = new AbortController();
          controller.current = c;
          setLoading(true);
          setError("");
          setResults(null);
          try {
            const found = await searchCities(query, c.signal);
            if (!c.signal.aborted) setResults(found);
          } catch (error) {
            if (!c.signal.aborted)
              setError(
                error instanceof Error ? error.message : "搜索失败，请重试",
              );
          } finally {
            if (!c.signal.aborted) setLoading(false);
          }
        }}
      >
        <label htmlFor="city-query">自定义国内城市 / 区县</label>
        <div>
          <input
            id="city-query"
            maxLength={50}
            placeholder="如：苏州、昆山或拼音"
            value={query}
            onChange={(e) => {
              controller.current?.abort();
              setQuery(e.target.value);
              setLoading(false);
              setResults(null);
              setError("");
            }}
          />
          <button
            disabled={loading || busy || query.trim().length < 2}
            type="submit"
          >
            {loading ? "搜索中…" : "搜索"}
          </button>
        </div>
      </form>
      {error && (
        <p className="city-error" role="alert">
          {error}
        </p>
      )}
      {results?.length === 0 && (
        <p className="muted small">
          未找到匹配地区，请尝试去掉省名，或输入拼音。
        </p>
      )}
      {!!results?.length && (
        <ul className="city-results" aria-label="城市搜索结果">
          {results.map((c) => (
            <li key={c.id}>
              <button
                disabled={busy}
                onClick={() => {
                  onSelect(c);
                  setResults(null);
                }}
              >
                <strong>{c.name}</strong>
                <small>
                  {c.region || "中国"} · {city?.id === c.id ? "已选择" : "选用"}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="muted small">
        搜索结果标注省市，选择后自动获取该地区天气。地名数据：GeoNames /
        Open-Meteo。
      </p>
    </section>
  );
}
