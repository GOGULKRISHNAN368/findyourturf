const mongoose = require("mongoose");

const equipmentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        // Rental charge for the whole booking. 0 = provided free.
        rentalCharge: { type: Number, default: 0, min: 0 }
    },
    { _id: false }
);

const turfSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        // Short locality label used across cards / filters (e.g. "Peelamedu").
        location: {
            type: String,
            required: true,
            trim: true
        },

        // Full street address for the details page. "" when not verified.
        address: {
            type: String,
            default: "",
            trim: true
        },

        // Base hourly price. null = not verified (booking is disabled, the
        // player is asked to contact the venue).
        pricePerHour: {
            type: Number,
            default: null
        },

        // Primary sport (kept for older filters). Prefer `sports`.
        sportType: {
            type: String,
            default: "",
            trim: true
        },

        // All sports the turf supports. [] when not verified.
        sports: {
            type: [String],
            default: []
        },

        // Legacy "is this turf bookable" flag — kept in sync with `status`
        // so existing booking / listing code keeps working.
        available: {
            type: Boolean,
            default: true
        },

        // Admin activate / deactivate switch.
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active"
        },

        // --- Operating window used to generate booking slots on the client ---
        // "HH:MM" 24h strings, or null when not verified (the client then
        // falls back to a 06:00-23:00 window for slot generation only).
        openingTime: {
            type: String,
            default: null,
            trim: true
        },

        closingTime: {
            type: String,
            default: null,
            trim: true
        },

        // Length of a single bookable slot, in minutes.
        slotDurationMinutes: {
            type: Number,
            default: 60,
            min: 15
        },

        // --- Turf facilities / booking add-ons -------------------------------
        // "Open", "Closed", "Partial" or "Not verified".
        roofType: {
            type: String,
            enum: ["Open", "Closed", "Partial", "Not verified"],
            default: "Not verified"
        },

        // Extra charge per hour when floodlights are used. null = not verified.
        floodlightChargePerHour: {
            type: Number,
            default: null,
            min: 0
        },

        // Rentable playing equipment shown on the details / checkout screens.
        // [] when not verified.
        equipment: {
            type: [equipmentSchema],
            default: []
        },

        // Free-text facility tags. [] when not verified.
        facilities: {
            type: [String],
            default: []
        },

        contactNumber: {
            type: String,
            default: "",
            trim: true
        },

        // Gallery image URLs (first is the cover).
        images: {
            type: [String],
            default: []
        },

        description: {
            type: String,
            default: "",
            trim: true
        },

        // Exact coordinates for the weather forecast. null = not verified —
        // the weather service then falls back to central Coimbatore.
        latitude: {
            type: Number,
            default: null
        },

        longitude: {
            type: Number,
            default: null
        },

        // Human-readable location used for the weather forecast label.
        weatherLocation: {
            type: String,
            default: "Coimbatore, Tamil Nadu, India",
            trim: true
        },

        // Not collected yet — null until real reviews exist.
        rating: {
            type: Number,
            default: null,
            min: 0,
            max: 5
        },

        reviewsCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Turf", turfSchema);
