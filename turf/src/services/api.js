import { API_URL } from "./config";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`
    );
  }

  return data;
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
  const data = await request(`/api/tournaments/${eventId}`);
  return (
    data.tournament || {
      teams: [],
      matches: [],
      winner1: null,
      winner2: null,
    }
  );
}
