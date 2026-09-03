const express = require("express");
const mongoose = require("mongoose");
const Event = require("../models/Event");
const Tournament = require("../models/Tournament");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

function isValidObjectId(id) {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    new mongoose.Types.ObjectId(id).toString() === String(id)
  );
}

router.post("/", protect, async (req, res) => {
  try {
    const event = await Event.create(req.body);

    const io = req.app.get("io");

    if (io) {
      io.emit("new-event", event);
    }

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create event",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch events",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch event",
    });
  }
});

router.put("/:id", protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const io = req.app.get("io");

    if (io) {
      io.emit("event-updated", event);
    }

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update event",
    });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      });
    }

    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    await Tournament.findOneAndDelete({ event: req.params.id });

    const io = req.app.get("io");

    if (io) {
      io.emit("event-deleted", {
        id: req.params.id,
      });
    }

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete event",
    });
  }
});

module.exports = router;
