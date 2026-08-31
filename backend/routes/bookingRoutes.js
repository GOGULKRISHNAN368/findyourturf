const express = require("express");
const Booking = require("../models/Booking");
const protect = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// CHECK TURF AVAILABILITY - PUBLIC
// ==========================================
router.get("/availability", async (req, res) => {
    try {
        const {
            turf,
            bookingDate,
            startTime,
            endTime
        } = req.query;

        if (!turf || !bookingDate || !startTime || !endTime) {
            return res.status(400).json({
                message: "turf, bookingDate, startTime and endTime are required"
            });
        }

        const existingBooking = await Booking.findOne({
            turf,
            bookingDate: new Date(bookingDate),
            status: { $ne: "Cancelled" },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        });

        if (existingBooking) {
            return res.json({
                available: false,
                message: "Turf is already booked for this time."
            });
        }

        res.json({
            available: true,
            message: "Turf is available."
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// CREATE BOOKING - PUBLIC
// ==========================================
router.post("/", async (req, res) => {
    try {
        const {
            user,
            turf,
            bookingDate,
            startTime,
            endTime,
            totalAmount,
            status
        } = req.body;

        if (
            !user ||
            !turf ||
            !bookingDate ||
            !startTime ||
            !endTime ||
            totalAmount === undefined ||
            !status
        ) {
            return res.status(400).json({
                message: "All booking fields are required"
            });
        }

        const existingBooking = await Booking.findOne({
            turf,
            bookingDate: new Date(bookingDate),
            status: { $ne: "Cancelled" },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        });

        if (existingBooking) {
            return res.status(400).json({
                message: "This turf is already booked for this time."
            });
        }

        const booking = new Booking({
            user,
            turf,
            bookingDate,
            startTime,
            endTime,
            totalAmount,
            status
        });

        const savedBooking = await booking.save();

        res.status(201).json({
            message: "Booking created successfully",
            booking: savedBooking
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// GET ALL BOOKINGS - ADMIN ONLY
// ==========================================
router.get("/", protect, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("user")
            .populate("turf");

        res.status(200).json(bookings);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// GET SINGLE BOOKING - ADMIN ONLY
// ==========================================
router.get("/:id", protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("user")
            .populate("turf");

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.status(200).json(booking);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// CANCEL BOOKING - ADMIN ONLY
// ==========================================
router.put("/:id/cancel", protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        booking.status = "Cancelled";

        const updatedBooking = await booking.save();

        res.json({
            message: "Booking cancelled successfully",
            booking: updatedBooking
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


module.exports = router;