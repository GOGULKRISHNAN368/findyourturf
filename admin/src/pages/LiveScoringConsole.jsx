import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { IconArrowLeft } from "../components/common/Icons";
import { API_URL } from "../services/config";

export default function LiveScoringConsole() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [ballEvents, setBallEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [tossWinner, setTossWinner] = useState("Team A");
  const [tossDecision, setTossDecision] = useState("BAT");
  const [wicketType, setWicketType] = useState("Bowled");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const fetchMatchDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/api/live-matches/admin/${matchId}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setMatch(data.match);
        setBallEvents(data.ballEvents || []);
      } else {
        setError(data.error || "Unable to load match.");
      }
    } catch (err) {
      setError(err.message || "Unable to load match.");
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
    if (actionLoading || match?.state?.status !== "LIVE") return;
    setActionLoading(true);
    setError("");
    try {
      const payload = {
        runs,
        isBoundary,
        extras,
        isWicket,
        wicketDetails: isWicket ? { type: wicketType } : undefined,
      };

      const res = await fetch(`${API_URL}/api/live-matches/${matchId}/score`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        setError(data.error || data.message || `Scoring failed (${res.status})`);
        return;
      }
      if (data.match) setMatch(data.match);
      await fetchMatchDetails();
    } catch (err) {
      setError(err.message || "Network error while scoring.");
    } finally {
      setActionLoading(false);
    }
  };

  const undoLastBall = async () => {
    if (actionLoading || !ballEvents.length || !window.confirm("Undo the last delivery?")) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/live-matches/${matchId}/undo`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (data.match) {
        setMatch(data.match);
        await fetchMatchDetails();
      }
      else await fetchMatchDetails();
    } catch (err) {
      setError(err.message || "Unable to undo the last delivery.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading match data...</div>;
  if (!match) return <div style={{ padding: "40px", textAlign: "center" }}>{error || "Match not found."}</div>;

  const currentInnings = match.state.currentInnings === 1 ? match.score.firstInnings : match.score.secondInnings;
  const battingTeam = match.state.battingTeamId === "Team A" ? match.teamA : match.teamB;
  const recentBalls = ballEvents.slice(-12).reverse();

  return (
      <div style={{ padding: "20px" }}>
      {error && <div className="alert-banner error" role="alert">{error}</div>}
      <button className="btn btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: "20px" }}>
        <IconArrowLeft size={16} /> Back to Matches
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
              {battingTeam?.shortName || match.state.battingTeamId || "Toss not done"} Batting
            </div>
            <div style={{ fontSize: "48px", fontWeight: "bold", lineHeight: 1 }}>
              {currentInnings?.runs || 0} / {currentInnings?.wickets || 0}
            </div>
            <div style={{ fontSize: "20px", color: "#666", marginTop: "10px" }}>
              Overs: {Math.floor((currentInnings?.legalBalls || 0) / 6)}.{(currentInnings?.legalBalls || 0) % 6} <span style={{ fontSize: "14px", color: "#999" }}>({match.overs} max)</span>
            </div>
          </div>

          {match.state.currentInnings === 2 && match.target && (
             <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#f9f9f9", borderRadius: "8px", color: "#666" }}>
                Target: <strong>{match.target}</strong>
             </div>
          )}

          {recentBalls.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h4>Recent deliveries</h4>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                {recentBalls.map((ball) => (
                  <span key={ball._id} className="filter-pill active">
                    {ball.isWicket ? "W" : ball.extras?.type ? `${ball.extras.type}${ball.extras.runs || ""}` : ball.runsOffBat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SCORING CONTROLS */}
        <div className="card" style={{ flex: 2 }}>
          <h3 style={{ margin: "0 0 20px 0" }}>Scoring Panel</h3>
          <div style={{ marginBottom: "20px" }}>
            <label>Wicket type
              <select value={wicketType} onChange={(e) => setWicketType(e.target.value)} disabled={actionLoading} style={{ display: "block" }}>
                {["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retired", "Other"].map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
          </div>
          
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Runs</h4>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[0, 1, 2, 3].map(run => (
                <button disabled={actionLoading} key={run} className="btn btn-outline" style={{ width: "60px", height: "60px", fontSize: "20px" }} onClick={() => scoreBall(run)}>
                  {run}
                </button>
              ))}
              <button disabled={actionLoading} className="btn btn-primary" style={{ width: "60px", height: "60px", fontSize: "20px" }} onClick={() => scoreBall(4, null, false, true)}>4</button>
              <button disabled={actionLoading} className="btn btn-primary" style={{ width: "60px", height: "60px", fontSize: "20px" }} onClick={() => scoreBall(6, null, false, true)}>6</button>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "14px", color: "#666", marginBottom: "12px" }}>Extras & Wickets</h4>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button disabled={actionLoading} className="btn btn-outline" style={{ flex: 1, backgroundColor: "#fff8e1" }} onClick={() => scoreBall(0, { type: "WD", runs: 1 })}>Wide (WD)</button>
              <button disabled={actionLoading} className="btn btn-outline" style={{ flex: 1, backgroundColor: "#fff8e1" }} onClick={() => scoreBall(0, { type: "NB", runs: 1 })}>No Ball (NB)</button>
              <button disabled={actionLoading} className="btn btn-outline" style={{ flex: 1, backgroundColor: "#e3f2fd" }} onClick={() => scoreBall(0, { type: "LB", runs: 1 })}>Leg Bye (LB)</button>
              <button disabled={actionLoading} className="btn btn-outline" style={{ flex: 1, backgroundColor: "#e3f2fd" }} onClick={() => scoreBall(0, { type: "B", runs: 1 })}>Bye (B)</button>
              <button disabled={actionLoading} className="btn btn-coral" style={{ flex: 1, color: "#fff" }} onClick={() => scoreBall(0, null, true)}>WICKET</button>
            </div>
          </div>
          
          <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "24px 0" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button disabled={actionLoading || ballEvents.length === 0} className="btn btn-outline" style={{ color: "#f43f5e", borderColor: "#f43f5e" }} onClick={undoLastBall}>
              Undo Last Delivery
            </button>

            {match.state.status === "UPCOMING" && (
              <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
                <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Toss winner
                  <select value={tossWinner} onChange={(event) => setTossWinner(event.target.value)} disabled={actionLoading}>
                    <option value="Team A">Team A</option>
                    <option value="Team B">Team B</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 600 }}>
                  Decision
                  <select value={tossDecision} onChange={(event) => setTossDecision(event.target.value)} disabled={actionLoading}>
                    <option value="BAT">Bat</option>
                    <option value="BOWL">Bowl</option>
                  </select>
                </label>
                <button disabled={actionLoading} className="btn btn-primary" onClick={async () => {
                  setActionLoading(true);
                  setError("");
                  try {
                    const battingTeam = tossDecision === "BAT" ? tossWinner : (tossWinner === "Team A" ? "Team B" : "Team A");
                    const bowlingTeam = battingTeam === "Team A" ? "Team B" : "Team A";
                    const res = await fetch(`${API_URL}/api/live-matches/${matchId}/state`, {
                      method: "POST", headers: authHeaders(),
                      body: JSON.stringify({ toss: { wonBy: tossWinner, decision: tossDecision }, state: { status: "LIVE", battingTeamId: battingTeam, bowlingTeamId: bowlingTeam }})
                    });
                    const data = await res.json().catch(() => ({}));
                    if (data.match) setMatch(data.match);
                    else setError(data.error || data.message || "Unable to start match.");
                  } catch (err) {
                    setError(err.message || "Unable to start match.");
                  } finally {
                    setActionLoading(false);
                  }
                }}>
                  Start Match
                </button>
              </div>
            )}

            {match.state.status === "INNINGS_BREAK" && (
              <button disabled={actionLoading} className="btn btn-primary" onClick={async () => {
                setActionLoading(true);
                setError("");
                const res = await fetch(`${API_URL}/api/live-matches/${matchId}/state`, {
                  method: "POST", headers: authHeaders(),
                  body: JSON.stringify({ state: { status: "LIVE" } }),
                });
                const data = await res.json().catch(() => ({}));
                if (data.match) setMatch(data.match);
                else setError(data.error || data.message || "Unable to start second innings.");
                setActionLoading(false);
              }}>
                Start 2nd Innings
              </button>
            )}

            {match.state.status !== "UPCOMING" && match.state.status !== "COMPLETED" && (
              <button
                disabled={actionLoading}
                className="btn btn-outline"
                onClick={async () => {
                  if (!window.confirm("End this match and publish the result?")) return;
                  setActionLoading(true);
                  setError("");
                  try {
                    const res = await fetch(`${API_URL}/api/live-matches/${matchId}/complete`, { method: "POST", headers: authHeaders() });
                    const data = await res.json().catch(() => ({}));
                    if (data.success) navigate(-1);
                    else setError(data.error || "Could not complete match");
                  } catch (err) {
                    setError(err.message || "Could not complete match");
                  } finally {
                    setActionLoading(false);
                  }
                }}
              >
                End Match
              </button>
            )}
          </div>

          {match.state.status === "COMPLETED" && (
            <div style={{ marginTop: 16, padding: 12, background: "#eef8f0", color: "#157f3b", borderRadius: 8, fontWeight: 600, textAlign: "center" }}>
              {match.resultText || `${match.winner || "Match"} — completed`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
