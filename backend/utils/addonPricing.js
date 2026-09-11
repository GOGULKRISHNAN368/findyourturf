const AddonService = require("../models/AddonService");
const AddonBooking = require("../models/AddonBooking");

function dayRange(date) {
    const day = new Date(date);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    return [day, next];
}

function isoDay(date) {
    return new Date(date).toISOString().slice(0, 10);
}

/**
 * How many units of an add-on are already committed for a given turf-slot.
 * `excludeBookingId` skips a booking that is being edited/re-priced.
 */
async function committedQty(serviceId, date, startTime, excludeBookingId) {
    const [day, next] = dayRange(date);
    const filter = {
        service: serviceId,
        bookingDate: { $gte: day, $lt: next },
        startTime,
        status: { $ne: "Cancelled" }
    };
    if (excludeBookingId) filter.booking = { $ne: excludeBookingId };

    const rows = await AddonBooking.find(filter).select("quantity");
    return rows.reduce((sum, r) => sum + (r.quantity || 1), 0);
}

/**
 * Availability for one add-on service on a date/slot.
 * photography / videography / coach -> a single booking per slot
 * equipment                         -> stock minus what is already rented
 */
async function checkAvailability(service, date, startTime, quantity = 1, excludeBookingId) {
    if (!service || service.active === false) {
        return { available: false, reason: "This add-on is not available." };
    }
    if ((service.unavailableDates || []).includes(isoDay(date))) {
        return { available: false, reason: `${service.name} is unavailable on this date.` };
    }

    const used = await committedQty(service._id, date, startTime, excludeBookingId);

    if (service.type === "equipment") {
        const remaining = Math.max(0, (service.stock || 0) - used);
        if (quantity > remaining) {
            return {
                available: false,
                remaining,
                reason:
                    remaining === 0
                        ? `${service.name} is out of stock for this slot.`
                        : `Only ${remaining} × ${service.name} left for this slot.`
            };
        }
        return { available: true, remaining: remaining - quantity };
    }

    // people-based services: one per slot
    if (used > 0) {
        return {
            available: false,
            reason: `${service.name} is already booked for this date & time.`
        };
    }
    return { available: true };
}

/**
 * Turn the client's [{ serviceId, quantity }] into validated, priced line
 * items. Throws { status, message } on any problem so the route can bail.
 */
async function resolveAddons(addons, { date, startTime, excludeBookingId } = {}) {
    const list = Array.isArray(addons) ? addons : [];
    const lines = [];
    let addonsAmount = 0;

    for (const raw of list) {
        const id = raw && (raw.serviceId || raw.service || raw._id || raw.id);
        if (!id) continue;

        const service = await AddonService.findById(id);
        if (!service || service.active === false) {
            throw { status: 400, message: "One of the selected add-ons is no longer available." };
        }

        const qty =
            service.type === "equipment"
                ? Math.max(1, Math.min(20, parseInt(raw.quantity, 10) || 1))
                : 1;

        if (date && startTime) {
            const av = await checkAvailability(service, date, startTime, qty, excludeBookingId);
            if (!av.available) {
                throw { status: 409, message: av.reason || `${service.name} is unavailable.` };
            }
        }

        const lineTotal = Math.round((service.price || 0) * qty);
        addonsAmount += lineTotal;

        lines.push({
            serviceId: String(service._id),
            type: service.type,
            name: service.name,
            unitPrice: Math.round(service.price || 0),
            quantity: qty,
            lineTotal,
            priceUnit: service.priceUnit || ""
        });
    }

    return { lines, addonsAmount };
}

module.exports = { resolveAddons, checkAvailability, committedQty, isoDay };
