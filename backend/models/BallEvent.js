const mongoose = require("mongoose");

const ballEventSchema = new mongoose.Schema(
  {
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: "LiveMatch", required: true },
    innings: { type: Number, required: true }, // 1 or 2
    sequenceNumber: { type: Number, required: true }, // Unique ordered index per match
    overNumber: { type: Number, required: true }, // e.g. 8 (for the 9th over)
    ballNumber: { type: Number, required: true }, // e.g. 1 to 6
    
    strikerId: { type: String, required: true },
    nonStrikerId: { type: String, required: true },
    bowlerId: { type: String, required: true },
    
    runsOffBat: { type: Number, default: 0 },
    isBoundary: { type: Boolean, default: false }, // true if 4 or 6 was hit off bat
    
    extras: {
      type: { type: String, enum: ["WD", "NB", "B", "LB", null], default: null },
      runs: { type: Number, default: 0 }
    },
    
    isLegalDelivery: { type: Boolean, default: true },
    
    isWicket: { type: Boolean, default: false },
    wicket: {
      type: { type: String, enum: ["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired", "Other", null], default: null },
      dismissedPlayerId: { type: String, default: null },
      fielderId: { type: String, default: null } // Optional
    },
    
    createdBy: { type: String, default: "Admin" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BallEvent", ballEventSchema);
