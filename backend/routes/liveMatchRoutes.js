const express = require("express");
const router = express.Router();
const liveMatchController = require("../controllers/liveMatchController");

// Admin routes (would normally be protected by auth middleware)
router.post("/", liveMatchController.createMatch);
router.get("/admin", liveMatchController.getAdminMatches); // For admin dashboard list
router.get("/admin/:id", liveMatchController.getMatchDetails);
router.patch("/admin/:id/state", liveMatchController.updateMatchState); // Start match, set toss, etc.
router.post("/admin/:id/score", liveMatchController.scoreBall);
router.post("/admin/:id/wicket", liveMatchController.scoreWicket);
router.post("/admin/:id/undo", liveMatchController.undoLastBall);
router.post("/admin/:id/complete", liveMatchController.completeMatch);

// User/Public routes
router.get("/live", liveMatchController.getLiveMatches);
router.get("/upcoming", liveMatchController.getUpcomingMatches);
router.get("/results", liveMatchController.getCompletedMatches);
router.get("/:id", liveMatchController.getMatchScorecard);

module.exports = router;
