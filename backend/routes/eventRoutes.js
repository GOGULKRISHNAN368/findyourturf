const express = require("express");
const Event = require("../models/Event");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// CREATE EVENT
// POST /api/events
// ==========================================
router.post("/", protect, async (req, res) => {
    try {
        const event = await Event.create(req.body);

        // Notify all connected websites immediately
        const io = req.app.get("io");

        if (io) {
            io.emit("new-event", event);
        }

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            event
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to create event",
            error: error.message
        });
    }
});


// ==========================================
// GET ALL EVENTS
// GET /api/events
// ==========================================
router.get("/", async (req, res) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: events.length,
            events
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch events",
            error: error.message
        });
    }
});


// ==========================================
// GET SINGLE EVENT
// GET /api/events/:id
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.status(200).json({
            success: true,
            event
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch event",
            error: error.message
        });
    }
});


// ==========================================
// UPDATE EVENT
// PUT /api/events/:id
// ==========================================
router.put("/:id", protect, async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Notify connected websites about update
        const io = req.app.get("io");

        if (io) {
            io.emit("event-updated", event);
        }

        res.status(200).json({
            success: true,
            message: "Event updated successfully",
            event
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Failed to update event",
            error: error.message
        });
    }
});


// ==========================================
// DELETE EVENT
// DELETE /api/events/:id
// ==========================================
router.delete("/:id", protect, async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        // Notify connected websites about deletion
        const io = req.app.get("io");

        if (io) {
            io.emit("event-deleted", {
                id: req.params.id
            });
        }

        res.status(200).json({
            success: true,
            message: "Event deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete event",
            error: error.message
        });
    }
});


module.exports = router;