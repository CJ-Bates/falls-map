"use client";

import { useEffect, useState } from "react";

// Live "Today at the Falls" panel — current conditions, sunrise/sunset,
// tonight's moon phase, and high/low. Pulls from Open-Meteo (free, no key,
// CORS-OK). Caches 30 min in sessionStorage so repeat loads don't hammer
// the API.

type Today = {
  tempF: number;
  highF: number;
  lowF: number;
  windMph: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
};

const CACHE_KEY = "falls-today-v2";
const CACHE_TTL_MS = 30 * 60 * 1000;

const PROPERTY_LAT = 38.4055;
const PROPERTY_LNG = -90.458;

// WMO weather-code grouping → human label + an emoji glyph.
function describeWeather(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: "Clear sky", emoji: "☀️" };
  if (code <= 3) return { label: "Partly cloudy", emoji: "⛅" };
  if (code <= 48) return { label: "Foggy", emoji: "🌫️" };
  if (code <= 57) return { label: "Drizzle", emoji: "🌦️" };
  if (code <= 67) return { label: "Rain", emoji: "🌧️" };
  if (code <= 77) return { label: "Snow", emoji: "🌨️" };
  if (code <= 82) return { label: "Showers", emoji: "🌦️" };
  if (code <= 86) return { label: "Snow showers", emoji: "🌨️" };
  if (code <= 99) return { label: "Thunderstorm", emoji: "⛈️" };
  return { label: "—", emoji: "🌤️" };
}

// Moon phase — pure math, no API needed. Reference new moon at Julian Day
// 2451550.1 (2000-01-06 18:14 UTC). Synodic month = 29.5305882 days.
function moonPhaseFor(date: Date): { label: string; emoji: string; illum: number } {
  const synodic = 29.5305882;
  const refMs = Date.UTC(2000, 0, 6, 18, 14, 0);
  const daysSince = (date.getTime() - refMs) / 86400000;
  const phase = ((daysSince % synodic) + synodic) % synodic / synodic; // 0..1
  // Illumination percentage (rough): 50% * (1 - cos(2π * phase))
  const illum = Math.round(50 * (1 - Math.cos(2 * Math.PI * phase)));
  if (phase < 0.0625 || phase >= 0.9375)
    return { label: "New moon", emoji: "🌑", illum };
  if (phase < 0.1875) return { label: "Waxing crescent", emoji: "🌒", illum };
  if (phase < 0.3125) return { label: "First quarter", emoji: "🌓", illum };
  if (phase < 0.4375) return { label: "Waxing gibbous", emoji: "🌔", illum };
  if (phase < 0.5625) return { label: "Full moon", emoji: "🌕", illum };
  if (phase < 0.6875) return { label: "Waning gibbous", emoji: "🌖", illum };
  if (phase < 0.8125) return { label: "Last quarter", emoji: "🌗", illum };
  return { label: "Waning crescent", emoji: "🌘", illum };
}

function formatLocalTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function TodayWidget() {
  const [today, setToday] = useState<Today | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Check cache first.
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { fetchedAt, data } = JSON.parse(raw) as { fetchedAt: number; data: Today };
        if (Date.now() - fetchedAt < CACHE_TTL_MS) {
          setToday(data);
          return;
        }
      }
    } catch {}

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${PROPERTY_LAT}&longitude=${PROPERTY_LNG}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (cancelled) return;
        const data: Today = {
          tempF: Math.round(j.current.temperature_2m),
          highF: Math.round(j.daily.temperature_2m_max[0]),
          lowF: Math.round(j.daily.temperature_2m_min[0]),
          windMph: Math.round(j.current.wind_speed_10m),
          weatherCode: j.current.weather_code,
          sunrise: j.daily.sunrise[0],
          sunset: j.daily.sunset[0],
        };
        setToday(data);
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ fetchedAt: Date.now(), data }),
          );
        } catch {}
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? "Couldn't load weather");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return null; // fail silently — home page still works

  if (!today) {
    return (
      <div className="ios-glass animate-pulse rounded-3xl p-5 h-[140px]" aria-hidden />
    );
  }

  const weather = describeWeather(today.weatherCode);
  const moon = moonPhaseFor(new Date());

  return (
    <div className="ios-glass relative overflow-hidden rounded-3xl px-5 py-4">
      <div className="flex items-stretch gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968] mb-1">
            Today at the Falls
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-[34px] font-bold text-[#F0E2C2] leading-none">
              {today.tempF}°
            </div>
            <div className="text-[14px] text-[#F0E2C2]/85 leading-tight">
              {weather.label}
              <div className="text-[12px] text-[#F0E2C2]/55 leading-tight mt-0.5">
                H {today.highF}° · L {today.lowF}°
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-[12px] text-[#F0E2C2]/75 flex-wrap">
            <span className="inline-flex items-center gap-1.5" title="Sunrise">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v6"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/>
                <path d="M22 22H2"/><path d="M8 22a4 4 0 1 1 8 0"/>
              </svg>
              {formatLocalTime(today.sunrise)}
            </span>
            <span className="text-[#F0E2C2]/30">·</span>
            <span className="inline-flex items-center gap-1.5" title="Sunset">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/>
                <path d="M22 22H2"/><path d="M16 6l-4 4-4-4"/>
              </svg>
              {formatLocalTime(today.sunset)}
            </span>
            <span className="text-[#F0E2C2]/30">·</span>
            <span className="inline-flex items-center gap-1.5" title="Wind">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
                <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
                <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
              </svg>
              {today.windMph} mph
            </span>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center flex-shrink-0 select-none"
          aria-hidden
        >
          <div className="text-[56px] leading-none">{weather.emoji}</div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#F0E2C2]/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[24px] leading-none" aria-hidden>{moon.emoji}</span>
          <div className="min-w-0">
            <div className="text-[12px] text-[#F0E2C2]/85 leading-tight truncate">
              {moon.label}
            </div>
            <div className="text-[10px] text-[#F0E2C2]/55 leading-tight">
              {moon.illum}% illuminated
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.14em] text-[#B89968]">Tonight</div>
          <div className="text-[12px] text-[#F0E2C2]/85">Best after {formatLocalTime(today.sunset)}</div>
        </div>
      </div>
    </div>
  );
}
