const mongoose = require("mongoose");
const LiveMatch = require("../models/LiveMatch");
const BallEvent = require("../models/BallEvent");
const CompletedMatch = require("../models/CompletedMatch");

// --- UTILITY FUNCTIONS ---
function emitToRoom(req, matchId, eventName, data) {
  const io = req.app.get("io");
  if (!io) return;

  // Room-scoped emit (kept for the single-match detail view).
  io.to(`match:${matchId}`).emit(eventName, data);

  // The public Live page does not join any room, so also broadcast
  // score/state/lifecycle events to every connected client.
  if (matchId === "global") {
    io.emit(eventName, data);
  }
}

// Map a live LiveMatch team ({name, shortName, ...}) onto the
// CompletedMatch team snapshot shape ({nameSnapshot, ...}).
function snapshotTeam(team) {
  if (!team) return {};
  return {
    teamId: team._id ? String(team._id) : undefined,
    nameSnapshot: team.name || "",
    shortNameSnapshot: team.shortName || "",
    logoSnapshot: team.logo || "",
    players: (team.players || []).map((p) => ({
      originalPlayerId: p.playerId || (p._id ? String(p._id) : undefined),
      nameSnapshot: p.name || "",
      roleSnapshot: p.role || "",
      jerseyNumberSnapshot: p.jerseyNumber || "",
    })),
  };
}

function cloneValue(value) {
  if (!value) return value;
  return typeof value.toObject === "function"
    ? value.toObject()
    : JSON.parse(JSON.stringify(value));
}

function oversDisplay(legalBalls = 0) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

function teamNameFor(match, slot) {
  const team = slot === "Team A" ? match.teamA : slot === "Team B" ? match.teamB : null;
  return team?.name || team?.shortName || slot || "Team";
}

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function archiveCompletedMatch(match) {
  const ballEvents = await BallEvent.find({ matchId: match._id }).sort({ sequenceNumber: 1 });
  const firstBattingTeam = match.state?.currentInnings === 2
    ? match.state?.bowlingTeamId
    : match.state?.battingTeamId;
  const secondBattingTeam = firstBattingTeam === "Team A" ? "Team B" : "Team A";
  const scorecards = {
    firstInnings: {
      team: teamNameFor(match, firstBattingTeam),
      runs: match.score.firstInnings.runs,
      wickets: match.score.firstInnings.wickets,
      oversDisplay: oversDisplay(match.score.firstInnings.legalBalls),
      extras: match.score.firstInnings.extras,
    },
    secondInnings: {
      team: teamNameFor(match, secondBattingTeam),
      runs: match.score.secondInnings.runs,
      wickets: match.score.secondInnings.wickets,
      oversDisplay: oversDisplay(match.score.secondInnings.legalBalls),
      extras: match.score.secondInnings.extras,
    },
  };

  const ballHistory = ballEvents.map((ball) => ({
    innings: ball.innings,
    overNumber: ball.overNumber,
    ballNumber: ball.ballNumber,
    strikerName: ball.strikerId || "",
    bowlerName: ball.bowlerId || "",
    summary: ball.isWicket
      ? "W"
      : ball.extras?.type
        ? `${ball.extras.type}${ball.extras.runs || ""}`
        : String(ball.runsOffBat || 0),
  }));

  return CompletedMatch.findOneAndUpdate(
    { sourceMatchId: match._id },
    {
      $setOnInsert: {
        sourceMatchId: match._id,
        tournamentId: match.tournamentId,
        matchName: match.matchName,
        sport: match.sport,
        format: match.format,
        overs: match.overs,
        venueSnapshot: match.venue || "",
        scheduledAt: match.scheduledAt,
        startedAt: match.startedAt || match.updatedAt || match.createdAt,
        teamA: snapshotTeam(match.teamA),
        teamB: snapshotTeam(match.teamB),
        toss: match.toss,
      },
      $set: {
        winner: match.winner,
        resultText: match.resultText,
        scorecards,
        ballHistory,
        completedAt: new Date(),
      },
    },
    { new: true, upsert: true, runValidators: true }
  );
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

    const normalizedMatchName = cleanText(matchName);
    const normalizedFormat = cleanText(format);
    const normalizedVenue = cleanText(venue);
    const normalizedTeamA = {
      ...(teamA || {}),
      name: cleanText(teamA?.name),
      shortName: cleanText(teamA?.shortName),
      players: Array.isArray(teamA?.players) ? teamA.players : [],
    };
    const normalizedTeamB = {
      ...(teamB || {}),
      name: cleanText(teamB?.name),
      shortName: cleanText(teamB?.shortName),
      players: Array.isArray(teamB?.players) ? teamB.players : [],
    };
    const parsedOvers = Number(overs);
    const parsedScheduledAt = new Date(scheduledAt);

    if (!normalizedMatchName || normalizedMatchName.length > 120 || !normalizedFormat ||
      !Number.isSafeInteger(parsedOvers) || parsedOvers < 1 || parsedOvers > 100 ||
      !scheduledAt || Number.isNaN(parsedScheduledAt.getTime()) ||
      !normalizedTeamA.name || !normalizedTeamA.shortName ||
      !normalizedTeamB.name || !normalizedTeamB.shortName) {
      return res.status(400).json({ success: false, message: "Enter a match name, format, overs from 1 to 100, valid schedule, and both teams." });
    }

    if (normalizedTeamA.name.toLowerCase() === normalizedTeamB.name.toLowerCase()) {
      return res.status(400).json({ success: false, message: "Team A and Team B must be different teams." });
    }

    if (normalizedTeamA.shortName.toLowerCase() === normalizedTeamB.shortName.toLowerCase()) {
      return res.status(400).json({ success: false, message: "Team short names must be different." });
    }

    const normalizedTournamentId = cleanText(tournamentId);
    if (normalizedTournamentId && !mongoose.Types.ObjectId.isValid(normalizedTournamentId)) {
      return res.status(400).json({ success: false, message: "The selected tournament is invalid." });
    }

    const match = new LiveMatch({
      ...(normalizedTournamentId ? { tournamentId: normalizedTournamentId } : {}),
      matchName: normalizedMatchName,
      format: normalizedFormat,
      overs: parsedOvers,
      venue: normalizedVenue,
      scheduledAt: parsedScheduledAt,
      teamA: normalizedTeamA,
      teamB: normalizedTeamB,
      startedAt: null,
      state: {
        status: "UPCOMING",
        currentInnings: 1,
      }
    });

    await match.save();
    emitToRoom(req, "global", "new-live-match", match);
    res.status(201).json({ success: true, match });
  } catch (err) {
    const status = err?.name === "ValidationError" || err?.name === "CastError" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: status === 500 ? "Unable to assign the match right now." : err.message,
      error: err.message,
    });
  }
};

exports.getAdminMatches = async (req, res) => {
  try {
    const active = await LiveMatch.find({
      "state.status": { $ne: "COMPLETED" },
    }).sort({ createdAt: -1 });
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
    const match = await LiveMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });

    const { toss, state, score } = req.body;
    if (match.state.status === "COMPLETED" || match.state.status === "CANCELLED") {
      return res.status(400).json({ success: false, error: "This match can no longer be changed" });
    }
    if (state?.status && !["UPCOMING", "LIVE", "INNINGS_BREAK"].includes(state.status)) {
      return res.status(400).json({ success: false, error: "Invalid live match status" });
    }
    if (toss && (!['Team A', 'Team B'].includes(toss.wonBy) || !['BAT', 'BOWL'].includes(toss.decision))) {
      return res.status(400).json({ success: false, error: "A valid toss winner and decision are required" });
    }
    if (toss) match.toss = toss;
    if (state) {
      if (state.battingTeamId && !["Team A", "Team B"].includes(state.battingTeamId)) {
        return res.status(400).json({ success: false, error: "Invalid batting team" });
      }
      if (state.bowlingTeamId && !["Team A", "Team B"].includes(state.bowlingTeamId)) {
        return res.status(400).json({ success: false, error: "Invalid bowling team" });
      }
      match.state = { ...match.state, ...state };
    }
    if (score) match.score = score;
    
    // If setting toss, we usually transition from UPCOMING to LIVE
    if (toss && match.state.status === "UPCOMING") {
      match.state.status = "LIVE";
      match.startedAt = match.startedAt || new Date();
    }
    if (state?.status === "LIVE") {
      match.startedAt = match.startedAt || new Date();
    }

    await match.save();
    emitToRoom(req, match._id, "match:scoreUpdated", match);
    emitToRoom(req, "global", "match:scoreUpdated", match); // Let dashboard know
    
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.scoreBall = async (req, res) => {
  try {
    const match = await LiveMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });

    if (match.state.status !== "LIVE") {
      return res.status(400).json({ success: false, error: "Start or resume the innings before scoring" });
    }

    const { runs = 0, isBoundary = false, extras = null, isWicket = false, wicketDetails, strikerId, nonStrikerId, bowlerId } = req.body;
    const boundary = isBoundary === true;
    const wicketTaken = isWicket === true;
    const batRuns = Number(runs);
    const extraRuns = extras ? Number(extras.runs) : 0;
    const extraType = extras?.type || null;
    if (!Number.isInteger(batRuns) || batRuns < 0 || batRuns > 6) {
      return res.status(400).json({ success: false, error: "Runs must be a whole number from 0 to 6" });
    }
    if (extraType && !["WD", "NB", "LB", "B"].includes(extraType)) {
      return res.status(400).json({ success: false, error: "Invalid extra type" });
    }
    if (extraType && (!Number.isInteger(extraRuns) || extraRuns < 1 || extraRuns > 6)) {
      return res.status(400).json({ success: false, error: "Extras must be a whole number from 1 to 6" });
    }
    if (boundary && ![4, 6].includes(batRuns)) {
      return res.status(400).json({ success: false, error: "A boundary must be 4 or 6 runs" });
    }
    const currentInningsIndex = match.state.currentInnings === 1 ? "firstInnings" : "secondInnings";
    const inningsScore = match.score[currentInningsIndex];
    
    // Calculate sequence and over numbers
    const lastBall = await BallEvent.findOne({ matchId: match._id }).sort({ sequenceNumber: -1 });
    const sequenceNumber = lastBall ? lastBall.sequenceNumber + 1 : 1;
    
    const overNumber = Math.floor(inningsScore.legalBalls / 6);
    const ballNumber = (inningsScore.legalBalls % 6) + 1;

    // Create the ball event
    const ballEvent = new BallEvent({
      matchId: match._id,
      previousState: cloneValue(match.state),
      previousScore: cloneValue(match.score),
      previousTarget: match.target,
      previousWinner: match.winner,
      previousResultText: match.resultText,
      innings: match.state.currentInnings,
      sequenceNumber,
      overNumber,
      ballNumber,
      strikerId: strikerId || match.state.strikerId || "",
      nonStrikerId: nonStrikerId || match.state.nonStrikerId || "",
      bowlerId: bowlerId || match.state.bowlerId || "",
      runsOffBat: batRuns,
      isBoundary: boundary,
      extras: extraType ? { type: extraType, runs: extraRuns } : { type: null, runs: 0 },
      isLegalDelivery: !(extraType === "WD" || extraType === "NB"),
      isWicket: wicketTaken,
      wicket: wicketDetails || { type: null, dismissedPlayerId: null, fielderId: null }
    });

    await ballEvent.save();

    // Update match score
    let totalRuns = batRuns + extraRuns;
    inningsScore.runs += totalRuns;
    
    if (extras) {
      inningsScore.extras += extraRuns;
    }
    
    if (ballEvent.isLegalDelivery) {
      inningsScore.legalBalls += 1;
    }
    
    if (wicketTaken) {
      inningsScore.wickets += 1;
    }

    // Strike rotation logic
    let shouldRotate = false;
    if (batRuns % 2 !== 0) shouldRotate = !shouldRotate;
    if (ballEvent.isLegalDelivery && (inningsScore.legalBalls % 6 === 0)) {
      // Over completed, rotate strike
      shouldRotate = !shouldRotate;
      match.state.bowlerId = null; // Needs new bowler
    }
    
    if (shouldRotate) {
      const temp = match.state.strikerId;
      match.state.strikerId = match.state.nonStrikerId;
      match.state.nonStrikerId = temp;
    }
    
    // Resolve "Team A"/"Team B" slots to actual team names for results.
    const nameFor = (slot) => {
      const t = slot === "Team A" ? match.teamA : slot === "Team B" ? match.teamB : null;
      return t?.name || t?.shortName || slot || "Team";
    };

    // Check if innings over
    if (inningsScore.wickets >= 10 || inningsScore.legalBalls >= (match.overs * 6)) {
      if (match.state.currentInnings === 1) {
        match.state.status = "INNINGS_BREAK";
        match.state.currentInnings = 2;
        match.target = inningsScore.runs + 1;
        const prevBatting = match.state.battingTeamId;
        match.state.battingTeamId = match.state.bowlingTeamId;
        match.state.bowlingTeamId = prevBatting;
      } else {
        match.state.status = "COMPLETED";
        if (inningsScore.runs >= match.target) {
           match.winner = nameFor(match.state.battingTeamId);
           match.resultText = `${match.winner} won`;
        } else if (inningsScore.runs === match.target - 1) {
           match.winner = "Tie";
           match.resultText = "Match Tied";
        } else {
           match.winner = nameFor(match.state.bowlingTeamId);
           match.resultText = `${match.winner} won by ${match.target - 1 - inningsScore.runs} runs`;
        }
      }
    }

    // Check if target chased
    if (match.state.currentInnings === 2 && match.target && inningsScore.runs >= match.target) {
        match.state.status = "COMPLETED";
        match.winner = nameFor(match.state.battingTeamId);
        match.resultText = `${match.winner} won by ${10 - inningsScore.wickets} wickets`;
    }

    // When the match finishes naturally, archive it to CompletedMatch so it
    // shows on the user "Result" tab and the admin "Completed" list.
    if (match.state.status === "COMPLETED") {
      try {
        const already = await CompletedMatch.findOne({ sourceMatchId: match._id });
        if (!already) {
           await archiveCompletedMatch(match);
          emitToRoom(req, "global", "match:completed", match);
        }
      } catch (archiveErr) {
        console.error("Failed to archive completed match:", archiveErr.message);
      }
    }

    await match.save();
    emitToRoom(req, match._id, "match:scoreUpdated", match);
    emitToRoom(req, "global", "match:scoreUpdated", match);

    res.json({ success: true, match, ballEvent });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.undoLastBall = async (req, res) => {
  try {
    const match = await LiveMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });

    const lastBall = await BallEvent.findOne({ matchId: match._id }).sort({ sequenceNumber: -1 });
    if (!lastBall) return res.status(400).json({ success: false, error: "No balls to undo" });

    if (!lastBall.previousState || !lastBall.previousScore) {
      return res.status(400).json({ success: false, error: "This ball cannot be safely undone" });
    }

    // Restore the exact pre-ball snapshot, including innings transitions.
    match.state = lastBall.previousState;
    match.score = lastBall.previousScore;
    match.target = lastBall.previousTarget;
    match.winner = lastBall.previousWinner;
    match.resultText = lastBall.previousResultText;

    await CompletedMatch.deleteOne({ sourceMatchId: match._id });
    /*
    // Reverse the effects of the last ball (legacy fallback kept below for
    // old records created before snapshots were introduced).
    const currentInningsIndex = lastBall.innings === 1 ? "firstInnings" : "secondInnings";
    const inningsScore = match.score[currentInningsIndex];

    let totalRuns = lastBall.runsOffBat + (lastBall.extras ? lastBall.extras.runs : 0);
    inningsScore.runs -= totalRuns;
    
    if (lastBall.extras) {
      inningsScore.extras -= lastBall.extras.runs;
    }
    
    if (lastBall.isLegalDelivery) {
      inningsScore.legalBalls -= 1;
    }
    
    if (lastBall.isWicket) {
      inningsScore.wickets -= 1;
    }

    // Restore strikers and bowlers (simplified for now, full restore requires more state history)
    match.state.strikerId = lastBall.strikerId;
    match.state.nonStrikerId = lastBall.nonStrikerId;
    match.state.bowlerId = lastBall.bowlerId;

    */
    await lastBall.deleteOne();
    await match.save();

    emitToRoom(req, match._id, "match:scoreUpdated", match);
    emitToRoom(req, "global", "match:scoreUpdated", match);

    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.completeMatch = async (req, res) => {
  try {
    const match = await LiveMatch.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, error: "Match not found" });

    match.state.status = "COMPLETED";

    // If the match is ended before a natural finish, derive a result from
    // whatever score we have so the "Result" tab still shows something useful.
    let winner = match.winner;
    let resultText = match.resultText;
    if (!resultText) {
      const a = match.score?.firstInnings?.runs || 0;
      const b = match.score?.secondInnings?.runs || 0;
      const teamAName = match.teamA?.name || match.teamA?.shortName || "Team A";
      const teamBName = match.teamB?.name || match.teamB?.shortName || "Team B";
      if (b === 0 && a === 0) {
        resultText = "Match ended - no result";
      } else if (a === b) {
        winner = "Tie";
        resultText = "Match tied";
      } else {
        // firstInnings is the team that batted first; without richer state we
        // attribute the higher total to the batting-first side.
        winner = a > b ? teamAName : teamBName;
        resultText = `${winner} won`;
      }
    }

    match.winner = winner;
    match.resultText = resultText;
    const completedMatch = await archiveCompletedMatch(match);

    // Optionally delete from LiveMatch, or just leave it there and UI filters it
    // Let's delete it so the 'active' collection doesn't grow huge
    await match.deleteOne();
    
    emitToRoom(req, "global", "match:completed", completedMatch);

    res.json({ success: true, match: completedMatch });
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
