export type WeatherResult = {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  rainNext24h: number;
  code: number;
  summary: string;
};

const CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
};

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherResult> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
    `&hourly=precipitation&forecast_days=2&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather service unavailable");
  const json = (await res.json()) as {
    current: Record<string, number>;
    hourly: { precipitation: number[] };
  };

  const rainNext24h = (json.hourly?.precipitation ?? [])
    .slice(0, 24)
    .reduce((a, b) => a + (Number(b) || 0), 0);
  const code = json.current?.["weather_code"] ?? 0;

  return {
    temperature: Math.round((json.current?.["temperature_2m"] ?? 0) * 10) / 10,
    humidity: Math.round(json.current?.["relative_humidity_2m"] ?? 0),
    precipitation: json.current?.["precipitation"] ?? 0,
    windSpeed: Math.round((json.current?.["wind_speed_10m"] ?? 0) * 10) / 10,
    rainNext24h: Math.round(rainNext24h * 10) / 10,
    code,
    summary: CODES[code] ?? "Unknown",
  };
}

export type ForecastDayRaw = {
  date: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
};

/** 7-day daily forecast from Open-Meteo (no API key required). */
export async function fetchForecastDays(
  latitude: number,
  longitude: number,
  days = 7,
): Promise<ForecastDayRaw[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_mean` +
    `&forecast_days=${days}&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Forecast service unavailable");
  const json = (await res.json()) as {
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
      wind_speed_10m_max?: number[];
      relative_humidity_2m_mean?: number[];
    };
  };

  const d = json.daily ?? {};
  const times = d.time ?? [];
  return times.map((date, i) => ({
    date,
    tempMax: Number(d.temperature_2m_max?.[i] ?? 0),
    tempMin: Number(d.temperature_2m_min?.[i] ?? 0),
    humidity: Number(d.relative_humidity_2m_mean?.[i] ?? 60),
    rainfall: Number(d.precipitation_sum?.[i] ?? 0),
    windSpeed: Number(d.wind_speed_10m_max?.[i] ?? 0),
  }));
}
