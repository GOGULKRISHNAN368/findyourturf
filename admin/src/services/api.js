import { API_URL } from "./config";

function getAuthToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}

async function request(path, options = {}) {
  try {
    const isBodyPresent = Boolean(options.body);
    const headers = {
      ...(isBodyPresent ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        // Token missing/expired/invalid -> drop it and bounce to login.
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        window.dispatchEvent(new Event("admin-auth-changed"));
        const error = new Error(
          data.message || "Session expired. Please sign in again."
        );
        error.status = 401;
        error.data = data;
        throw error;
      }

      if (response.status === 404) {
        const error = new Error(data.message || "Resource not found (404)");
        error.status = 404;
        error.data = data;
        throw error;
      }

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
    // Network / unreachable backend error
    const netError = new Error(
      "Backend server is not running. Please start the backend on port 5000."
    );
    netError.status = 0;
    netError.isNetworkError = true;
    throw netError;
  }
}

// ==========================================
// EVENTS API
// ==========================================

export async function getEvents() {
  const data = await request("/api/events");
  return data.events || [];
}

export async function getEventById(eventId) {
  const data = await request(`/api/events/${eventId}`);
  return data.event || null;
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

// ==========================================
// TOURNAMENTS & MATCHES API
// ==========================================

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
      // 404 is a normal state when tournament has not been created yet
      return {
        teams: [],
        matches: [],
        winner1: null,
        winner2: null,
        champion: null,
        notCreatedYet: true,
      };
    }
    throw err;
  }
}

export async function assignTeams(eventId, teams) {
  return request(`/api/tournaments/${eventId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ teams }),
  });
}

export async function generateFirstRound(eventId, teams) {
  return request(`/api/tournaments/${eventId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      teams,
      generateRound1: true,
    }),
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

// ==========================================
// DASHBOARD STATS API
// ==========================================

export async function getDashboardStats() {
  const data = await request("/api/dashboard/stats", {
    headers: authHeaders(),
  });
  return data.stats || null;
}

// ==========================================
// BOOKINGS API
// ==========================================

export async function getBookings() {
  const data = await request("/api/bookings", {
    headers: authHeaders(),
  });
  return Array.isArray(data) ? data : [];
}

export async function cancelBooking(bookingId) {
  return request(`/api/bookings/${bookingId}/cancel`, {
    method: "PUT",
    headers: authHeaders(),
  });
}

// ==========================================
// USERS API
// ==========================================

export async function getUsers() {
  const data = await request("/api/users");
  return Array.isArray(data) ? data : [];
}

// ==========================================
// TURFS API
// ==========================================

export async function getTurfs() {
  const data = await request("/api/turfs");
  return Array.isArray(data) ? data : [];
}
