// Weather forecast helper — Open-Meteo (https://open-meteo.com), which is free
// and needs no API key. Results are cached in memory for 30 minutes.

const CACHE = new Map();
const TTL_MS = 30 * 60 * 1000;

// WMO weather interpretation codes -> friendly text + emoji.
const WMO = {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Fog", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy drizzle", "🌧️"],
    61: ["Light rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    66: ["Freezing rain", "🌧️"],
    67: ["Freezing rain", "🌧️"],
    71: ["Light snow", "🌨️"],
    73: ["Snow", "🌨️"],
    75: ["Heavy snow", "❄️"],
    80: ["Rain showers", "🌦️"],
    81: ["Rain showers", "🌧️"],
    82: ["Violent rain showers", "⛈️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Thunderstorm w/ hail", "⛈️"],
    99: ["Thunderstorm w/ hail", "⛈️"]
};

function describe(code) {
    return WMO[code] || ["—", "🌡️"];
}

function todayISO() {
    return new Date().toISOString().split("T")[0];
}

async function getWeather({ latitude, longitude, date }) {
    const lat = Number.isFinite(latitude) ? latitude : 11.0168;
    const lon = Number.isFinite(longitude) ? longitude : 76.9558;
    let day = (date || todayISO()).slice(0, 10);

    // Open-Meteo's daily forecast covers ~16 days out; clamp anything further.
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 15);
    if (new Date(day) > maxDate) day = maxDate.toISOString().split("T")[0];
    if (new Date(day) < new Date(todayISO())) day = todayISO();

    const key = `${lat.toFixed(3)},${lon.toFixed(3)},${day}`;
    const hit = CACHE.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
        return hit.value;
    }

    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
        `&timezone=Asia%2FKolkata&start_date=${day}&end_date=${day}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    let json;
    try {
        const resp = await fetch(url, { signal: controller.signal });
        json = await resp.json();
    } finally {
        clearTimeout(timer);
    }

    const d = json && json.daily;
    if (!d || !Array.isArray(d.time) || d.time.length === 0) {
        return { available: false, message: "Weather forecast is unavailable right now." };
    }

    const [text, icon] = describe(d.weather_code?.[0]);
    const value = {
        available: true,
        date: d.time[0],
        conditionCode: d.weather_code?.[0] ?? null,
        condition: text,
        icon,
        tempMaxC: d.temperature_2m_max?.[0] ?? null,
        tempMinC: d.temperature_2m_min?.[0] ?? null,
        precipitationChance: d.precipitation_probability_max?.[0] ?? null,
        windMaxKmh: d.wind_speed_10m_max?.[0] ?? null,
        playable: (d.precipitation_probability_max?.[0] ?? 0) < 60
    };

    CACHE.set(key, { at: Date.now(), value });
    return value;
}

module.exports = { getWeather };
