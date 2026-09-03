import { API_URL } from "./config";

function authHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
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

export async function createEvent(payload) {
  return request("/api/events", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function updateEvent(eventId, payload) {
  return request(`/api/events/${eventId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function deleteEvent(eventId) {
  return request(`/api/events/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
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

export async function assignTeams(eventId, teams) {
  return request(`/api/tournaments/${eventId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ teams }),
  });
}

export async function createMatch(eventId, match) {
  return request(`/api/tournaments/${eventId}/match`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(match),
  });
}

export async function updateMatch(eventId, matchId, match) {
  return request(`/api/tournaments/${eventId}/match/${matchId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(match),
  });
}

export async function deleteMatch(eventId, matchId) {
  return request(`/api/tournaments/${eventId}/match/${matchId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function editTeam(eventId, oldName, newName) {
  return request(`/api/tournaments/${eventId}/team`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({
      oldName,
      newName,
    }),
  });
}

export async function deleteTeam(eventId, teamName) {
  return request(
    `/api/tournaments/${eventId}/team/${encodeURIComponent(teamName)}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );
}

export async function updateLiveScore(eventId, matchId, score) {
  return request(`/api/tournaments/${eventId}/match/${matchId}/score`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(score),
  });
}

export async function setMatchWinner(eventId, matchId, winner) {
  return request(`/api/tournaments/${eventId}/match/${matchId}/winner`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ winner }),
  });
}
