"use client";

import { useEffect, useState } from "react";

// Live "Today at the Falls" panel — current temp + weather code + today's
// sunrise/sunset, fetched from Open-Meteo (free, no API key, CORS-OK).
//
// Pulls once on mount and caches for 30 minutes in sessionStorage so a
// guest's repeated page loads don't hammer the API.

type Today = {
  tempF: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
};

const CACHE_KEY = "falls-today-v1";
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
      `&current=temperature_2m,weather_code` +
      `&daily=sunrise,sunset` +
      `&temperature_unit=fahrenheit&timezone=auto`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (cancelled) return;
        const data: Today = {
          tempF: Math.round(j.current.temperature_2m),
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
      <div className="ios-glass animate-pulse rounded-3xl p-5 h-[112px]" aria-hidden />
    );
  }

  const weather = describeWeather(today.weatherCode);

  return (
    <div className="ios-glass relative overflow-hidden rounded-3xl px-5 py-4 flex items-stretch gap-4">
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
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 text-[12px] text-[#F0E2C2]/75">
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v6"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/>
              <path d="M22 22H2"/><path d="M8 22a4 4 0 1 1 8 0"/>
            </svg>
            {formatLocalTime(today.sunrise)}
          </span>
          <span className="text-[#F0E2C2]/30">·</span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cdac7d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/>
              <path d="M22 22H2"/><path d="M16 6l-4 4-4-4"/>
            </svg>
            {formatLocalTime(today.sunset)}
          </span>
        </div>
      </div>
      <div
        className="flex items-center justify-center text-[64px] leading-none flex-shrink-0 select-none"
        aria-hidden
      >
        {weather.emoji}
      </div>
    </div>
  );
}
