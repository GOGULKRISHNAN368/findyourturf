import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTournament,
  getEventById,
  assignTeams,
  generateFirstRound,
  editTeam,
  deleteTeam,
  updateLiveScore,
  setMatchWinner,
  createMatch,
  updateMatch,
  deleteMatch,
} from "../services/api";
import { socket } from "../services/socket";
import Badge from "../components/common/Badge";
import EmptyState from "../components/common/EmptyState";
import Modal from "../components/common/Modal";
import {
  IconArrowLeft,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconAlertCircle,
  IconLive,
  IconTrophy,
  IconCrown,
  IconUsers,
  IconRefresh,
  IconSparkles,
} from "../components/common/Icons";

const EMPTY_TOURNAMENT = {
  teams: [],
  matches: [],
  winner1: null,
  winner2: null,
  champion: null,
};

const ROUNDS = ["Round 1", "Round 2", "Semi Final", "Final"];

export default function TournamentManagement() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState(null);
  const [tournament, setTournament] = useState(EMPTY_TOURNAMENT);
  const [activeRoundTab, setActiveRoundTab] = useState("Round 1");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingTeams, setSavingTeams] = useState(false);
  const [generatingRound, setGeneratingRound] = useState(false);
  const [savingMatch, setSavingMatch] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isNetworkError, setIsNetworkError] = useState(false);

  const [newRound, setNewRound] = useState("Round 1");
  const [newTeam1, setNewTeam1] = useState("");
  const [newTeam2, setNewTeam2] = useState("");

  const [editTeamModalOpen, setEditTeamModalOpen] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState({ old: "", new: "" });

  const isPersisted = Boolean(tournament?._id);
  const teams = tournament?.teams || [];
  const matches = tournament?.matches || [];

  const loadData = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError("");
      setIsNetworkError(false);

      const [tourneyRes, evRes] = await Promise.allSettled([
        getTournament(eventId),
        getEventById(eventId),
      ]);

      if (tourneyRes.status === "fulfilled") {
        setTournament(tourneyRes.value || EMPTY_TOURNAMENT);
      } else {
        const err = tourneyRes.reason;
        if (err?.isNetworkError) {
          setIsNetworkError(true);
          setError(err.message);
        } else if (err?.status !== 404) {
          setError(err?.message || "Unable to load tournament.");
        }
      }

      if (evRes.status === "fulfilled" && evRes.value) {
        setEventData(evRes.value);
      }
    } catch (err) {
      if (err?.isNetworkError) {
        setIsNetworkError(true);
      }
      setError(err.message || "Unable to load tournament.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleTournamentUpdate = (updated) => {
      if (
        updated &&
        (updated.event === eventId || updated.event?._id === eventId)
      ) {
        setTournament(updated);
      }
    };

    socket.on("tournament-updated", handleTournamentUpdate);

    return () => {
      socket.off("tournament-updated", handleTournamentUpdate);
    };
  }, [eventId]);

  function notifySuccess(msg) {
    setMessage(msg);
    setError("");
    setTimeout(() => setMessage(""), 5000);
  }

  function notifyError(err) {
    setError(err);
    setMessage("");
    setTimeout(() => setError(""), 6000);
  }

  const handleAddTeam = () => {
    const trimmed = teamName.trim();
    if (!trimmed) {
      notifyError("Enter a valid team name.");
      return;
    }

    if (teams.some((team) => team.toLowerCase() === trimmed.toLowerCase())) {
      notifyError("A team with this name already exists.");
      return;
    }

    setTournament((prev) => ({
      ...(prev || EMPTY_TOURNAMENT),
      teams: [...(prev?.teams || []), trimmed],
    }));
    setTeamName("");
  };

  const handleSaveTeams = async () => {
    if (!eventId || savingTeams) return;

    if (teams.length < 1) {
      notifyError("Add at least one team.");
      return;
    }

    try {
      setSavingTeams(true);
      const data = await assignTeams(eventId, teams);
      setTournament(data.tournament || data);
      notifySuccess("Team roster saved successfully!");
    } catch (err) {
      notifyError(err.message || "Failed to save teams.");
    } finally {
      setSavingTeams(false);
    }
  };

  const handleGenerateFirstRound = async () => {
    if (!eventId || generatingRound) return;

    if (teams.length < 2) {
      notifyError("Please add at least 2 teams to generate First Round matches.");
      return;
    }

    try {
      setGeneratingRound(true);
      const data = await generateFirstRound(eventId, teams);
      setTournament(data.tournament || data);
      setActiveRoundTab("Round 1");
      notifySuccess("First round matches generated successfully!");
    } catch (err) {
      notifyError(err.message || "Failed to generate first round matches.");
    } finally {
      setGeneratingRound(false);
    }
  };

  const openEditTeam = (team) => {
    setEditingTeamName({ old: team, new: team });
    setEditTeamModalOpen(true);
  };

  const handleSaveEditedTeam = async () => {
    const { old: oldName, new: newName } = editingTeamName;
    const trimmed = newName.trim();
    if (!trimmed) {
      notifyError("Team name cannot be empty.");
      return;
    }
    if (trimmed === oldName) {
      setEditTeamModalOpen(false);
      return;
    }

    if (!isPersisted) {
      setTournament((prev) => ({
        ...prev,
        teams: (prev.teams || []).map((t) => (t === oldName ? trimmed : t)),
      }));
      setEditTeamModalOpen(false);
      return;
    }

    try {
      const data = await editTeam(eventId, oldName, trimmed);
      setTournament(data.tournament || data);
      notifySuccess(`Team renamed to "${trimmed}".`);
      setEditTeamModalOpen(false);
    } catch (err) {
      notifyError(err.message || "Failed to edit team.");
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Delete team "${team}"?`)) return;

    if (!isPersisted) {
      setTournament((prev) => ({
        ...prev,
        teams: (prev.teams || []).filter((t) => t !== team),
      }));
      return;
    }

    try {
      const data = await deleteTeam(eventId, team);
      setTournament(data.tournament || data);
      notifySuccess(`Team "${team}" deleted.`);
    } catch (err) {
      notifyError(err.message || "Failed to delete team.");
    }
  };

  const handleCreateMatch = async () => {
    if (savingMatch) return;

    if (
      newTeam1 &&
      newTeam2 &&
      newTeam1.toLowerCase() === newTeam2.toLowerCase()
    ) {
      notifyError("Team A and Team B cannot be the same team.");
      return;
    }

    try {
      setSavingMatch(true);

      let current = tournament;
      if (!isPersisted) {
        if (teams.length < 1) {
          notifyError("Save teams before creating a match.");
          return;
        }
        const saved = await assignTeams(eventId, teams);
        current = saved.tournament || saved;
        setTournament(current);
      }

      const data = await createMatch(eventId, {
        round: newRound,
        team1: newTeam1,
        team2: newTeam2,
      });

      setTournament(data.tournament || data);
      setNewTeam1("");
      setNewTeam2("");
      notifySuccess(`Match created for ${newRound}!`);
    } catch (err) {
      notifyError(err.message || "Failed to create match.");
    } finally {
      setSavingMatch(false);
    }
  };

  const handleUpdateMatch = async (matchId, payload) => {
    try {
      const data = await updateMatch(eventId, matchId, payload);
      setTournament(data.tournament || data);
      notifySuccess("Match details saved.");
    } catch (err) {
      notifyError(err.message || "Failed to update match.");
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm("Delete this match?")) return;

    try {
      const data = await deleteMatch(eventId, matchId);
      setTournament(data.tournament || data);
      notifySuccess("Match deleted.");
    } catch (err) {
      notifyError(err.message || "Failed to delete match.");
    }
  };

  const handleScoreUpdate = async (matchId, payload) => {
    try {
      const data = await updateLiveScore(eventId, matchId, payload);
      setTournament(data.tournament || data);
      notifySuccess("Live score updated!");
    } catch (err) {
      notifyError(err.message || "Failed to update live score.");
    }
  };

  const handleWinner = async (matchId, winner) => {
    try {
      const data = await setMatchWinner(eventId, matchId, winner);
      setTournament(data.tournament || data);
      notifySuccess(winner ? `Winner set: ${winner}` : "Winner cleared.");
    } catch (err) {
      notifyError(err.message || "Failed to set winner.");
    }
  };

  if (!eventId) {
    return (
      <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
        <EmptyState
          icon={IconAlertCircle}
          title="Event Not Found"
          description="No event ID was provided in the route."
          actionLabel="Return to Dashboard"
          onAction={() => navigate("/admin")}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-app)", padding: "28px 24px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Top Breadcrumb navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/admin")}
          >
            <IconArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          <div className="live-sync-indicator">
            <span className="pulse-dot" />
            <span>Live Sync Active</span>
          </div>
        </div>

        {/* Feedback Banners */}
        {message && (
          <div className="alert-banner success">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconCheck size={18} />
              <strong>{message}</strong>
            </div>
            <button onClick={() => setMessage("")} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="alert-banner error">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconAlertCircle size={18} />
              <span>{error}</span>
            </div>
            {isNetworkError ? (
              <button className="btn btn-secondary btn-sm" onClick={loadData}>
                <IconRefresh size={14} /> Retry
              </button>
            ) : (
              <button onClick={() => setError("")} aria-label="Dismiss error">
                ×
              </button>
            )}
          </div>
        )}

        {/* Hero Card */}
        {eventData && (
          <div className="tournament-hero-card">
            <div className="hero-top-bar">
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Badge sport={eventData.sport} />
                <Badge status={eventData.status || "Upcoming"} />
              </div>
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                Event #{eventData._id.slice(-6)}
              </span>
            </div>

            <h1 className="hero-event-title">{eventData.eventName}</h1>

            <div className="hero-stats-row">
              <div className="hero-stat-pill">
                <span>Venue</span>
                <span>{eventData.location}</span>
              </div>
              <div className="hero-stat-pill">
                <span>Date</span>
                <span>{formatDate(eventData.eventDate)}</span>
              </div>
              <div className="hero-stat-pill">
                <span>Team Size</span>
                <span>{eventData.teamSize}</span>
              </div>
              <div className="hero-stat-pill">
                <span>1st Place Prize</span>
                <span style={{ color: "#fbbf24" }}>
                  ₹{Number(eventData.firstPrize || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Winners Showcase */}
        <div className="winners-podium-grid">
          <div className="winner-card">
            <div className="winner-trophy-icon">
              <IconTrophy size={20} />
            </div>
            <div className="winner-details">
              <span className="winner-stage-label">Round 1 - Winner 1</span>
              <strong className="winner-team-name">
                {tournament?.winner1 || "Waiting for match..."}
              </strong>
            </div>
          </div>

          <div className="winner-card">
            <div className="winner-trophy-icon">
              <IconTrophy size={20} />
            </div>
            <div className="winner-details">
              <span className="winner-stage-label">Round 1 - Winner 2</span>
              <strong className="winner-team-name">
                {tournament?.winner2 || "Waiting for match..."}
              </strong>
            </div>
          </div>

          <div className="winner-card champion">
            <div className="winner-trophy-icon">
              <IconCrown size={22} />
            </div>
            <div className="winner-details">
              <span className="winner-stage-label" style={{ color: "#d97706" }}>
                Champion
              </span>
              <strong className="winner-team-name" style={{ color: "#b45309" }}>
                {tournament?.champion || "Waiting for finals..."}
              </strong>
            </div>
          </div>
        </div>

        {/* Team Assignment Section */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <span className="card-badge-label">Roster & Generation</span>
              <h2 className="card-title">Team Management ({teams.length})</h2>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSaveTeams}
                disabled={savingTeams || teams.length === 0}
              >
                <IconCheck size={16} />
                <span>{savingTeams ? "Saving..." : "Save Teams"}</span>
              </button>

              <button
                className="btn btn-primary btn-sm"
                onClick={handleGenerateFirstRound}
                disabled={generatingRound || teams.length < 2}
              >
                <IconSparkles size={16} />
                <span>{generatingRound ? "Generating..." : "Generate First Round"}</span>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", maxWidth: "520px", marginBottom: "16px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Enter team name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTeam();
              }}
            />
            <button className="btn btn-secondary" onClick={handleAddTeam}>
              <IconPlus size={16} />
              <span>Add Team</span>
            </button>
          </div>

          {teams.length === 0 ? (
            <EmptyState
              icon={IconUsers}
              title="No teams added yet"
              description="Add teams using the input above, then click 'Generate First Round'."
            />
          ) : (
            <div className="team-chips-grid">
              {teams.map((t, idx) => (
                <div className="team-chip" key={`${t}-${idx}`}>
                  <div className="team-chip-info">
                    <span className="team-chip-number">{idx + 1}</span>
                    <span className="team-chip-name">{t}</span>
                  </div>
                  <div className="team-chip-actions">
                    <button
                      className="team-chip-btn"
                      onClick={() => openEditTeam(t)}
                      title="Edit team"
                      aria-label="Edit team"
                    >
                      <IconEdit size={14} />
                    </button>
                    <button
                      className="team-chip-btn delete"
                      onClick={() => handleDeleteTeam(t)}
                      title="Remove team"
                      aria-label="Remove team"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Match Section */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <span className="card-badge-label">Match Builder</span>
              <h2 className="card-title">Schedule Fixture</h2>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group col-4">
              <label className="form-label">Round *</label>
              <select
                className="form-control"
                value={newRound}
                onChange={(e) => setNewRound(e.target.value)}
              >
                {ROUNDS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group col-4">
              <label className="form-label">Team A *</label>
              <select
                className="form-control"
                value={newTeam1}
                onChange={(e) => setNewTeam1(e.target.value)}
              >
                <option value="">Select Team A (or TBD)</option>
                {teams.map((t) => (
                  <option key={`a-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group col-4">
              <label className="form-label">Team B *</label>
              <select
                className="form-control"
                value={newTeam2}
                onChange={(e) => setNewTeam2(e.target.value)}
              >
                <option value="">Select Team B (or TBD)</option>
                {teams.map((t) => (
                  <option key={`b-${t}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12" style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn btn-primary"
                onClick={handleCreateMatch}
                disabled={savingMatch}
              >
                <IconPlus size={16} />
                <span>Add Match</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bracket Matches Section */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-left">
              <span className="card-badge-label">Bracket</span>
              <h2 className="card-title">Tournament Matches ({matches.length})</h2>
            </div>
          </div>

          <div className="rounds-nav-tabs">
            {ROUNDS.map((r) => {
              const count = matches.filter((m) => m.round === r).length;
              return (
                <button
                  key={r}
                  className={`round-tab-btn ${activeRoundTab === r ? "active" : ""}`}
                  onClick={() => setActiveRoundTab(r)}
                >
                  {r} {count > 0 && `(${count})`}
                </button>
              );
            })}
          </div>

          {(() => {
            const roundMatches = matches
              .filter((m) => m.round === activeRoundTab)
              .sort((a, b) => a.matchNumber - b.matchNumber);

            if (roundMatches.length === 0) {
              return (
                <EmptyState
                  icon={IconTrophy}
                  title={`No matches in ${activeRoundTab}`}
                  description="Use 'Generate First Round' or Match Builder above to schedule matches."
                />
              );
            }

            return (
              <div className="matches-grid">
                {roundMatches.map((match) => (
                  <StandaloneMatchCard
                    key={match._id}
                    match={match}
                    teams={teams}
                    onScoreUpdate={handleScoreUpdate}
                    onWinnerUpdate={handleWinner}
                    onSave={handleUpdateMatch}
                    onDelete={handleDeleteMatch}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Edit Team Modal */}
      <Modal
        isOpen={editTeamModalOpen}
        onClose={() => setEditTeamModalOpen(false)}
        title="Rename Team"
        maxWidth="420px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Team Name</label>
            <input
              type="text"
              className="form-control"
              value={editingTeamName.new}
              onChange={(e) =>
                setEditingTeamName({ ...editingTeamName, new: e.target.value })
              }
              autoFocus
            />
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setEditTeamModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveEditedTeam}
            >
              Save Team Name
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StandaloneMatchCard({
  match,
  onScoreUpdate,
  onWinnerUpdate,
  onSave,
  onDelete,
}) {
  const [team1, setTeam1] = useState(match.team1 || "");
  const [team2, setTeam2] = useState(match.team2 || "");
  const [round, setRound] = useState(match.round || "Round 1");
  const [team1Score, setTeam1Score] = useState(match.team1Score || 0);
  const [team1Wickets, setTeam1Wickets] = useState(match.team1Wickets || 0);
  const [team2Score, setTeam2Score] = useState(match.team2Score || 0);
  const [team2Wickets, setTeam2Wickets] = useState(match.team2Wickets || 0);
  const [status, setStatus] = useState(match.status || "Upcoming");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTeam1(match.team1 || "");
    setTeam2(match.team2 || "");
    setRound(match.round || "Round 1");
    setTeam1Score(match.team1Score || 0);
    setTeam1Wickets(match.team1Wickets || 0);
    setTeam2Score(match.team2Score || 0);
    setTeam2Wickets(match.team2Wickets || 0);
    setStatus(match.status || "Upcoming");
  }, [
    match.team1,
    match.team2,
    match.round,
    match.team1Score,
    match.team1Wickets,
    match.team2Score,
    match.team2Wickets,
    match.status,
  ]);

  async function handleLiveScoreSubmit() {
    try {
      setSaving(true);
      await onScoreUpdate(match._id, {
        team1Score: Number(team1Score) || 0,
        team1Wickets: Number(team1Wickets) || 0,
        team2Score: Number(team2Score) || 0,
        team2Wickets: Number(team2Wickets) || 0,
        status,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDetails() {
    try {
      setSaving(true);
      await onSave(match._id, { team1, team2, round });
    } finally {
      setSaving(false);
    }
  }

  function addRunsTeam1(runs) {
    setTeam1Score((prev) => Number(prev || 0) + runs);
  }
  function addWicketTeam1() {
    setTeam1Wickets((prev) => Math.min(10, Number(prev || 0) + 1));
  }
  function addRunsTeam2(runs) {
    setTeam2Score((prev) => Number(prev || 0) + runs);
  }
  function addWicketTeam2() {
    setTeam2Wickets((prev) => Math.min(10, Number(prev || 0) + 1));
  }

  const isLive = status === "Live";

  return (
    <div className={`match-card ${isLive ? "is-live" : ""}`}>
      <div className="match-card-top">
        <span className="match-number-tag">
          {match.round} • Match #{match.matchNumber}
        </span>
        <Badge status={status} />
      </div>

      <div className="match-teams-box">
        <div>
          <div className="match-team-row">
            <span className={`match-team-name ${match.winner === team1 ? "is-winner" : ""}`}>
              {match.winner === team1 && <IconTrophy size={14} style={{ color: "#15803d" }} />}
              <span>{team1 || "Team A (TBD)"}</span>
            </span>

            <div className="match-score-inputs">
              <div style={{ textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  className="score-num-field"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  placeholder="0"
                />
                <div className="score-sublabel">Runs</div>
              </div>
              <span style={{ fontWeight: 800 }}>/</span>
              <div style={{ textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="score-num-field"
                  value={team1Wickets}
                  onChange={(e) => setTeam1Wickets(e.target.value)}
                  placeholder="0"
                />
                <div className="score-sublabel">Wkts</div>
              </div>
            </div>
          </div>

          <div className="score-quick-buttons">
            <button className="score-inc-btn" onClick={() => addRunsTeam1(1)}>+1</button>
            <button className="score-inc-btn" onClick={() => addRunsTeam1(4)}>+4</button>
            <button className="score-inc-btn" onClick={() => addRunsTeam1(6)}>+6</button>
            <button className="score-inc-btn wicket" onClick={addWicketTeam1}>+W</button>
          </div>
        </div>

        <div className="match-vs-divider">VS</div>

        <div>
          <div className="match-team-row">
            <span className={`match-team-name ${match.winner === team2 ? "is-winner" : ""}`}>
              {match.winner === team2 && <IconTrophy size={14} style={{ color: "#15803d" }} />}
              <span>{team2 || "Team B (TBD)"}</span>
            </span>

            <div className="match-score-inputs">
              <div style={{ textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  className="score-num-field"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  placeholder="0"
                />
                <div className="score-sublabel">Runs</div>
              </div>
              <span style={{ fontWeight: 800 }}>/</span>
              <div style={{ textAlign: "center" }}>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="score-num-field"
                  value={team2Wickets}
                  onChange={(e) => setTeam2Wickets(e.target.value)}
                  placeholder="0"
                />
                <div className="score-sublabel">Wkts</div>
              </div>
            </div>
          </div>

          <div className="score-quick-buttons">
            <button className="score-inc-btn" onClick={() => addRunsTeam2(1)}>+1</button>
            <button className="score-inc-btn" onClick={() => addRunsTeam2(4)}>+4</button>
            <button className="score-inc-btn" onClick={() => addRunsTeam2(6)}>+6</button>
            <button className="score-inc-btn wicket" onClick={addWicketTeam2}>+W</button>
          </div>
        </div>
      </div>

      {match.winner && (
        <div className="winner-banner-badge">
          <IconTrophy size={14} />
          <span>Declared Winner: <strong>{match.winner}</strong></span>
        </div>
      )}

      <div className="match-card-controls">
        <div className="form-group">
          <label className="form-label" style={{ fontSize: "0.72rem" }}>Status</label>
          <select
            className="form-control"
            style={{ padding: "6px 10px", fontSize: "0.8rem" }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Upcoming">Upcoming</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ fontSize: "0.72rem" }}>Winner</label>
          <select
            className="form-control"
            style={{ padding: "6px 10px", fontSize: "0.8rem" }}
            value={match.winner || ""}
            onChange={(e) => onWinnerUpdate(match._id, e.target.value)}
          >
            <option value="">Select Winner</option>
            {team1 && <option value={team1}>{team1}</option>}
            {team2 && <option value={team2}>{team2}</option>}
          </select>
        </div>

        <button
          className="btn btn-coral btn-full btn-sm"
          onClick={handleLiveScoreSubmit}
          disabled={saving}
        >
          <IconLive size={14} />
          <span>{saving ? "Pushing Live..." : "Push Live Score"}</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={handleSaveDetails}
          disabled={saving}
        >
          Save Details
        </button>

        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => onDelete(match._id)}
        >
          <IconTrash size={14} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "-";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "-";
  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
