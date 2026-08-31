const express = require("express");
const Turf = require("../models/Turf");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// CREATE TURF - ADMIN ONLY
// ==========================================
router.post("/", protect, async (req, res) => {
    try {
        const {
            name,
            location,
            pricePerHour,
            sportType,
            available
        } = req.body;

        if (
            !name ||
            !location ||
            pricePerHour === undefined ||
            !sportType ||
            available === undefined
        ) {
            return res.status(400).json({
                message: "All turf fields are required"
            });
        }

        const turf = new Turf({
            name,
            location,
            pricePerHour,
            sportType,
            available
        });

        const savedTurf = await turf.save();

        res.status(201).json({
            message: "Turf created successfully",
            turf: savedTurf
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// GET ALL TURFS - PUBLIC
// ==========================================
router.get("/", async (req, res) => {
    try {
        const turfs = await Turf.find();

        res.status(200).json(turfs);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// GET TURF BY ID - PUBLIC
// ==========================================
router.get("/:id", async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);

        if (!turf) {
            return res.status(404).json({
                message: "Turf not found"
            });
        }

        res.status(200).json(turf);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// UPDATE TURF - ADMIN ONLY
// ==========================================
router.put("/:id", protect, async (req, res) => {
    try {
        const {
            name,
            location,
            pricePerHour,
            sportType,
            available
        } = req.body;

        const updatedTurf = await Turf.findByIdAndUpdate(
            req.params.id,
            {
                name,
                location,
                pricePerHour,
                sportType,
                available
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedTurf) {
            return res.status(404).json({
                message: "Turf not found"
            });
        }

        res.json({
            message: "Turf updated successfully",
            turf: updatedTurf
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


// ==========================================
// DELETE TURF - ADMIN ONLY
// ==========================================
router.delete("/:id", protect, async (req, res) => {
    try {
        const deletedTurf = await Turf.findByIdAndDelete(req.params.id);

        if (!deletedTurf) {
            return res.status(404).json({
                message: "Turf not found"
            });
        }

        res.json({
            message: "Turf deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});


module.exports = router;