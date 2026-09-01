const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        eventName: {
            type: String,
            required: true,
            trim: true
        },

        sport: {
            type: String,
            required: true,
            enum: ["Football", "Cricket"],
            trim: true
        },

        eventDate: {
            type: Date,
            required: true
        },

        teamSize: {
            type: String,
            required: true,
            trim: true
        },

        location: {
            type: String,
            required: true,
            trim: true
        },

        registrationDeadline: {
            type: Date,
            required: true
        },

        firstPrize: {
            type: Number,
            required: true,
            min: 0
        },

        secondPrize: {
            type: Number,
            required: true,
            min: 0
        },

        thirdPrize: {
            type: Number,
            required: true,
            min: 0
        },

        eventImage: {
            type: String,
            default: ""
        },

        registrationLink: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            enum: ["Active", "Upcoming", "Completed", "Cancelled"],
            default: "Upcoming"
        },

        registrationsCount: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Event", eventSchema);