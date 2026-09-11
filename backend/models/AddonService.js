const mongoose = require("mongoose");

// One document per bookable add-on: a photographer package, a videographer
// package, a coach, or a piece of rentable equipment. A single model keeps the
// admin CRUD and the booking pricing paths DRY.
const addonServiceSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["photography", "videography", "coach", "equipment"],
            required: true,
            index: true
        },

        name: { type: String, required: true, trim: true },
        image: { type: String, default: "", trim: true },
        description: { type: String, default: "", trim: true },

        rating: { type: Number, default: null, min: 0, max: 5 },

        // Price is ALWAYS the source of truth for pricing (never the client).
        //   photography / videography -> per package / per match
        //   coach                     -> per session
        //   equipment                 -> per unit, per session
        price: { type: Number, required: true, min: 0 },
        priceUnit: { type: String, default: "", trim: true }, // e.g. "2 hours", "match", "session"

        // photography / videography
        durationLabel: { type: String, default: "", trim: true },
        packageDetails: { type: String, default: "", trim: true },

        // coach
        sport: { type: String, default: "", trim: true },
        experienceYears: { type: Number, default: null, min: 0 },
        specialization: { type: String, default: "", trim: true },

        // equipment
        category: { type: String, default: "", trim: true }, // "Cricket" / "Football" / ...
        stock: { type: Number, default: 0, min: 0 },          // units available per slot

        // Admin blackout dates (YYYY-MM-DD). Real slot clashes are still checked
        // against AddonBooking; this is an explicit "not available" override.
        unavailableDates: { type: [String], default: [] },

        active: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("AddonService", addonServiceSchema);
