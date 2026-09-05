const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  playerId: { type: String, default: function() { return new mongoose.Types.ObjectId().toString(); } }, // Unique reference for this match
  name: { type: String, required: true },
  role: { type: String, enum: ["Batsman", "Bowler", "All Rounder", "Wicket Keeper"], default: "Batsman" },
  jerseyNumber: { type: String, default: "" },
  isCaptain: { type: Boolean, default: false },
});

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  logo: { type: String, default: "" },
  players: [playerSchema],
});

const inningsScoreSchema = new mongoose.Schema({
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  legalBalls: { type: Number, default: 0 }, // For overs calculation
  extras: { type: Number, default: 0 },
});

const liveMatchSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: false },
    matchName: { type: String, required: true },
    sport: { type: String, default: "Cricket" },
    format: { type: String, required: true }, // e.g., "T20", "Custom"
    overs: { type: Number, required: true },
    venue: { type: String, default: "" },
    scheduledAt: { type: Date, required: true },
    
    teamA: { type: teamSchema, required: true },
    teamB: { type: teamSchema, required: true },
    
    toss: {
      wonBy: { type: String, enum: ["Team A", "Team B"], default: null },
      decision: { type: String, enum: ["BAT", "BOWL"], default: null },
    },
    
    state: {
      status: { type: String, enum: ["UPCOMING", "LIVE", "INNINGS_BREAK", "COMPLETED", "CANCELLED"], default: "UPCOMING" },
      currentInnings: { type: Number, default: 1 },
      battingTeamId: { type: String, enum: ["Team A", "Team B"], default: null },
      bowlingTeamId: { type: String, enum: ["Team A", "Team B"], default: null },
      strikerId: { type: String, default: null },
      nonStrikerId: { type: String, default: null },
      bowlerId: { type: String, default: null },
    },
    
    score: {
      firstInnings: { type: inningsScoreSchema, default: () => ({}) },
      secondInnings: { type: inningsScoreSchema, default: () => ({}) },
    },
    
    target: { type: Number, default: null },
    winner: { type: String, default: null }, // Team Name or "Tie"
    resultText: { type: String, default: null }, // e.g., "Team A won by 6 runs"
  },
  { timestamps: true }
);

module.exports = mongoose.model("LiveMatch", liveMatchSchema);
