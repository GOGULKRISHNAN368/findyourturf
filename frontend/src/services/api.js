const API_URL = "http://localhost:5000";

export async function getEvents() {
  const response = await fetch(`${API_URL}/api/events`);

  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }

  return response.json();
}