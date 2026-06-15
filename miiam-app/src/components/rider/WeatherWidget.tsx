"use client";

import { useState, useEffect } from "react";

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
}

const CONDITION_ICONS: Record<string, string> = {
  "clear": "☀️",
  "partly cloudy": "⛅",
  "cloudy": "☁️",
  "overcast": "☁️",
  "rain": "🌧️",
  "light rain": "🌦️",
  "heavy rain": "🌧️",
  "snow": "❄️",
  "fog": "🌫️",
  "thunderstorm": "⛈️",
  "drizzle": "🌦️",
};

const WEATHER_CODES: Record<number, string> = {
  0: "clear",
  1: "partly cloudy",
  2: "partly cloudy",
  3: "overcast",
  45: "fog",
  48: "fog",
  51: "drizzle",
  53: "drizzle",
  55: "drizzle",
  61: "rain",
  63: "rain",
  65: "heavy rain",
  80: "rain",
  81: "rain",
  82: "heavy rain",
  95: "thunderstorm",
  96: "thunderstorm",
  99: "thunderstorm",
};

export default function WeatherWidget({ className = "" }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=auto`
          );
          const data = await res.json();
          if (data.current_weather) {
            const condition = WEATHER_CODES[data.current_weather.weathercode as number] || "clear";
            setWeather({
              temperature: Math.round(data.current_weather.temperature),
              condition,
              icon: CONDITION_ICONS[condition] || "🌤️",
            });
          }
        } catch {
          setWeather(null);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
        setWeather(null);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  }, []);

  if (loading || !weather) return null;

  return (
    <div className={`bg-[var(--color-surface-container-lowest)]/90 backdrop-blur-xl rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 ${className}`}>
      <span className="text-xl">{weather.icon}</span>
      <div className="leading-tight">
        <p className="text-sm font-bold text-[var(--color-on-surface)]">{weather.temperature}°C</p>
        <p className="text-[9px] text-[var(--color-outline)] capitalize">{weather.condition}</p>
      </div>
    </div>
  );
}
