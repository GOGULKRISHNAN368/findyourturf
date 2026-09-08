import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, PlayCircle, RefreshCw, Radio, Trophy, Clock } from "lucide-react";
import { getMatchScorecard } from "../services/api";
import { socket } from "../services/socket";
import Navbar from "../components/Navbar";

function overs(value = 0) {
  return `${Math.floor(value / 6)}.${value % 6}`;
}

function teamName(team, fallback) {
  return team?.name || team?.shortName || team?.nameSnapshot || team?.shortNameSnapshot || fallback;
}

export default function PublicMatchScorecard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      setMatch(await getMatchScorecard(id));
    } catch (err) {
      setError(err.message || "Unable to load scorecard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const refresh = (updated) => {
      if (String(updated?._id) === String(id)) setMatch(updated);
    };
    socket.on("match:scoreUpdated", refresh);
    return () => socket.off("match:scoreUpdated", refresh);
  }, [id]);

  if (loading) {
    return (
      <div className="fyt-app-shell">
        <Navbar />
        <main className="fyt-main-content">
          <div className="fyt-container" style={{ padding: "60px 16px", textAlign: "center" }}>
            <div className="fyt-loading-spinner" />
            <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>Loading live scorecard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="fyt-app-shell">
        <Navbar />
        <main className="fyt-main-content">
          <div className="fyt-container" style={{ padding: "60px 16px", textAlign: "center" }}>
            <h2>Match Not Found</h2>
            <p style={{ color: "var(--text-secondary)", margin: "12px 0 24px" }}>
              {error || "This match scorecard is not available."}
            </p>
            <button className="fyt-btn-primary" onClick={load}>
              <RefreshCw size={15} style={{ marginRight: 6 }} /> Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const first = match.score?.firstInnings || match.scorecards?.firstInnings || {};
  const second = match.score?.secondInnings || match.scorecards?.secondInnings || {};
  const liveTeam = match.state?.battingTeamId === "Team B" ? match.teamB : match.teamA;
  const firstSlot = match.state?.currentInnings === 2 ? match.state?.bowlingTeamId : match.state?.battingTeamId;
  const secondSlot = firstSlot === "Team A" ? "Team B" : "Team A";
  const firstTeam = first.team || teamName(firstSlot === "Team B" ? match.teamB : match.teamA, "Team A");
  const secondTeam = second.team || teamName(secondSlot === "Team B" ? match.teamB : match.teamA, "Team B");
  const firstOvers = first.oversDisplay || overs(first.legalBalls);
  const secondOvers = second.oversDisplay || overs(second.legalBalls);

  return (
    <div className="fyt-app-shell">
      <Navbar />

      <main className="fyt-main-content" style={{ paddingBottom: 60 }}>
        <div className="fyt-container" style={{ maxWidth: 760 }}>
          {/* Back Navigation */}
          <div className="fyt-td-nav-bar">
            <button className="fyt-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
              <ArrowLeft size={18} />
              <span>Back to Matches</span>
            </button>
            <div className="fyt-scorecard-live-tag">
              <Radio size={14} />
              <span>{match.state?.status || "LIVE SCORECARD"}</span>
            </div>
          </div>

          {/* Main Score Card */}
          <div className="fyt-card fyt-scorecard-card">
            <div className="fyt-scc-header">
              <h1 className="fyt-scc-title">{match.matchName}</h1>
              {match.venue && (
                <div className="fyt-scc-meta">
                  <span><MapPin size={13} /> {match.venue}</span>
                  <span>•</span>
                  <span>{match.format || "Cricket"} · {match.overs || 10} overs per side</span>
                </div>
              )}
            </div>

            <div className="fyt-scc-innings-box">
              <div className="fyt-scc-innings-row">
                <span className="fyt-scc-team-name">{firstTeam}</span>
                <div className="fyt-scc-score-box">
                  <strong>{first.runs || 0}/{first.wickets || 0}</strong>
                  <small>({firstOvers} ov)</small>
                </div>
              </div>

              <div className="fyt-scc-innings-row">
                <span className="fyt-scc-team-name">{secondTeam}</span>
                <div className="fyt-scc-score-box">
                  <strong>{second.runs || 0}/{second.wickets || 0}</strong>
                  <small>({secondOvers} ov)</small>
                </div>
              </div>
            </div>

            <div className="fyt-scc-status-banner">
              <PlayCircle size={16} />
              <span>
                {match.resultText ||
                  (match.state?.status === "INNINGS_BREAK"
                    ? "Innings Break"
                    : `${teamName(liveTeam, "Team")} batting`)}
              </span>
            </div>
          </div>

          {/* Match Information Grid */}
          <div className="fyt-card fyt-match-info-card" style={{ marginTop: 20 }}>
            <h3 className="fyt-card-heading">Match Information</h3>

            <div className="fyt-info-grid-2">
              <div className="fyt-info-stat-box">
                <span className="fyt-isb-label">Target</span>
                <strong className="fyt-isb-val">{match.target ? `${match.target} runs` : "Not set"}</strong>
              </div>

              <div className="fyt-info-stat-box">
                <span className="fyt-isb-label">Current Innings</span>
                <strong className="fyt-isb-val">Innings {match.state?.currentInnings || 1}</strong>
              </div>

              <div className="fyt-info-stat-box">
                <span className="fyt-isb-label">Match Format</span>
                <strong className="fyt-isb-val">{match.format || "Limited Overs"}</strong>
              </div>

              <div className="fyt-info-stat-box">
                <span className="fyt-isb-label">Last Updated</span>
                <strong className="fyt-isb-val">
                  {match.updatedAt
                    ? new Date(match.updatedAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Live"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
