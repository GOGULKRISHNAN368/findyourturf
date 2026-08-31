const express = require("express");
const Event = require("../models/Event");
const User = require("../models/User");
const Turf = require("../models/Turf");
const Booking = require("../models/Booking");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// ADMIN DASHBOARD STATISTICS
// GET /api/dashboard/stats
// ==========================================
router.get("/stats", protect, async (req, res) => {
    try {

        // ==========================================
        // EVENT STATISTICS
        // ==========================================

        const totalEvents = await Event.countDocuments();

        const upcomingEvents = await Event.countDocuments({
            status: "Upcoming"
        });

        const activeEvents = await Event.countDocuments({
            status: "Active"
        });

        const completedEvents = await Event.countDocuments({
            status: "Completed"
        });

        const cancelledEvents = await Event.countDocuments({
            status: "Cancelled"
        });

        const registrationData = await Event.aggregate([
            {
                $group: {
                    _id: null,
                    totalRegistrations: {
                        $sum: "$registrationsCount"
                    }
                }
            }
        ]);

        const totalRegistrations =
            registrationData.length > 0
                ? registrationData[0].totalRegistrations
                : 0;


        // ==========================================
        // USER STATISTICS
        // ==========================================

        const totalUsers = await User.countDocuments();


        // ==========================================
        // TURF STATISTICS
        // ==========================================

        const totalTurfs = await Turf.countDocuments();

        const availableTurfs = await Turf.countDocuments({
            available: true
        });

        const unavailableTurfs = await Turf.countDocuments({
            available: false
        });


        // ==========================================
        // BOOKING STATISTICS
        // ==========================================

        const totalBookings = await Booking.countDocuments();

        const pendingBookings = await Booking.countDocuments({
            status: "Pending"
        });

        const confirmedBookings = await Booking.countDocuments({
            status: "Confirmed"
        });

        const cancelledBookings = await Booking.countDocuments({
            status: "Cancelled"
        });


        // ==========================================
        // TOTAL REVENUE
        // Only confirmed bookings
        // ==========================================

        const revenueData = await Booking.aggregate([
            {
                $match: {
                    status: "Confirmed"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$totalAmount"
                    }
                }
            }
        ]);

        const totalRevenue =
            revenueData.length > 0
                ? revenueData[0].totalRevenue
                : 0;


        // ==========================================
        // RESPONSE
        // ==========================================

        res.status(200).json({
            success: true,

            stats: {

                // Event statistics
                totalEvents,
                upcomingEvents,
                activeEvents,
                completedEvents,
                cancelledEvents,
                totalRegistrations,

                // User statistics
                totalUsers,

                // Turf statistics
                totalTurfs,
                availableTurfs,
                unavailableTurfs,

                // Booking statistics
                totalBookings,
                pendingBookings,
                confirmedBookings,
                cancelledBookings,

                // Revenue
                totalRevenue
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard statistics",
            error: error.message
        });
    }
});

module.exports = router;