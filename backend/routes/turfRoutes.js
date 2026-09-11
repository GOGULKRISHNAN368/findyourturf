const express = require("express");
const Turf = require("../models/Turf");
const Booking = require("../models/Booking");
const protect = require("../middleware/authMiddleware");
const { getWeather } = require("../utils/weather");

const router = express.Router();

function emit(req, event, payload) {
    const io = req.app.get("io");
    if (io) io.emit(event, payload);
}

// Whitelisted, normalised turf fields shared by create + update.
function readTurfFields(body) {
    const out = {};
    const str = (v) => (typeof v === "string" ? v.trim() : v);

    if (body.name !== undefined) out.name = str(body.name);
    if (body.location !== undefined) out.location = str(body.location);
    if (body.address !== undefined) out.address = str(body.address) || "";
    if (body.description !== undefined) out.description = str(body.description) || "";
    if (body.contactNumber !== undefined) out.contactNumber = str(body.contactNumber) || "";
    if (body.weatherLocation !== undefined) out.weatherLocation = str(body.weatherLocation) || "Coimbatore, Tamil Nadu, India";

    // Nullable numbers: "" / null / undefined -> not verified (null)
    const num = (v) => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };
    if (body.pricePerHour !== undefined) out.pricePerHour = num(body.pricePerHour);
    if (body.floodlightChargePerHour !== undefined) out.floodlightChargePerHour = num(body.floodlightChargePerHour);
    if (body.latitude !== undefined) out.latitude = num(body.latitude);
    if (body.longitude !== undefined) out.longitude = num(body.longitude);
    if (body.slotDurationMinutes !== undefined) {
        const n = Number(body.slotDurationMinutes);
        out.slotDurationMinutes = Number.isFinite(n) && n >= 15 ? n : 60;
    }

    if (body.openingTime !== undefined) out.openingTime = str(body.openingTime) || null;
    if (body.closingTime !== undefined) out.closingTime = str(body.closingTime) || null;

    if (body.roofType !== undefined) {
        out.roofType = ["Open", "Closed", "Partial"].includes(body.roofType)
            ? body.roofType
            : "Not verified";
    }

    if (body.sports !== undefined) {
        const list = Array.isArray(body.sports)
            ? body.sports
            : String(body.sports || "").split(",");
        out.sports = list.map((s) => String(s).trim()).filter(Boolean);
    }
    if (body.sportType !== undefined) out.sportType = str(body.sportType) || "";
    // Keep sportType roughly in sync with the primary sport.
    if (out.sports && out.sports.length && !out.sportType) out.sportType = out.sports[0];

    if (body.facilities !== undefined) {
        const list = Array.isArray(body.facilities)
            ? body.facilities
            : String(body.facilities || "").split(",");
        out.facilities = list.map((s) => String(s).trim()).filter(Boolean);
    }

    if (body.equipment !== undefined && Array.isArray(body.equipment)) {
        out.equipment = body.equipment
            .map((e) => ({
                name: String(e.name || "").trim(),
                rentalCharge: Math.max(0, Number(e.rentalCharge) || 0)
            }))
            .filter((e) => e.name);
    }

    if (body.images !== undefined && Array.isArray(body.images)) {
        out.images = body.images.map((s) => String(s).trim()).filter(Boolean);
    }

    // status <-> available stay in sync
    if (body.status !== undefined) {
        out.status = body.status === "Inactive" ? "Inactive" : "Active";
        out.available = out.status === "Active";
    } else if (body.available !== undefined) {
        out.available = Boolean(body.available);
        out.status = out.available ? "Active" : "Inactive";
    }

    return out;
}


// ==========================================
// WEATHER FORECAST FOR A TURF ON A DATE - PUBLIC
// ==========================================
router.get("/:id/weather", async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ message: "Turf not found" });
        }

        const weather = await getWeather({
            latitude: turf.latitude,
            longitude: turf.longitude,
            date: req.query.date
        });

        res.json({
            ...weather,
            weatherLocation: turf.weatherLocation || "Coimbatore, Tamil Nadu, India",
            coordsVerified: turf.latitude != null && turf.longitude != null
        });

    } catch (error) {
        res.status(200).json({
            available: false,
            message: "Weather forecast is unavailable right now."
        });
    }
});


// ==========================================
// CREATE TURF - ADMIN ONLY
// ==========================================
router.post("/", protect, async (req, res) => {
    try {
        const fields = readTurfFields(req.body);

        if (!fields.name || !fields.location) {
            return res.status(400).json({
                message: "Turf name and area/location are required."
            });
        }

        // Duplicate guard: same name (case-insensitive) already exists.
        const dup = await Turf.findOne({
            name: new RegExp(`^${fields.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
        });
        if (dup) {
            return res.status(409).json({
                message: `A turf named "${dup.name}" already exists.`
            });
        }

        const turf = await Turf.create(fields);

        emit(req, "turf:created", { _id: turf._id });
        res.status(201).json({ message: "Turf created successfully", turf });

    } catch (error) {
        const status = error?.name === "ValidationError" ? 400 : 500;
        res.status(status).json({ message: error.message });
    }
});


// ==========================================
// GET ALL TURFS - PUBLIC
//   ?activeOnly=1  -> only turfs the public can book
// ==========================================
router.get("/", async (req, res) => {
    try {
        const filter =
            String(req.query.activeOnly || "") === "1"
                ? { status: { $ne: "Inactive" }, available: { $ne: false } }
                : {};
        const turfs = await Turf.find(filter).sort({ createdAt: -1 });
        res.status(200).json(turfs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// GET TURF BY ID - PUBLIC
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ message: "Turf not found" });
        }
        res.status(200).json(turf);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// UPDATE TURF - ADMIN ONLY
// ==========================================
router.put("/:id", protect, async (req, res) => {
    try {
        const fields = readTurfFields(req.body);

        if (fields.name) {
            const dup = await Turf.findOne({
                _id: { $ne: req.params.id },
                name: new RegExp(`^${fields.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            });
            if (dup) {
                return res.status(409).json({
                    message: `Another turf named "${dup.name}" already exists.`
                });
            }
        }

        const updatedTurf = await Turf.findByIdAndUpdate(req.params.id, fields, {
            new: true,
            runValidators: true
        });

        if (!updatedTurf) {
            return res.status(404).json({ message: "Turf not found" });
        }

        emit(req, "turf:updated", { _id: updatedTurf._id });
        res.json({ message: "Turf updated successfully", turf: updatedTurf });

    } catch (error) {
        const status = error?.name === "ValidationError" || error?.name === "CastError" ? 400 : 500;
        res.status(status).json({ message: error.message });
    }
});


// ==========================================
// DELETE TURF - ADMIN ONLY
// Refuses if the turf still has non-cancelled bookings.
// ==========================================
router.delete("/:id", protect, async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);
        if (!turf) {
            return res.status(404).json({ message: "Turf not found" });
        }

        const activeBookings = await Booking.countDocuments({
            turf: turf._id,
            status: { $ne: "Cancelled" }
        });

        if (activeBookings > 0 && String(req.query.force || "") !== "1") {
            return res.status(409).json({
                message: `This turf has ${activeBookings} booking(s). Deactivate it instead, or delete with force.`,
                bookings: activeBookings
            });
        }

        await Turf.findByIdAndDelete(turf._id);

        emit(req, "turf:deleted", { _id: turf._id });
        res.json({ message: "Turf deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
