// Lightweight, device-local user profile. No account / login yet — the
// profile (name, phone, email) lives in localStorage and is used to
// pre-fill and label bookings. Booking history made from this device is
// also cached here so the Profile screen can show "My Bookings".

const PROFILE_KEY = "fyt_profile";
const BOOKINGS_KEY = "fyt_bookings";
const NOTIF_SEEN_KEY = "fyt_notifications_seen_at";

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function getProfile() {
  try {
    return safeParse(localStorage.getItem(PROFILE_KEY), null);
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable — ignore */
  }
  return profile;
}

export function clearProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

export function getLocalBookings() {
  try {
    return safeParse(localStorage.getItem(BOOKINGS_KEY), []);
  } catch {
    return [];
  }
}

export function addLocalBooking(booking) {
  try {
    const all = getLocalBookings();
    all.unshift({ ...booking, savedAt: new Date().toISOString() });
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

// --- Notification "unread" tracking ---
export function getNotificationsSeenAt() {
  try {
    return localStorage.getItem(NOTIF_SEEN_KEY);
  } catch {
    return null;
  }
}

export function markNotificationsSeen() {
  try {
    localStorage.setItem(NOTIF_SEEN_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}
