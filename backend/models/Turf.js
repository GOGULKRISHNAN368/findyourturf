const mongoose = require("mongoose");

const turfSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    location: {
        type: String,
        required: true,
        trim: true
    },

    pricePerHour: {
        type: Number,
        required: true
    },

    sportType: {
        type: String,
        required: true,
        trim: true
    },

    available: {
        type: Boolean,
        default: true
    },

    // --- Operating window used to generate booking slots on the client ---
    // Stored as "HH:MM" 24h strings. Admin controls these per turf.
    openingTime: {
        type: String,
        default: "06:00",
        trim: true
    },

    closingTime: {
        type: String,
        default: "23:00",
        trim: true
    },

    // Length of a single bookable slot, in minutes.
    slotDurationMinutes: {
        type: Number,
        default: 60,
        min: 15
    }
});

module.exports = mongoose.model("Turf", turfSchema);
