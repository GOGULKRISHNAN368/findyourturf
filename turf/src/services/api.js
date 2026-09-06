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

export async function getTurfs() {
  const data = await request("/api/turfs");
  return data;
}

export async function getTurf(turfId) {
  const data = await request(`/api/turfs/${turfId}`);
  return data;
}

export async function checkAvailability(turfId, date, startTime, endTime) {
  const data = await request(`/api/bookings/availability?turf=${turfId}&bookingDate=${date}&startTime=${startTime}&endTime=${endTime}`);
  return data;
}

export async function getBookedSlots(turfId, date) {
  try {
    const data = await request(
      `/api/bookings/booked-slots?turf=${turfId}&date=${date}`
    );
    return data.bookedSlots || [];
  } catch {
    return [];
  }
}

export async function createBooking(bookingData) {
  const data = await request("/api/bookings", {
    method: "POST",
    body: JSON.stringify(bookingData)
  });
  return data;
}

// --- Live matches ---
export async function getLiveMatches() {
  const data = await request("/api/live-matches/live");
  return data.matches || [];
}

export async function getUpcomingMatches() {
  const data = await request("/api/live-matches/upcoming");
  return data.matches || [];
}

export async function getMatchResults() {
  const data = await request("/api/live-matches/results");
  return data.matches || [];
}
