import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { IconLive, IconPlus, IconEdit, IconTrash } from "../components/common/Icons";
import Modal from "../components/common/Modal";
import {
  createLiveMatch,
  getAdminLiveMatches,
  updateLiveMatch,
  deleteLiveMatch,
} from "../services/api";

const BLANK_FORM = {
  matchName: "",
  format: "T20",
  overs: 20,
  venue: "",
  scheduledAt: "",
  teamA_name: "",
  teamA_short: "",
  teamB_name: "",
  teamB_short: "",
  status: "",
};

// A match card can come from LiveMatch ({ name, shortName }) or from the
// CompletedMatch archive ({ nameSnapshot, shortNameSnapshot }).
function teamFullName(team) {
  return (team && (team.name || team.nameSnapshot)) || "";
}
function teamShortName(team) {
  return (
    (team && (team.shortName || team.shortNameSnapshot || team.name || team.nameSnapshot)) || "—"
  );
}
function matchVenue(match) {
  return match.venue || match.venueSnapshot || "";
}

// ISO -> value for <input type="datetime-local">
function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LiveMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("LIVE");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null); // null = create mode
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchForm, setMatchForm] = useState(BLANK_FORM);

  const fetchMatches = useCallback(async () => {
    try {
      setMatchesLoading(true);
      setError("");
      const data = await getAdminLiveMatches();
      if (data.success) {
        const active = (data.active || []).map((m) => {
          if (m.state?.status === "UPCOMING" || m.state?.status === "CANCELLED") m._displayTab = "UPCOMING";
          else if (m.state?.status === "COMPLETED") m._displayTab = "COMPLETED";
          else m._displayTab = "LIVE";
          return m;
        });
        const completed = (data.completed || []).map((m) => ({
          ...m,
          _displayTab: "COMPLETED",
          state: m.state || { status: "COMPLETED" },
        }));
        setMatches([...active, ...completed]);
      }
    } catch (err) {
      setError(err.message || "Unable to load matches.");
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();

    const refresh = () => fetchMatches();
    socket.on("new-live-match", refresh);
    socket.on("match:scoreUpdated", refresh);
    socket.on("match:completed", refresh);
    socket.on("match:updated", refresh);
    socket.on("match:deleted", refresh);

    return () => {
      socket.off("new-live-match", refresh);
      socket.off("match:scoreUpdated", refresh);
      socket.off("match:completed", refresh);
      socket.off("match:updated", refresh);
      socket.off("match:deleted", refresh);
    };
  }, [fetchMatches]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMatchForm((current) => ({ ...current, [name]: value }));
  };

  function openCreateModal() {
    setEditingMatch(null);
    setMatchForm(BLANK_FORM);
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(match) {
    setEditingMatch(match);
    setMatchForm({
      matchName: match.matchName || "",
      format: match.format || "T20",
      overs: match.overs || 20,
      venue: matchVenue(match),
      scheduledAt: toLocalInput(match.scheduledAt),
      teamA_name: teamFullName(match.teamA),
      teamA_short: (match.teamA && (match.teamA.shortName || match.teamA.shortNameSnapshot)) || "",
      teamB_name: teamFullName(match.teamB),
      teamB_short: (match.teamB && (match.teamB.shortName || match.teamB.shortNameSnapshot)) || "",
      status: match.state?.status || "",
    });
    setError("");
    setIsModalOpen(true);
  }

  const handleSubmitMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const matchName = matchForm.matchName.trim();
    const venue = matchForm.venue.trim();
    const teamAName = matchForm.teamA_name.trim();
    const teamAShort = matchForm.teamA_short.trim();
    const teamBName = matchForm.teamB_name.trim();
    const teamBShort = matchForm.teamB_short.trim();
    const overs = Number(matchForm.overs);

    if (!matchName || !Number.isInteger(overs) || overs < 1 || !matchForm.scheduledAt ||
      !teamAName || !teamAShort || !teamBName || !teamBShort) {
      setError("Enter a title, valid overs, schedule, and both teams.");
      setLoading(false);
      return;
    }
    if (teamAName.toLowerCase() === teamBName.toLowerCase()) {
      setError("Team A and Team B must be different teams.");
      setLoading(false);
      return;
    }
    if (teamAShort.toLowerCase() === teamBShort.toLowerCase()) {
      setError("Team short names must be different.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        matchName,
        format: matchForm.format,
        overs,
        venue,
        scheduledAt: matchForm.scheduledAt,
        teamA: { name: teamAName, shortName: teamAShort },
        teamB: { name: teamBName, shortName: teamBShort },
      };

      if (editingMatch) {
        if (matchForm.status && ["UPCOMING", "CANCELLED"].includes(editingMatch.state?.status)) {
          payload.status = matchForm.status;
        }
        await updateLiveMatch(editingMatch._id, payload);
      } else {
        payload.teamA.players = [];
        payload.teamB.players = [];
        await createLiveMatch(payload);
        setActiveTab("UPCOMING");
      }

      setIsModalOpen(false);
      setEditingMatch(null);
      setMatchForm(BLANK_FORM);
      await fetchMatches();
    } catch (err) {
      if (err.routeMissing) {
        setError("Saving edits isn't available on the server yet — restart / redeploy the backend, then try again.");
      } else {
        setError(err.message || (editingMatch ? "Unable to update match." : "Unable to assign match."));
      }
    } finally {
      setLoading(false);
    }
  };

  async function handleDelete(match) {
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    setBusyId(match._id);
    setError("");
    try {
      await deleteLiveMatch(match._id);
      setMatches((prev) => prev.filter((m) => m._id !== match._id));
      await fetchMatches();
    } catch (err) {
      if (err.status === 404 && !err.routeMissing) {
        // The match was already removed elsewhere — drop it from the list.
        setMatches((prev) => prev.filter((m) => m._id !== match._id));
        await fetchMatches();
      } else if (err.routeMissing) {
        setError("Delete isn't available on the server yet — restart / redeploy the backend, then try again.");
      } else {
        setError(err.message || "Unable to delete this match.");
      }
    } finally {
      setBusyId("");
    }
  }

  const filteredMatches = matches.filter((m) => m._displayTab === activeTab);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Live Matches Console</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <IconPlus size={16} /> Assign Match
        </button>
      </div>

      <div className="filter-pills-group" style={{ marginBottom: "20px" }}>
        {["LIVE", "UPCOMING", "COMPLETED"].map((tab) => (
          <button
            key={tab}
            className={`filter-pill ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && <div className="alert-banner error" role="alert" style={{ marginBottom: "16px" }}>{error}</div>}

      <div className="card">
        {matchesLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>Loading matches...</div>
        ) : filteredMatches.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            <IconLive size={48} style={{ opacity: 0.5, marginBottom: "10px" }} />
            <h3>No matches found</h3>
            <p>Assign a new match to see it here.</p>
          </div>
        ) : (
          <div className="matches-grid" style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {filteredMatches.map((match) => (
              <div key={match._id} style={{ border: "1px solid #eee", padding: "16px", borderRadius: "8px", opacity: busyId === match._id ? 0.5 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>{match.format} • {match.overs} Overs</span>
                  <span style={{ fontSize: "12px", color: match.state?.status === "LIVE" ? "#f43f5e" : "#666", fontWeight: "bold" }}>{match.state?.status}</span>
                </div>
                <h4 style={{ margin: "0 0 4px 0" }}>{match.matchName}</h4>
                <div style={{ fontSize: "12px", color: "#888", marginBottom: "14px" }}>
                  {matchVenue(match) || "Venue TBA"}
                  {match.scheduledAt ? ` • ${new Date(match.scheduledAt).toLocaleString()}` : ""}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px" }}>
                  <div style={{ textAlign: "center" }}><strong>{teamShortName(match.teamA)}</strong></div>
                  <div style={{ color: "#999", fontSize: "14px" }}>vs</div>
                  <div style={{ textAlign: "center" }}><strong>{teamShortName(match.teamB)}</strong></div>
                </div>

                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  {activeTab !== "COMPLETED" && match.state?.status !== "CANCELLED" && (
                    <button className="btn btn-coral" style={{ flex: 1 }} onClick={() => navigate(`/live-matches/${match._id}/score`)}>Score Match</button>
                  )}
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(`/live-matches/${match._id}/score`)}>Details</button>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }} disabled={busyId === match._id} onClick={() => openEditModal(match)}>
                    <IconEdit size={14} /> Edit
                  </button>
                  <button className="btn btn-outline-danger btn-sm" style={{ flex: 1 }} disabled={busyId === match._id} onClick={() => handleDelete(match)}>
                    <IconTrash size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMatch ? "Edit Match" : "Assign New Live Match"}
      >
        <form onSubmit={handleSubmitMatch} className="admin-form">
          {error && <div className="alert-banner error" role="alert" style={{ marginBottom: "16px" }}>{error}</div>}

          <div className="form-group">
            <label>Match Title</label>
            <input name="matchName" value={matchForm.matchName} onChange={handleInputChange} required maxLength={120} placeholder="e.g. Final - Group A" className="form-control" />
          </div>

          <div className="form-row" style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Format</label>
              <select name="format" value={matchForm.format} onChange={handleInputChange} className="form-control">
                <option value="T20">T20</option>
                <option value="T10">T10</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Overs</label>
              <input type="number" name="overs" value={matchForm.overs} onChange={handleInputChange} min="1" max="100" step="1" required className="form-control" />
            </div>
          </div>

          <div className="form-row" style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Venue</label>
              <input name="venue" value={matchForm.venue} onChange={handleInputChange} className="form-control" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Scheduled Date &amp; Time</label>
              <input type="datetime-local" name="scheduledAt" value={matchForm.scheduledAt} onChange={handleInputChange} required className="form-control" />
            </div>
          </div>

          {editingMatch && ["UPCOMING", "CANCELLED"].includes(editingMatch.state?.status) && (
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={matchForm.status} onChange={handleInputChange} className="form-control">
                <option value="UPCOMING">Upcoming</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          )}

          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1, padding: "12px", border: "1px solid #eee", borderRadius: "8px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Team A</h4>
              <div className="form-group">
                <input name="teamA_name" value={matchForm.teamA_name} onChange={handleInputChange} required placeholder="Full Name" className="form-control" style={{ marginBottom: "8px" }} />
                <input name="teamA_short" value={matchForm.teamA_short} onChange={handleInputChange} required placeholder="Short Name (e.g. CSK)" className="form-control" />
              </div>
            </div>
            <div style={{ flex: 1, padding: "12px", border: "1px solid #eee", borderRadius: "8px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>Team B</h4>
              <div className="form-group">
                <input name="teamB_name" value={matchForm.teamB_name} onChange={handleInputChange} required placeholder="Full Name" className="form-control" style={{ marginBottom: "8px" }} />
                <input name="teamB_short" value={matchForm.teamB_short} onChange={handleInputChange} required placeholder="Short Name (e.g. MI)" className="form-control" />
              </div>
            </div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {editingMatch
                ? (loading ? "Saving..." : "Save Changes")
                : (loading ? "Assigning..." : "Assign Match")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
