import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { IconLive, IconPlus } from "../components/common/Icons";
import Modal from "../components/common/Modal";
import { createLiveMatch, getAdminLiveMatches } from "../services/api";

export default function LiveMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("LIVE");
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchForm, setMatchForm] = useState({
    matchName: "",
    format: "T20",
    overs: 20,
    venue: "",
    scheduledAt: "",
    teamA_name: "",
    teamA_short: "",
    teamB_name: "",
    teamB_short: "",
  });

  const fetchMatches = useCallback(async () => {
    try {
      setMatchesLoading(true);
      setError("");
      const data = await getAdminLiveMatches();
      if (data.success) {
        const active = (data.active || []).map((m) => {
          if (m.state?.status === "UPCOMING") m._displayTab = "UPCOMING";
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

    return () => {
      socket.off("new-live-match", refresh);
      socket.off("match:scoreUpdated", refresh);
      socket.off("match:completed", refresh);
    };
  }, [fetchMatches]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMatchForm((current) => ({ ...current, [name]: value }));
  };

  const handleAssignMatch = async (e) => {
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

    if (!matchName || !Number.isInteger(overs) || overs < 1 || !matchForm.scheduledAt || !teamAName || !teamAShort || !teamBName || !teamBShort) {
      setError("Enter a title, valid overs, schedule, and both teams before assigning the match.");
      setLoading(false);
      return;
    }

    if (teamAName.toLowerCase() === teamBName.toLowerCase()) {
      setError("Team A and Team B must be different teams.");
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
        teamA: { name: teamAName, shortName: teamAShort, players: [] },
        teamB: { name: teamBName, shortName: teamBShort, players: [] }
      };

      await createLiveMatch(payload);
      setIsAssignModalOpen(false);
      setMatchForm({ matchName: "", format: "T20", overs: 20, venue: "", scheduledAt: "", teamA_name: "", teamA_short: "", teamB_name: "", teamB_short: "" });
      setActiveTab("UPCOMING");
      await fetchMatches();
    } catch (err) {
      setError(err.message || "Unable to assign match.");
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(m => m._displayTab === activeTab);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Live Matches Console</h2>
        <button className="btn btn-primary" onClick={() => setIsAssignModalOpen(true)}>
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
            {filteredMatches.map(match => (
              <div key={match._id} style={{ border: "1px solid #eee", padding: "16px", borderRadius: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                   <span style={{ fontSize: "12px", color: "#666" }}>{match.format} • {match.overs} Overs</span>
                   <span style={{ fontSize: "12px", color: match.state?.status === "LIVE" ? "#f43f5e" : "#666", fontWeight: "bold" }}>{match.state?.status}</span>
                </div>
                <h4 style={{ margin: "0 0 16px 0" }}>{match.matchName}</h4>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div style={{ textAlign: "center" }}>
                     <strong>{match.teamA.shortName}</strong>
                  </div>
                  <div style={{ color: "#999", fontSize: "14px" }}>vs</div>
                  <div style={{ textAlign: "center" }}>
                     <strong>{match.teamB.shortName}</strong>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {activeTab !== "COMPLETED" && (
                    <button className="btn btn-coral" style={{ flex: 1 }} onClick={() => navigate(`/live-matches/${match._id}/score`)}>Score Match</button>
                  )}
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => navigate(`/live-matches/${match._id}/score`)}
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        title="Assign New Live Match"
      >
        <form onSubmit={handleAssignMatch} className="admin-form">
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
                <label>Scheduled Date & Time</label>
                <input type="datetime-local" name="scheduledAt" value={matchForm.scheduledAt} onChange={handleInputChange} required className="form-control" />
             </div>
          </div>

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
            <button type="button" className="btn btn-outline" onClick={() => setIsAssignModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Assigning..." : "Assign Match"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
