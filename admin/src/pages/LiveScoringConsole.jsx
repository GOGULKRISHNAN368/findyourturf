import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { IconChevronLeft } from "../components/common/Icons";
import { API_URL } from "../services/config";

export default function LiveScoringConsole() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMatchDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/live-matches/admin/${matchId}`);
      const data = await response.json();
      if (data.success) {
        setMatch(data.match);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchDetails();

    const handleScoreUpdated = (update) => {
      if (update._id === matchId) {
        setMatch(update);
      }
    };

    socket.on("match:scoreUpdated", handleScoreUpdated);
    return () => {
      socket.off("match:scoreUpdated", handleScoreUpdated);
    };
  }, [matchId]);

  const scoreBall = async (runs, extras = null, isWicket = false, isBoundary = false) => {
    try {
      const payload = { runs, isBoundary, extras, isWicket };
      
      const res = await fetch(`${API_URL}/api/live-matches/${matchId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) alert("Error scoring ball");
    } catch (err) {
      console.error(err);
    }
  };

  const undoLastBall = async () => {
    try {
      await fetch(`${API_URL}/api/live-matches/${matchId}/undo`, { method: "POST" });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading match data...</div>;
  if (!match) return <div style={{ padding: "40px", textAlign: "center" }}>Match not found.</div>;

  const currentInnings = match.state.currentInnings === 1 ? match.score.firstInnings : match.score.secondInnings;
  const battingTeam = match.state.battingTeamId === "Team A" ? match.teamA : match.teamB;
  const bowlingTeam = match.state.battingTeamId === "Team A" ? match.teamB : match.teamA;

  return (
    <div style={{ padding: "20px" }}>
      <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
        <IconChevronLeft size={16} /> Back to Matches
      </button>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* SCORECARD WIDGET */}
        <div className="card" style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0 }}>{match.matchName}</h3>
            <span className="filter-pill active" style={{ backgroundColor: "#f43f5e", color: "#fff", border: "none" }}>{match.state.status}</span>
          </div>

          <div style={{ textAlign: "center", margin: "30px 0" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
              {battingTeam.shortName || match.state.battingTeamId || "Toss not done"} Batting
            </div>
            <div style={{ fontSize: "48px", fontWeight: "bold", lineHeight: 1 }}>
              {currentInnings.runs} / {currentInnings.wickets}
            </div>
            <div style={{ fontSize: "20px", color: "#666", marginTop: "10px" }}>
              Overs: {Math.floor(currentInnings.legalBalls / 6)}.{currentInnings.legalBalls % 6} <span style={{ fontSize: "14px", color: "#999" }}>({match.overs} max)</span>
            </div>
          </div>

          {match.state.currentInnings === 2 && match.target && (
             <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px", color: "#666" }}>
                Target: <strong>{match.target}</strong>
             </div>
          )}
        </div>

        {/* SCORING CONTROLS */}
        <div className="card" style={{ flex: 2 }}>
          <h3 style={{ margin: "0 0 20px 0" }}>Scoring Panel</h3>
          
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Runs</h4>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[0, 1, 2, 3].map(run => (
                <button key={run} className="btn btn-outline" style={{ width: "60px", height: "60px", fontSize: "20px" }} onClick={() => scoreBall(run)}>
                  {run}
                </button>
              ))}
              <button className="btn btn-primary" style={{ width: "60px", height: "60px", fontSize: "20px" }} onClick={() => scoreBall(4, null, false, true)}>4</button>
              <button className="btn btn-primary" style={{ width: "60px", height: "60px", fontSize: "20px" }} onClick={() => scoreBall(6, null, false, true)}>6</button>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Extras & Wickets</h4>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button className="btn btn-outline" style={{ flex: 1, backgroundColor: "#fff8e1" }} onClick={() => scoreBall(0, { type: "WD", runs: 1 })}>Wide (WD)</button>
              <button className="btn btn-outline" style={{ flex: 1, backgroundColor: "#fff8e1" }} onClick={() => scoreBall(0, { type: "NB", runs: 1 })}>No Ball (NB)</button>
              <button className="btn btn-outline" style={{ flex: 1, backgroundColor: "#e3f2fd" }} onClick={() => scoreBall(0, { type: "LB", runs: 1 })}>Leg Bye (LB)</button>
              <button className="btn btn-outline" style={{ flex: 1, backgroundColor: "#e3f2fd" }} onClick={() => scoreBall(0, { type: "B", runs: 1 })}>Bye (B)</button>
              <button className="btn btn-coral" style={{ flex: 1, color: "#fff" }} onClick={() => scoreBall(0, null, true)}>WICKET</button>
            </div>
          </div>
          
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "24px 0" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="btn btn-outline" style={{ color: "#f43f5e", borderColor: "#f43f5e" }} onClick={undoLastBall}>
              Undo Last Ball
            </button>
            
            {match.state.status === "UPCOMING" && (
              <button className="btn btn-primary" onClick={async () => {
                await fetch(`${API_URL}/api/live-matches/${matchId}/state`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ toss: { wonBy: "Team A", decision: "BAT" }, state: { status: "LIVE", battingTeamId: "Team A", bowlingTeamId: "Team B" }})
                });
              }}>
                Start Match (Team A Batting)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
