const LiveMatch = require("../models/LiveMatch");
const BallEvent = require("../models/BallEvent");
const CompletedMatch = require("../models/CompletedMatch");

// --- UTILITY FUNCTIONS ---
function emitToRoom(req, matchId, eventName, data) {
  const io = req.app.get("io");
  if (io) {
    io.to(`match:${matchId}`).emit(eventName, data);
  }
}

// --- ADMIN CONTROLLERS ---

exports.createMatch = async (req, res) => {
  try {
    const {
      tournamentId,
      matchName,
      format,
      overs,
      venue,
      scheduledAt,
      teamA,
      teamB
    } = req.body;

    const match = new LiveMatch({
      tournamentId,
      matchName,
      format,
      overs,
      venue,
      scheduledAt,
      teamA,
      teamB,
      state: {
        status: "UPCOMING",
        currentInnings: 1,
      }
    });

    await match.save();
    emitToRoom(req, "global", "new-live-match", match);
    res.status(201).json({ success: true, match });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAdminMatches = async (req, res) => {
  try {
    const active = await LiveMatch.find().sort({ createdAt: -1 });
    const completed = await CompletedMatch.find().sort({ completedAt: -1 });
    res.json({ success: true, active, completed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMatchDetails = async (req, res) => {
  try {
    const match = await LiveMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });
    const ballEvents = await BallEvent.find({ matchId: match._id }).sort({ sequenceNumber: 1 });
    res.json({ success: true, match, ballEvents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateMatchState = async (req, res) => {
  try {
    // Logic for updating toss, strikers, bowlers, status (START, INNINGS BREAK)
    res.json({ success: true, message: "Not implemented yet" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.scoreBall = async (req, res) => {
  try {
    res.json({ success: true, message: "Not implemented yet" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.scoreWicket = async (req, res) => {
  try {
    res.json({ success: true, message: "Not implemented yet" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.undoLastBall = async (req, res) => {
  try {
    res.json({ success: true, message: "Not implemented yet" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.completeMatch = async (req, res) => {
  try {
    res.json({ success: true, message: "Not implemented yet" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// --- PUBLIC / USER CONTROLLERS ---

exports.getLiveMatches = async (req, res) => {
  try {
    const matches = await LiveMatch.find({ "state.status": { $in: ["LIVE", "INNINGS_BREAK"] } });
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getUpcomingMatches = async (req, res) => {
  try {
    const matches = await LiveMatch.find({ "state.status": "UPCOMING" });
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getCompletedMatches = async (req, res) => {
  try {
    const matches = await CompletedMatch.find().sort({ completedAt: -1 });
    res.json({ success: true, matches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMatchScorecard = async (req, res) => {
  try {
    const activeMatch = await LiveMatch.findById(req.params.id);
    if (activeMatch) {
      const ballEvents = await BallEvent.find({ matchId: activeMatch._id }).sort({ sequenceNumber: 1 });
      return res.json({ success: true, type: "LIVE", match: activeMatch, ballEvents });
    }
    
    const completedMatch = await CompletedMatch.findOne({ sourceMatchId: req.params.id }) || await CompletedMatch.findById(req.params.id);
    if (completedMatch) {
      return res.json({ success: true, type: "COMPLETED", match: completedMatch });
    }
    
    res.status(404).json({ success: false, error: "Match not found" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
