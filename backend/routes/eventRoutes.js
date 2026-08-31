const express = require("express");
const Event = require("../models/Event");

const router = express.Router();

// ==========================================
// CREATE EVENT
// POST /api/events
// ==========================================
router.post("/", async (req, res) => {
    try {
        const event = await Event.create(req.body);

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
router.put("/:id", async (req, res) => {
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
router.delete("/:id", async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
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