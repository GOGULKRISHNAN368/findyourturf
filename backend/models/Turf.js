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
        required: true
    }
});

module.exports = mongoose.model("Turf", turfSchema);