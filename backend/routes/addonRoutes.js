const express = require("express");
const AddonService = require("../models/AddonService");
const AddonBooking = require("../models/AddonBooking");
const protect = require("../middleware/authMiddleware");
const { checkAvailability } = require("../utils/addonPricing");

const router = express.Router();

function emit(req, event, payload) {
    const io = req.app.get("io");
    if (io) io.emit(event, payload);
}

const TYPES = ["photography", "videography", "coach", "equipment"];

// Whitelisted fields shared by create + update.
function readFields(body) {
    const out = {};
    const str = (v) => (typeof v === "string" ? v.trim() : v);
    const num = (v) => {
        if (v === "" || v === null || v === undefined) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    if (body.type !== undefined) out.type = TYPES.includes(body.type) ? body.type : undefined;
    if (body.name !== undefined) out.name = str(body.name);
    if (body.image !== undefined) out.image = str(body.image) || "";
    if (body.description !== undefined) out.description = str(body.description) || "";
    if (body.rating !== undefined) out.rating = num(body.rating);
    if (body.price !== undefined) out.price = Math.max(0, num(body.price) ?? 0);
    if (body.priceUnit !== undefined) out.priceUnit = str(body.priceUnit) || "";
    if (body.durationLabel !== undefined) out.durationLabel = str(body.durationLabel) || "";
    if (body.packageDetails !== undefined) out.packageDetails = str(body.packageDetails) || "";
    if (body.sport !== undefined) out.sport = str(body.sport) || "";
    if (body.experienceYears !== undefined) out.experienceYears = num(body.experienceYears);
    if (body.specialization !== undefined) out.specialization = str(body.specialization) || "";
    if (body.category !== undefined) out.category = str(body.category) || "";
    if (body.stock !== undefined) out.stock = Math.max(0, num(body.stock) ?? 0);
    if (body.active !== undefined) out.active = Boolean(body.active);

    if (body.unavailableDates !== undefined) {
        const list = Array.isArray(body.unavailableDates)
            ? body.unavailableDates
            : String(body.unavailableDates || "").split(",");
        out.unavailableDates = list
            .map((d) => String(d).trim())
            .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
    }
    return out;
}


// ==========================================
// LIST ADD-ONS - PUBLIC (active only)
//   ?type=photography|videography|coach|equipment
//   ?sport=Football            (coach filter)
//   ?turfSports=Football,Cricket
// ==========================================
router.get("/", async (req, res) => {
    try {
        const q = { active: true };
        if (TYPES.includes(req.query.type)) q.type = req.query.type;

        let services = await AddonService.find(q).sort({ type: 1, price: 1 });

        const sport = (req.query.sport || "").toLowerCase().trim();
        const turfSports = String(req.query.turfSports || "")
            .toLowerCase()
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        if (sport || turfSports.length) {
            services = services.filter((s) => {
                if (s.type !== "coach" && s.type !== "equipment") return true;
                const tag = `${s.sport} ${s.category}`.toLowerCase();
                if (!tag.trim()) return true; // generic / uncategorised -> always show
                if (sport && tag.includes(sport)) return true;
                if (turfSports.some((ts) => tag.includes(ts) || ts.includes(s.sport.toLowerCase()))) return true;
                return sport || turfSports.length ? false : true;
            });
        }

        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// AVAILABILITY - PUBLIC
//   ?serviceId=&date=YYYY-MM-DD&startTime=7:00 PM&quantity=1
// ==========================================
router.get("/availability", async (req, res) => {
    try {
        const { serviceId, date, startTime, quantity } = req.query;
        if (!serviceId || !date || !startTime) {
            return res.status(400).json({ message: "serviceId, date and startTime are required" });
        }
        const service = await AddonService.findById(serviceId);
        if (!service) return res.status(404).json({ message: "Add-on not found" });

        const result = await checkAvailability(
            service,
            date,
            startTime,
            Math.max(1, parseInt(quantity, 10) || 1)
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// BATCH AVAILABILITY - PUBLIC
//   ?date=YYYY-MM-DD&startTime=7:00 PM   (checks every active service)
// ==========================================
router.get("/availability-batch", async (req, res) => {
    try {
        const { date, startTime } = req.query;
        if (!date || !startTime) {
            return res.status(400).json({ message: "date and startTime are required" });
        }
        const services = await AddonService.find({ active: true });
        const out = {};
        for (const s of services) {
            const r = await checkAvailability(s, date, startTime, 1);
            out[String(s._id)] = {
                available: r.available,
                remaining: r.remaining,
                reason: r.reason || ""
            };
        }
        res.json(out);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// ADMIN: list all (incl. inactive)
// ==========================================
router.get("/all", protect, async (req, res) => {
    try {
        const services = await AddonService.find().sort({ type: 1, createdAt: -1 });
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// ADMIN: list add-on bookings
// ==========================================
router.get("/bookings", protect, async (req, res) => {
    try {
        const bookings = await AddonBooking.find()
            .populate("turf", "name location")
            .populate("service", "name type")
            .sort({ createdAt: -1 })
            .limit(500);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// ==========================================
// ADMIN: create
// ==========================================
router.post("/", protect, async (req, res) => {
    try {
        const fields = readFields(req.body);
        if (!fields.type || !fields.name || fields.price == null) {
            return res.status(400).json({ message: "type, name and price are required." });
        }

        const dup = await AddonService.findOne({
            type: fields.type,
            name: new RegExp(`^${String(fields.name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
        });
        if (dup) {
            return res.status(409).json({ message: `A ${fields.type} add-on named "${dup.name}" already exists.` });
        }

        const service = await AddonService.create(fields);
        emit(req, "addon:created", { _id: service._id, type: service.type });
        res.status(201).json({ message: "Add-on created", service });
    } catch (error) {
        const status = error?.name === "ValidationError" ? 400 : 500;
        res.status(status).json({ message: error.message });
    }
});


// ==========================================
// ADMIN: update
// ==========================================
router.put("/:id", protect, async (req, res) => {
    try {
        const fields = readFields(req.body);
        const service = await AddonService.findByIdAndUpdate(req.params.id, fields, {
            new: true,
            runValidators: true
        });
        if (!service) return res.status(404).json({ message: "Add-on not found" });
        emit(req, "addon:updated", { _id: service._id, type: service.type });
        res.json({ message: "Add-on updated", service });
    } catch (error) {
        const status = error?.name === "ValidationError" || error?.name === "CastError" ? 400 : 500;
        res.status(status).json({ message: error.message });
    }
});


// ==========================================
// ADMIN: delete (refuses if it has live bookings unless ?force=1)
// ==========================================
router.delete("/:id", protect, async (req, res) => {
    try {
        const service = await AddonService.findById(req.params.id);
        if (!service) return res.status(404).json({ message: "Add-on not found" });

        const live = await AddonBooking.countDocuments({
            service: service._id,
            status: { $ne: "Cancelled" }
        });
        if (live > 0 && String(req.query.force || "") !== "1") {
            return res.status(409).json({
                message: `This add-on has ${live} booking(s). Deactivate it, or delete with force.`,
                bookings: live
            });
        }

        await AddonService.findByIdAndDelete(service._id);
        emit(req, "addon:deleted", { _id: service._id, type: service.type });
        res.json({ message: "Add-on deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
