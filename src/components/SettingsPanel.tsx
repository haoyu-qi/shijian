import { isTauri } from "@tauri-apps/api/core";
import { layouts, themes } from "../services/themes";
import { CityPicker } from "./CityPicker";
import type { State } from "../services/storage";
import { poems } from "../content";
export function SettingsPanel({
  state,
  busy,
  onChange,
  onHistory,
  onFavorites,
  onRefresh,
}: {
  state: State;
  busy: boolean;
  onChange: (patch: Partial<State>) => void;
  onHistory: () => void;
  onFavorites: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="settings">
      <h2>笺面形制</h2>
      <div className="layout-options">
        {layouts.map((l) => (
          <button
            key={l.id}
            aria-pressed={state.layout === l.id}
            disabled={busy}
            onClick={() => onChange({ layout: l.id })}
          >
            <span className={`layout-icon ${l.id}`} />
            {l.name}
          </button>
        ))}
      </div>
      <h2>笺面风物</h2>
      <label className="setting-row">
        换肤方式
        <select
          aria-label="换肤方式"
          disabled={busy}
          value={state.themeMode}
          onChange={(e) =>
            onChange({ themeMode: e.target.value as State["themeMode"] })
          }
        >
          <option value="manual">手动固定</option>
          <option value="daily">每日随机</option>
          <option value="auto">随昼夜与天气</option>
        </select>
      </label>
      <div className="theme-options">
        {themes.map((t) => (
          <button
            key={t.id}
            disabled={busy}
            aria-pressed={state.themeMode === "manual" && state.theme === t.id}
            className={`theme-option theme-${t.id}`}
            onClick={() => onChange({ theme: t.id, themeMode: "manual" })}
          >
            <img
              className="theme-thumb"
              src={`/themes/${t.id}-v1.png`}
              alt=""
            />
            <span>
              {t.name}
              <small>{t.detail}</small>
            </span>
            {state.themeMode === "manual" && state.theme === t.id && (
              <span>✓</span>
            )}
          </button>
        ))}
      </div>
      <label className="setting-row">
        时间显示
        <select
          value={state.timeMode}
          disabled={busy}
          onChange={(e) =>
            onChange({ timeMode: e.target.value as State["timeMode"] })
          }
        >
          <option value="both">现代时间 + 时辰</option>
          <option value="modern">现代时间</option>
          <option value="traditional">传统时辰</option>
        </select>
      </label>
      <label className="setting-row">
        减少动效
        <input
          type="checkbox"
          disabled={busy}
          checked={state.reducedMotion}
          onChange={(e) => onChange({ reducedMotion: e.target.checked })}
        />
      </label>
      {isTauri() && (
        <>
          <label className="setting-row">
            始终置顶
            <input
              type="checkbox"
              checked={state.pinned}
              disabled={busy}
              onChange={(e) => onChange({ pinned: e.target.checked })}
            />
          </label>
        </>
      )}
      <h2>天气城市</h2>
      <CityPicker
        city={state.city}
        busy={busy}
        onSelect={(city) => onChange({ city })}
      />
      {state.city && (
        <p className="weather-source">
          天气由 Open-Meteo 提供 · 约每半小时更新
          <button className="text-button" onClick={onRefresh}>
            检查更新
          </button>
        </p>
      )}
      <div className="button-row">
        <button onClick={onFavorites}>我的藏诗</button>
        <button onClick={onHistory}>诗签历史</button>
      </div>
      <p className="muted small">
        农历与节气采用北京时间，时钟采用系统时区。收藏与签文保存在本机。
      </p>
      <p className="muted small">
        离线诗词库 {poems.length.toLocaleString("zh-CN")} 首 · 近期去重
      </p>
      <p className="version">诗笺 · 风物版 0.4.0</p>
    </div>
  );
}
