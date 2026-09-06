// Turn a turf's operating window (openingTime / closingTime / slotDurationMinutes,
// all admin-controlled) into a list of bookable slots for a given date.

function toMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return null;
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function to12h(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * @param {object} turf  Turf record from the API.
 * @param {object} [opts]
 * @param {string} [opts.date]         YYYY-MM-DD of the selected day.
 * @param {string[]} [opts.bookedSlots] startTimes already taken.
 * @returns {{ label: string, value: string, available: boolean, isPast: boolean }[]}
 */
export function generateSlots(turf, opts = {}) {
  const { date, bookedSlots = [] } = opts;

  const open = toMinutes(turf?.openingTime) ?? 6 * 60; // 06:00
  let close = toMinutes(turf?.closingTime) ?? 23 * 60; // 23:00
  const step =
    turf?.slotDurationMinutes && turf.slotDurationMinutes >= 15
      ? turf.slotDurationMinutes
      : 60;

  if (close <= open) close = open + step; // guard against bad config

  const now = new Date();
  const isToday = date === now.toISOString().split("T")[0];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const booked = new Set(bookedSlots);
  const slots = [];

  for (let t = open; t + step <= close + 1; t += step) {
    const label = to12h(t);
    const isPast = isToday && t <= nowMinutes;
    slots.push({
      label,
      value: label,
      startMinutes: t,
      endLabel: to12h(t + step),
      isPast,
      available: !booked.has(label) && !isPast,
    });
  }

  return slots;
}

export { to12h };
