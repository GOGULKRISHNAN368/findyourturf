import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getTournament,
  assignTeams,
  editTeam,
  deleteTeam,
  updateLiveScore,
  setMatchWinner,
  createMatch,
  updateMatch,
  deleteMatch,
} from "../services/api";

const EMPTY_TOURNAMENT = {
  teams: [],
  matches: [],
  winner1: null,
  winner2: null,
};

const ROUNDS = ["Round 1", "Round 2", "Semi Final", "Final"];

export default function TournamentManagement() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(EMPTY_TOURNAMENT);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingTeams, setSavingTeams] = useState(false);
  const [savingMatch, setSavingMatch] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newRound, setNewRound] = useState("Round 1");
  const [newTeam1, setNewTeam1] = useState("");
  const [newTeam2, setNewTeam2] = useState("");

  const isPersisted = Boolean(tournament?._id);
  const teams = tournament?.teams || [];
  const matches = tournament?.matches || [];

  const loadTournament = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      setError("");
      const data = await getTournament(eventId);
      setTournament(data || EMPTY_TOURNAMENT);
    } catch (err) {
      setError(err.message || "Unable to load tournament.");
      setTournament(EMPTY_TOURNAMENT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTournament();
  }, [eventId]);

  const handleAddTeam = () => {
    const trimmedName = teamName.trim();

    if (!trimmedName) {
      setError("Enter a valid team name.");
      return;
    }

    if (
      teams.some((team) => team.toLowerCase() === trimmedName.toLowerCase())
    ) {
      setError("Team already exists.");
      return;
    }

    setError("");
    setTournament((prev) => ({
      ...(prev || EMPTY_TOURNAMENT),
      teams: [...(prev?.teams || []), trimmedName],
    }));
    setTeamName("");
  };

  const handleSaveTeams = async () => {
    if (!eventId || savingTeams) return;

    if (teams.length < 1) {
      setError("Add at least one team.");
      return;
    }

    try {
      setSavingTeams(true);
      setError("");
      setMessage("");
      const data = await assignTeams(eventId, teams);
      setTournament(data.tournament || data);
      setMessage("Teams saved. Matches are not created automatically.");
    } catch (err) {
      setError(err.message || "Failed to save teams");
    } finally {
      setSavingTeams(false);
    }
  };

  const handleEditTeam = async (team) => {
    const newName = window.prompt("Enter new team name:", team);
    if (newName === null) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError("Team name cannot be empty.");
      return;
    }
    if (trimmedName === team) return;

    if (
      teams.some(
        (item) =>
          item.toLowerCase() === trimmedName.toLowerCase() && item !== team
      )
    ) {
      setError("A team with this name already exists.");
      return;
    }

    if (!isPersisted) {
      setTournament((prev) => ({
        ...prev,
        teams: (prev.teams || []).map((item) =>
          item === team ? trimmedName : item
        ),
      }));
      return;
    }

    try {
      const data = await editTeam(eventId, team, trimmedName);
      setTournament(data.tournament || data);
      setMessage("Team updated.");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to edit team");
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Delete ${team}?`)) return;

    if (!isPersisted) {
      setTournament((prev) => ({
        ...prev,
        teams: (prev.teams || []).filter((item) => item !== team),
      }));
      return;
    }

    try {
      const data = await deleteTeam(eventId, team);
      setTournament(data.tournament || data);
      setMessage("Team deleted.");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to delete team");
    }
  };

  const handleCreateMatch = async () => {
    if (savingMatch) return;

    if (newTeam1 && newTeam2 && newTeam1 === newTeam2) {
      setError("Team A and Team B cannot be the same team.");
      return;
    }

    try {
      setSavingMatch(true);
      setError("");
      setMessage("");

      let current = tournament;

      if (!isPersisted) {
        if (teams.length < 1) {
          setError("Save teams before creating a match.");
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
      setMessage("Match saved.");
    } catch (err) {
      setError(err.message || "Failed to create match");
    } finally {
      setSavingMatch(false);
    }
  };

  const handleUpdateMatch = async (matchId, payload) => {
    try {
      const data = await updateMatch(eventId, matchId, payload);
      setTournament(data.tournament || data);
      setMessage("Match updated.");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to update match");
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm("Delete this match?")) return;

    try {
      const data = await deleteMatch(eventId, matchId);
      setTournament(data.tournament || data);
      setMessage("Match deleted.");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to delete match");
    }
  };

  const handleScoreUpdate = async (
    matchId,
    team1Score,
    team1Wickets,
    team2Score,
    team2Wickets,
    status
  ) => {
    try {
      const data = await updateLiveScore(eventId, matchId, {
        team1Score: Number(team1Score) || 0,
        team1Wickets: Number(team1Wickets) || 0,
        team2Score: Number(team2Score) || 0,
        team2Wickets: Number(team2Wickets) || 0,
        status,
      });
      setTournament(data.tournament || data);
      setMessage("Live score updated.");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to update score");
      throw err;
    }
  };

  const handleWinner = async (matchId, winner) => {
    try {
      const data = await setMatchWinner(eventId, matchId, winner);
      setTournament(data.tournament || data);
      setMessage(winner ? "Winner updated." : "Winner cleared.");
      setError("");
    } catch (err) {
      setError(err.message || "Failed to set winner");
    }
  };

  if (!eventId) {
    return (
      <div style={styles.empty}>
        <h2>Event not found</h2>
        <p>No event ID was provided.</p>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.empty}>Loading tournament...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <button style={styles.backButton} onClick={() => navigate("/admin")}>
            ← Back to Dashboard
          </button>
          <span style={styles.pageLabel}>TOURNAMENT MANAGEMENT</span>
          <h1 style={styles.title}>Tournament Management</h1>
          <p style={styles.subtitle}>
            Manually create matches, assign teams, and select winners.
          </p>
        </div>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <span style={styles.sectionLabel}>TEAMS</span>
            <h2 style={styles.sectionTitle}>Assign Teams</h2>
          </div>
          <span style={styles.teamCount}>{teams.length} Teams</span>
        </div>

        <div style={styles.addRow}>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTeam();
            }}
            placeholder="Enter team name"
            style={styles.input}
          />
          <button onClick={handleAddTeam} style={styles.button}>
            + Add Team
          </button>
        </div>

        {teams.length === 0 ? (
          <div style={styles.emptySmall}>
            <div style={styles.emptyIcon}>👥</div>
            <strong>No teams assigned</strong>
            <p>Add teams, then create matches manually.</p>
          </div>
        ) : (
          <div style={styles.teamGrid}>
            {teams.map((team, index) => (
              <div key={`${team}-${index}`} style={styles.teamCard}>
                <div style={styles.teamInfo}>
                  <div style={styles.teamNumber}>{index + 1}</div>
                  <strong>{team}</strong>
                </div>
                <div>
                  <button
                    onClick={() => handleEditTeam(team)}
                    style={styles.smallButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSaveTeams}
          disabled={savingTeams}
          style={styles.generateButton}
        >
          {savingTeams ? "Saving..." : "Save Teams"}
        </button>

        <p style={styles.helperText}>
          Saving teams does not create matches. Use Add Match below to pair
          teams by round.
        </p>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <span style={styles.sectionLabel}>ADD MATCH</span>
            <h2 style={styles.sectionTitle}>Create Match</h2>
          </div>
        </div>

        <div style={styles.addMatchRow}>
          <div>
            <label style={styles.controlLabel}>Select Round</label>
            <select
              value={newRound}
              onChange={(e) => setNewRound(e.target.value)}
              style={styles.select}
            >
              {ROUNDS.map((round) => (
                <option key={round} value={round}>
                  {round}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.controlLabel}>Select Team A</label>
            <select
              value={newTeam1}
              onChange={(e) => setNewTeam1(e.target.value)}
              style={styles.select}
            >
              <option value="">TBD</option>
              {teams.map((team) => (
                <option key={`a-${team}`} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.controlLabel}>Select Team B</label>
            <select
              value={newTeam2}
              onChange={(e) => setNewTeam2(e.target.value)}
              style={styles.select}
            >
              <option value="">TBD</option>
              {teams.map((team) => (
                <option key={`b-${team}`} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={savingMatch}
            style={styles.generateButton}
          >
            {savingMatch ? "Saving..." : "Add Match"}
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <span style={styles.sectionLabel}>RESULTS</span>
            <h2 style={styles.sectionTitle}>Winners</h2>
          </div>
        </div>

        <div style={styles.winnerGrid}>
          <div style={styles.winnerCard}>
            <div style={styles.winnerIcon}>🏆</div>
            <div>
              <span style={styles.winnerLabel}>Round 1 Winner 1</span>
              <strong style={styles.winnerName}>
                {tournament?.winner1 || "Waiting..."}
              </strong>
            </div>
          </div>
          <div style={styles.winnerCard}>
            <div style={styles.winnerIcon}>🏆</div>
            <div>
              <span style={styles.winnerLabel}>Round 1 Winner 2</span>
              <strong style={styles.winnerName}>
                {tournament?.winner2 || "Waiting..."}
              </strong>
            </div>
          </div>
          <div style={styles.winnerCard}>
            <div style={styles.winnerIcon}>🏆</div>
            <div>
              <span style={styles.winnerLabel}>Champion</span>
              <strong style={styles.winnerName}>
                {tournament?.champion || "Waiting..."}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <span style={styles.sectionLabel}>BRACKET</span>
            <h2 style={styles.sectionTitle}>Matches</h2>
          </div>
          <span style={styles.matchCount}>{matches.length} Matches</span>
        </div>

        {matches.length === 0 ? (
          <div style={styles.emptySmall}>
            <div style={styles.emptyIcon}>🏏</div>
            <strong>No matches created</strong>
            <p>Use Add Match to create Round 1, Round 2, Semi Final or Final.</p>
          </div>
        ) : (
          ROUNDS.map((round) => {
            const roundMatches = matches
              .filter((match) => match.round === round)
              .sort((a, b) => a.matchNumber - b.matchNumber);

            return (
              <div key={round} style={styles.roundBlock}>
                <h3 style={styles.roundHeading}>{round}</h3>
                {roundMatches.length === 0 ? (
                  <p style={styles.helperText}>
                    No matches in this round yet.
                  </p>
                ) : (
                  <div style={styles.bracketGrid}>
                    {roundMatches.map((match) => (
                      <MatchCard
                        key={match._id}
                        match={match}
                        teams={teams}
                        onScoreUpdate={handleScoreUpdate}
                        onWinner={handleWinner}
                        onSave={handleUpdateMatch}
                        onDelete={handleDeleteMatch}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function MatchCard({
  match,
  teams,
  onScoreUpdate,
  onWinner,
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

  const handleLiveScore = async () => {
    try {
      setSaving(true);
      await onScoreUpdate(
        match._id,
        team1Score,
        team1Wickets,
        team2Score,
        team2Wickets,
        status
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMatch = async () => {
    if (team1 && team2 && team1 === team2) {
      return;
    }

    try {
      setSaving(true);
      await onSave(match._id, { team1, team2, round });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.matchCard}>
      <div style={styles.matchHeader}>
        <div>
          <span style={styles.roundLabel}>{match.round}</span>
          <strong style={styles.matchTitle}>Match {match.matchNumber}</strong>
        </div>
        <span
          style={{
            ...styles.statusBadge,
            ...(status === "Live"
              ? styles.liveStatus
              : status === "Completed"
              ? styles.completedStatus
              : styles.upcomingStatus),
          }}
        >
          {status === "Live" && "● "}
          {status}
        </span>
      </div>

      <div style={styles.editRow}>
        <div>
          <label style={styles.controlLabel}>Select Round</label>
          <select
            value={round}
            onChange={(e) => setRound(e.target.value)}
            style={styles.select}
          >
            {ROUNDS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={styles.controlLabel}>Select Team A</label>
          <select
            value={team1}
            onChange={(e) => setTeam1(e.target.value)}
            style={styles.select}
          >
            <option value="">TBD</option>
            {teams.map((team) => (
              <option key={`edit-a-${team}`} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={styles.controlLabel}>Select Team B</label>
          <select
            value={team2}
            onChange={(e) => setTeam2(e.target.value)}
            style={styles.select}
          >
            <option value="">TBD</option>
            {teams.map((team) => (
              <option key={`edit-b-${team}`} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.teams}>
        <div style={styles.teamScoreBox}>
          <h3 style={styles.matchTeam}>{team1 || "TBD"}</h3>
          <div style={styles.scoreRow}>
            <div>
              <label style={styles.scoreLabel}>Runs</label>
              <input
                type="number"
                min="0"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
                style={styles.scoreInput}
              />
            </div>
            <div>
              <label style={styles.scoreLabel}>Wickets</label>
              <input
                type="number"
                min="0"
                value={team1Wickets}
                onChange={(e) => setTeam1Wickets(e.target.value)}
                style={styles.scoreInput}
              />
            </div>
          </div>
        </div>

        <div style={styles.vs}>VS</div>

        <div style={styles.teamScoreBox}>
          <h3 style={styles.matchTeam}>{team2 || "TBD"}</h3>
          <div style={styles.scoreRow}>
            <div>
              <label style={styles.scoreLabel}>Runs</label>
              <input
                type="number"
                min="0"
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
                style={styles.scoreInput}
              />
            </div>
            <div>
              <label style={styles.scoreLabel}>Wickets</label>
              <input
                type="number"
                min="0"
                value={team2Wickets}
                onChange={(e) => setTeam2Wickets(e.target.value)}
                style={styles.scoreInput}
              />
            </div>
          </div>
        </div>
      </div>

      {match.winner && (
        <div style={styles.winnerBanner}>🏆 Winner: {match.winner}</div>
      )}

      <div style={styles.controls}>
        <div>
          <label style={styles.controlLabel}>Match Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={styles.select}
          >
            <option value="Upcoming">Upcoming</option>
            <option value="Live">Live</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button
          onClick={handleLiveScore}
          disabled={saving}
          style={styles.liveButton}
        >
          {saving ? "Updating..." : "🔴 Live Score"}
        </button>

        <div>
          <label style={styles.controlLabel}>Select Winner</label>
          <select
            value={match.winner || ""}
            onChange={(e) => onWinner(match._id, e.target.value)}
            style={styles.select}
          >
            <option value="">Select Winner</option>
            {team1 && <option value={team1}>{team1}</option>}
            {team2 && <option value={team2}>{team2}</option>}
          </select>
        </div>

        <button
          onClick={handleSaveMatch}
          disabled={saving || (team1 && team2 && team1 === team2)}
          style={styles.smallButton}
        >
          Save changes
        </button>

        <button
          onClick={() => onDelete(match._id)}
          style={styles.deleteButton}
        >
          Delete Match
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "40px",
    background: "#f6f8fb",
    color: "#172033",
    boxSizing: "border-box",
  },
  pageHeader: {
    maxWidth: "1200px",
    margin: "0 auto 30px",
  },
  backButton: {
    display: "inline-block",
    marginBottom: "16px",
    padding: "8px 0",
    border: "none",
    background: "transparent",
    color: "#237542",
    fontWeight: "700",
    cursor: "pointer",
  },
  pageLabel: {
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#667085",
  },
  title: {
    margin: "8px 0",
    fontSize: "32px",
    fontWeight: "800",
  },
  subtitle: {
    margin: 0,
    color: "#667085",
  },
  success: {
    maxWidth: "1200px",
    margin: "0 auto 16px",
    padding: "12px 16px",
    background: "#eaf7ee",
    color: "#237542",
    borderRadius: "8px",
    fontWeight: "700",
  },
  error: {
    maxWidth: "1200px",
    margin: "0 auto 16px",
    padding: "12px 16px",
    background: "#fff0f0",
    color: "#bd3333",
    borderRadius: "8px",
    fontWeight: "700",
  },
  section: {
    maxWidth: "1200px",
    margin: "0 auto 24px",
    padding: "26px",
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: "16px",
    boxSizing: "border-box",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#667085",
  },
  sectionTitle: {
    margin: "5px 0 0",
    fontSize: "22px",
  },
  teamCount: {
    padding: "7px 12px",
    borderRadius: "20px",
    background: "#f2f4f7",
    fontSize: "13px",
    fontWeight: "600",
  },
  matchCount: {
    padding: "7px 12px",
    borderRadius: "20px",
    background: "#f2f4f7",
    fontSize: "13px",
    fontWeight: "600",
  },
  addRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  addMatchRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    alignItems: "flex-end",
  },
  editRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "18px",
  },
  input: {
    flex: 1,
    maxWidth: "450px",
    padding: "13px 15px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "9px",
    background: "#172033",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  teamGrid: {
    display: "grid",
    gap: "10px",
  },
  teamCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "13px 15px",
    border: "1px solid #eaecf0",
    borderRadius: "10px",
    background: "#ffffff",
  },
  teamInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  teamNumber: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f2f4f7",
    fontSize: "13px",
    fontWeight: "700",
  },
  smallButton: {
    padding: "7px 12px",
    marginRight: "7px",
    border: "1px solid #d0d5dd",
    borderRadius: "7px",
    background: "#ffffff",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "7px 12px",
    border: "1px solid #f04438",
    borderRadius: "7px",
    background: "#ffffff",
    color: "#d92d20",
    cursor: "pointer",
  },
  generateButton: {
    marginTop: "20px",
    padding: "13px 20px",
    border: "none",
    borderRadius: "9px",
    background: "#111827",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  helperText: {
    margin: "10px 0 0",
    fontSize: "12px",
    color: "#667085",
  },
  emptySmall: {
    padding: "30px",
    textAlign: "center",
    border: "1px dashed #d0d5dd",
    borderRadius: "12px",
    color: "#667085",
  },
  emptyIcon: {
    fontSize: "30px",
    marginBottom: "8px",
  },
  winnerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "18px",
  },
  winnerCard: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "20px",
    border: "1px solid #eaecf0",
    borderRadius: "12px",
    background: "#fafafa",
  },
  winnerIcon: {
    fontSize: "30px",
  },
  winnerLabel: {
    display: "block",
    fontSize: "12px",
    color: "#667085",
    marginBottom: "5px",
  },
  winnerName: {
    display: "block",
    fontSize: "18px",
  },
  roundBlock: {
    marginBottom: "28px",
  },
  roundHeading: {
    margin: "0 0 14px",
    fontSize: "18px",
  },
  bracketGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "18px",
  },
  matchGrid: {
    display: "grid",
    gap: "18px",
  },
  matchCard: {
    padding: "22px",
    border: "1px solid #e4e7ec",
    borderRadius: "14px",
    background: "#ffffff",
  },
  matchHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },
  roundLabel: {
    display: "block",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#667085",
    marginBottom: "4px",
  },
  matchTitle: {
    fontSize: "18px",
  },
  statusBadge: {
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
  },
  liveStatus: {
    background: "#fee4e2",
    color: "#d92d20",
  },
  completedStatus: {
    background: "#ecfdf3",
    color: "#027a48",
  },
  upcomingStatus: {
    background: "#f2f4f7",
    color: "#475467",
  },
  teams: {
    display: "grid",
    gridTemplateColumns: "1fr 70px 1fr",
    gap: "20px",
    alignItems: "center",
  },
  teamScoreBox: {
    padding: "18px",
    border: "1px solid #eaecf0",
    borderRadius: "12px",
    background: "#fafafa",
  },
  matchTeam: {
    margin: "0 0 16px",
    fontSize: "18px",
  },
  scoreRow: {
    display: "flex",
    gap: "12px",
  },
  scoreLabel: {
    display: "block",
    fontSize: "11px",
    color: "#667085",
    marginBottom: "5px",
  },
  scoreInput: {
    width: "80px",
    padding: "9px",
    border: "1px solid #d0d5dd",
    borderRadius: "7px",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  vs: {
    textAlign: "center",
    fontWeight: "800",
    color: "#667085",
  },
  winnerBanner: {
    marginTop: "12px",
    padding: "12px",
    borderRadius: "10px",
    background: "#ecfdf3",
    color: "#027a48",
    fontWeight: "700",
  },
  controls: {
    display: "flex",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "20px",
    paddingTop: "18px",
    borderTop: "1px solid #eaecf0",
  },
  controlLabel: {
    display: "block",
    fontSize: "11px",
    color: "#667085",
    marginBottom: "5px",
  },
  select: {
    padding: "9px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: "7px",
    background: "#ffffff",
    minWidth: "150px",
  },
  liveButton: {
    padding: "10px 17px",
    border: "none",
    borderRadius: "8px",
    background: "#d92d20",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
  },
  empty: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f8fb",
    color: "#172033",
  },
};
