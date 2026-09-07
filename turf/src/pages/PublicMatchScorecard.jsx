import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, PlayCircle, RefreshCw } from "lucide-react";
import { getMatchScorecard } from "../services/api";
import { socket } from "../services/socket";

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

  if (loading) return <div className="mobile-app-container"><div className="status-box">Loading scorecard...</div></div>;
  if (!match) return <div className="mobile-app-container"><div className="status-box"><p>{error || "Match not found."}</p><button className="btn-primary" onClick={load}><RefreshCw size={15} /> Try again</button></div></div>;

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
    <div className="mobile-app-container">
      <header className="book-turf-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft size={24} /></button>
        <div className="bt-header-title"><h1>Scorecard</h1><div className="bt-location-meta"><PlayCircle size={12} /> {match.state?.status || "MATCH"}</div></div>
        <div style={{ width: 44 }} />
      </header>
      <div className="home-scroll-area" style={{ padding: 16, paddingBottom: 100 }}>
        <div className="lm-card" style={{ cursor: "default" }}>
          <h2 className="lm-match-name">{match.matchName}</h2>
          {match.venue && <div className="lm-card-foot"><span><MapPin size={12} /> {match.venue}</span><span>{match.format} · {match.overs} overs</span></div>}
          <div className="lm-team-row"><span className="lm-team-name">{firstTeam}</span><strong>{first.runs || 0}/{first.wickets || 0} <small>({firstOvers})</small></strong></div>
          <div className="lm-team-row"><span className="lm-team-name">{secondTeam}</span><strong>{second.runs || 0}/{second.wickets || 0} <small>({secondOvers})</small></strong></div>
          <p className="lm-result-line">{match.resultText || (match.state?.status === "INNINGS_BREAK" ? "Innings break" : `${teamName(liveTeam, "Team")} batting`)}</p>
        </div>
        <h3 style={{ margin: "24px 0 12px" }}>Match information</h3>
        <div className="td-info-card"><span>Target</span><strong>{match.target || "Not set"}</strong></div>
        <div className="td-info-card"><span>Current innings</span><strong>{match.state?.currentInnings || 1}</strong></div>
        <div className="td-info-card"><span>Last updated</span><strong>{match.updatedAt ? new Date(match.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</strong></div>
      </div>
    </div>
  );
}
