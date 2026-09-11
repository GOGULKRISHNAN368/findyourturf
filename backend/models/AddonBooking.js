const mongoose = require("mongoose");

// A single add-on attached to a turf booking. Used for double-booking /
// stock checks and for the admin add-on bookings view.
const addonBookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        turf: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Turf",
            required: true
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true
        },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AddonService",
            required: true
        },

        type: {
            type: String,
            enum: ["photography", "videography", "coach", "equipment"],
            required: true
        },
        serviceName: { type: String, default: "", trim: true },

        bookingDate: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, default: "" },

        unitPrice: { type: Number, required: true, min: 0 },
        quantity: { type: Number, default: 1, min: 1 },
        lineTotal: { type: Number, required: true, min: 0 },

        contactName: { type: String, default: "", trim: true },
        contactPhone: { type: String, default: "", trim: true },
        contactEmail: { type: String, default: "", trim: true },

        status: {
            type: String,
            enum: ["Confirmed", "Cancelled"],
            default: "Confirmed"
        }
    },
    { timestamps: true }
);

addonBookingSchema.index({ service: 1, bookingDate: 1, startTime: 1, status: 1 });
addonBookingSchema.index({ booking: 1 });

module.exports = mongoose.model("AddonBooking", addonBookingSchema);
