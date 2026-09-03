const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    round: {
      type: String,
      enum: ["Round 1", "Round 2", "Semi Final", "Final"],
      required: true,
    },

    matchNumber: {
      type: Number,
      required: true,
    },

    team1: {
      type: String,
      default: "",
    },

    team2: {
      type: String,
      default: "",
    },

    team1Score: {
      type: Number,
      default: 0,
    },

    team2Score: {
      type: Number,
      default: 0,
    },

    team1Wickets: {
      type: Number,
      default: 0,
    },

    team2Wickets: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Upcoming", "Live", "Completed"],
      default: "Upcoming",
    },

    winner: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const tournamentSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true,
    },

    teams: [
      {
        type: String,
        trim: true,
      },
    ],

    matches: [matchSchema],

    winner1: {
      type: String,
      default: "",
    },

    winner2: {
      type: String,
      default: "",
    },

    champion: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Tournament",
  tournamentSchema
);