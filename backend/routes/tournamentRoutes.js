const express = require("express");
const mongoose = require("mongoose");
const Tournament = require("../models/Tournament");
const Event = require("../models/Event");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const ROUNDS = ["Round 1", "Round 2", "Semi Final", "Final"];

function isValidObjectId(id) {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    new mongoose.Types.ObjectId(id).toString() === String(id)
  );
}

function emptyTournament(eventId, event = null) {
  return {
    event: event || eventId,
    teams: [],
    matches: [],
    winner1: null,
    winner2: null,
    champion: null,
  };
}

function emitTournament(io, eventName, tournament) {
  if (io && tournament) {
    io.emit(eventName, tournament);
  }
}

function sanitizeTeams(teams) {
  if (!Array.isArray(teams)) {
    return [];
  }

  return teams.map((team) => String(team || "").trim()).filter(Boolean);
}

function normalizeTeam(name) {
  return String(name || "").trim();
}

function applyRoundSummaries(tournament) {
  const round1Winners = (tournament.matches || [])
    .filter((match) => match.round === "Round 1" && match.winner)
    .sort((a, b) => a.matchNumber - b.matchNumber)
    .map((match) => match.winner);

  tournament.winner1 = round1Winners[0] || "";
  tournament.winner2 = round1Winners[1] || "";

  const finalMatch = (tournament.matches || []).find(
    (match) => match.round === "Final" && match.winner
  );

  tournament.champion = finalMatch?.winner || "";
}

function validateMatchPayload({ round, team1, team2, teams }) {
  if (!ROUNDS.includes(round)) {
    return "Select a valid round.";
  }

  if (team1 && team2 && team1.toLowerCase() === team2.toLowerCase()) {
    return "Team A and Team B cannot be the same team.";
  }

  const roster = (teams || []).map((team) => team.toLowerCase());

  if (team1 && !roster.includes(team1.toLowerCase())) {
    return `${team1} is not in the tournament team list.`;
  }

  if (team2 && !roster.includes(team2.toLowerCase())) {
    return `${team2} is not in the tournament team list.`;
  }

  return null;
}

function isDuplicateMatch(matches, { team1, team2, round, excludeId }) {
  if (!team1 || !team2) {
    return false;
  }

  const a = team1.toLowerCase();
  const b = team2.toLowerCase();

  return matches.some((match) => {
    if (excludeId && String(match._id) === String(excludeId)) {
      return false;
    }

    if (match.round !== round) {
      return false;
    }

    const x = (match.team1 || "").toLowerCase();
    const y = (match.team2 || "").toLowerCase();

    return (x === a && y === b) || (x === b && y === a);
  });
}

async function findEventTournament(eventId, res) {
  if (!isValidObjectId(eventId)) {
    res.status(400).json({
      success: false,
      message: "Invalid event ID",
    });
    return null;
  }

  const event = await Event.findById(eventId);

  if (!event) {
    res.status(404).json({
      success: false,
      message: "Event not found",
    });
    return null;
  }

  return { event };
}

async function saveAndEmit(req, tournament, extra = {}) {
  applyRoundSummaries(tournament);
  await tournament.save();
  await tournament.populate("event");

  const io = req.app.get("io");
  emitTournament(io, "tournament-updated", tournament);

  return {
    success: true,
    tournament,
    ...extra,
  };
}

router.get("/:eventId", async (req, res) => {
  try {
    const found = await findEventTournament(req.params.eventId, res);
    if (!found) return;

    const tournament = await Tournament.findOne({
      event: req.params.eventId,
    }).populate("event");

    if (!tournament) {
      return res.json({
        success: true,
        generated: false,
        tournament: emptyTournament(req.params.eventId, found.event),
      });
    }

    res.json({
      success: true,
      generated: true,
      tournament,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/:eventId", protect, async (req, res) => {
  try {
    const found = await findEventTournament(req.params.eventId, res);
    if (!found) return;

    const teams = sanitizeTeams(req.body.teams);

    if (teams.length < 1) {
      return res.status(400).json({
        success: false,
        message: "Add at least one team",
      });
    }

    const uniqueTeams = [...new Set(teams.map((team) => team.toLowerCase()))];

    if (uniqueTeams.length !== teams.length) {
      return res.status(400).json({
        success: false,
        message: "Team names must be unique",
      });
    }

    let tournament = await Tournament.findOne({
      event: req.params.eventId,
    });

    if (!tournament) {
      tournament = new Tournament({
        event: req.params.eventId,
        teams,
        matches: [],
      });
    } else {
      tournament.teams = teams;
    }

    const payload = await saveAndEmit(req, tournament, {
      message: "Teams saved successfully",
    });

    res.status(201).json(payload);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:eventId/team", protect, async (req, res) => {
  try {
    const found = await findEventTournament(req.params.eventId, res);
    if (!found) return;

    const oldName = normalizeTeam(req.body.oldName);
    const newName = normalizeTeam(req.body.newName);

    if (!oldName || !newName) {
      return res.status(400).json({
        success: false,
        message: "Team name cannot be empty",
      });
    }

    const tournament = await Tournament.findOne({
      event: req.params.eventId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    if (
      tournament.teams.some(
        (team) =>
          team.toLowerCase() === newName.toLowerCase() &&
          team.toLowerCase() !== oldName.toLowerCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "A team with this name already exists",
      });
    }

    tournament.teams = tournament.teams.map((team) =>
      team === oldName ? newName : team
    );

    tournament.matches.forEach((match) => {
      if (match.team1 === oldName) match.team1 = newName;
      if (match.team2 === oldName) match.team2 = newName;
      if (match.winner === oldName) match.winner = newName;
    });

    if (tournament.winner1 === oldName) tournament.winner1 = newName;
    if (tournament.winner2 === oldName) tournament.winner2 = newName;
    if (tournament.champion === oldName) tournament.champion = newName;

    res.json(await saveAndEmit(req, tournament));
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/:eventId/team/:teamName", protect, async (req, res) => {
  try {
    const found = await findEventTournament(req.params.eventId, res);
    if (!found) return;

    const tournament = await Tournament.findOne({
      event: req.params.eventId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const teamName = decodeURIComponent(req.params.teamName).trim();

    tournament.teams = tournament.teams.filter((team) => team !== teamName);

    tournament.matches.forEach((match) => {
      if (match.team1 === teamName) match.team1 = "";
      if (match.team2 === teamName) match.team2 = "";
      if (match.winner === teamName) {
        match.winner = "";
        if (match.status === "Completed") {
          match.status = "Upcoming";
        }
      }
    });

    if (tournament.winner1 === teamName) tournament.winner1 = "";
    if (tournament.winner2 === teamName) tournament.winner2 = "";
    if (tournament.champion === teamName) tournament.champion = "";

    res.json(await saveAndEmit(req, tournament));
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/:eventId/match", protect, async (req, res) => {
  try {
    const found = await findEventTournament(req.params.eventId, res);
    if (!found) return;

    let tournament = await Tournament.findOne({
      event: req.params.eventId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Save teams before creating matches",
      });
    }

    const round = String(req.body.round || "Round 1").trim();
    const team1 = normalizeTeam(req.body.team1);
    const team2 = normalizeTeam(req.body.team2);

    const validationError = validateMatchPayload({
      round,
      team1,
      team2,
      teams: tournament.teams,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (
      isDuplicateMatch(tournament.matches, {
        team1,
        team2,
        round,
      })
    ) {
      return res.status(400).json({
        success: false,
        message: "This pairing already exists in the selected round.",
      });
    }

    const roundMatches = tournament.matches.filter(
      (match) => match.round === round
    );
    const matchNumber =
      roundMatches.length > 0
        ? Math.max(...roundMatches.map((match) => match.matchNumber || 0)) + 1
        : 1;

    tournament.matches.push({
      round,
      matchNumber,
      team1,
      team2,
      status: "Upcoming",
      winner: "",
    });

    res.status(201).json(
      await saveAndEmit(req, tournament, {
        message: "Match created successfully",
      })
    );
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:eventId/match/:matchId/score", protect, async (req, res) => {
  try {
    const found = await findEventTournament(req.params.eventId, res);
    if (!found) return;

    const {
      team1Score,
      team2Score,
      team1Wickets,
      team2Wickets,
      status,
    } = req.body;

    const tournament = await Tournament.findOne({
      event: req.params.eventId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const match = tournament.matches.id(req.params.matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (team1Score !== undefined) match.team1Score = Number(team1Score);
    if (team2Score !== undefined) match.team2Score = Number(team2Score);
    if (team1Wickets !== undefined) match.team1Wickets = Number(team1Wickets);
    if (team2Wickets !== undefined) match.team2Wickets = Number(team2Wickets);
    if (status) match.status = status;

    applyRoundSummaries(tournament);
    await tournament.save();
    await tournament.populate("event");

    const io = req.app.get("io");

    if (io) {
      io.emit("live-score-updated", {
        tournament,
        match,
      });
      io.emit("tournament-updated", tournament);
    }

    res.json({
      success: true,
      tournament,
      match,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:eventId/match/:matchId/winner", protect, async (req, res) => {
  try {
    const found = await findEventTournament(req.params.eventId, res);
    if (!found) return;

    const winner = normalizeTeam(req.body.winner);

    const tournament = await Tournament.findOne({
      event: req.params.eventId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const match = tournament.matches.id(req.params.matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (winner) {
      if (winner !== match.team1 && winner !== match.team2) {
        return res.status(400).json({
          success: false,
          message: "Winner must be Team A or Team B",
        });
      }

      if (!match.team1 || !match.team2) {
        return res.status(400).json({
          success: false,
          message: "Assign both teams before selecting a winner",
        });
      }

      match.winner = winner;
      match.status = "Completed";
    } else {
      match.winner = "";
      if (match.status === "Completed") {
        match.status = "Upcoming";
      }
    }

    res.json(
      await saveAndEmit(req, tournament, {
        message: "Winner updated",
      })
    );
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/:eventId/match/:matchId", protect, async (req, res) => {
  try {
    const found = await findEventTournament(req.params.eventId, res);
    if (!found) return;

    const tournament = await Tournament.findOne({
      event: req.params.eventId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const match = tournament.matches.id(req.params.matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    const round = String(req.body.round || match.round).trim();
    const team1 = normalizeTeam(
      req.body.team1 !== undefined ? req.body.team1 : match.team1
    );
    const team2 = normalizeTeam(
      req.body.team2 !== undefined ? req.body.team2 : match.team2
    );

    const validationError = validateMatchPayload({
      round,
      team1,
      team2,
      teams: tournament.teams,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    if (
      isDuplicateMatch(tournament.matches, {
        team1,
        team2,
        round,
        excludeId: match._id,
      })
    ) {
      return res.status(400).json({
        success: false,
        message: "This pairing already exists in the selected round.",
      });
    }

    match.round = round;
    match.team1 = team1;
    match.team2 = team2;

    if (match.winner && match.winner !== team1 && match.winner !== team2) {
      match.winner = "";
      if (match.status === "Completed") {
        match.status = "Upcoming";
      }
    }

    res.json(
      await saveAndEmit(req, tournament, {
        message: "Match updated successfully",
      })
    );
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/:eventId/match/:matchId", protect, async (req, res) => {
  try {
    const found = await findEventTournament(req.params.eventId, res);
    if (!found) return;

    const tournament = await Tournament.findOne({
      event: req.params.eventId,
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    const match = tournament.matches.id(req.params.matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    tournament.matches.pull(req.params.matchId);

    res.json(
      await saveAndEmit(req, tournament, {
        message: "Match deleted successfully",
      })
    );
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
