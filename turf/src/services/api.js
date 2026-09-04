import { API_URL } from "./config";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        data.message || data.error || `Request failed (${response.status})`
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    const netError = new Error(
      "Unable to reach server. Please ensure backend is running."
    );
    netError.status = 0;
    netError.isNetworkError = true;
    throw netError;
  }
}

export async function getEvents() {
  const data = await request("/api/events");
  return data.events || [];
}

export async function getEvent(eventId) {
  const data = await request(`/api/events/${eventId}`);
  return data.event;
}

export async function getTournament(eventId) {
  try {
    const data = await request(`/api/tournaments/${eventId}`);
    return (
      data.tournament || {
        teams: [],
        matches: [],
        winner1: null,
        winner2: null,
        champion: null,
      }
    );
  } catch (err) {
    if (err.status === 404) {
      return {
        teams: [],
        matches: [],
        winner1: null,
        winner2: null,
        champion: null,
      };
    }
    throw err;
  }
}
