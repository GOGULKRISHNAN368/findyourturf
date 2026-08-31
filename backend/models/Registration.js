const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        teamName: {
            type: String,
            required: true,
            trim: true
        },

        captainName: {
            type: String,
            required: true,
            trim: true
        },

        captainEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        captainPhone: {
            type: String,
            required: true,
            trim: true
        },

        teamSize: {
            type: Number,
            required: true,
            min: 1
        },

        players: [
            {
                name: {
                    type: String,
                    trim: true
                },

                phone: {
                    type: String,
                    trim: true
                }
            }
        ],

        status: {
            type: String,
            enum: ["Pending", "Confirmed", "Cancelled"],
            default: "Pending"
        },

        source: {
            type: String,
            enum: ["Google Form", "Admin", "Website"],
            default: "Google Form"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Registration", registrationSchema);