import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PlayCircle, CalendarDays, MapPin, Trophy } from "lucide-react";
import { socket } from "../services/socket";
import BottomNav from "../components/BottomNav";
import {
  getLiveMatches,
  getUpcomingMatches,
  getMatchResults,
} from "../services/api";

const TABS = [
  { key: "LIVE", label: "Live" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "RESULTS", label: "Result" },
];

function oversDisplay(legalBalls = 0) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

function formatDateTime(value) {
  if (!value) return "Time to be announced";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Time to be announced";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function teamLabel(team, fallback) {
  return team?.name || team?.shortName || fallback;
}

/* ----- LIVE ----- */
function LiveMatchCard({ match }) {
  const innings = match?.state?.currentInnings === 2 ? 2 : 1;
  const battingIsA = match?.state?.battingTeamId !== "Team B";

  const first = match?.score?.firstInnings || {};
  const second = match?.score?.secondInnings || {};

  const aScore =
    innings === 1
      ? battingIsA
        ? first
        : null
      : battingIsA
      ? second
      : first;
  const bScore =
    innings === 1
      ? battingIsA
        ? null
        : first
      : battingIsA
      ? first
      : second;

  const status = match?.state?.status;
  const line =
    match?.resultText ||
    (status === "INNINGS_BREAK"
      ? "Innings break"
      : match?.target
      ? `Target ${match.target}`
      : "Match in progress");

  const renderScore = (score) => {
    if (!score) return <span className="lm-yet">Yet to bat</span>;
    return (
      <span className="lm-score-val">
        {score.runs || 0}/{score.wickets || 0}
        <small> ({oversDisplay(score.legalBalls)})</small>
      </span>
    );
  };

  return (
    <div className="lm-card">
      <div className="lm-card-top">
        <span className="lm-live-dot">● LIVE</span>
        <span className="lm-format">{match.format || "Cricket"}</span>
      </div>
      <h4 className="lm-match-name">{match.matchName}</h4>
      <div className="lm-team-row">
        <span className="lm-team-name">{teamLabel(match.teamA, "Team A")}</span>
        {renderScore(aScore)}
      </div>
      <div className="lm-team-row">
        <span className="lm-team-name">{teamLabel(match.teamB, "Team B")}</span>
        {renderScore(bScore)}
      </div>
      <div className="lm-card-foot">
        {match.venue ? (
          <span>
            <MapPin size={12} /> {match.venue}
          </span>
        ) : (
          <span />
        )}
        <span className="lm-result-line">{line}</span>
      </div>
    </div>
  );
}

/* ----- UPCOMING ----- */
function UpcomingMatchCard({ match }) {
  return (
    <div className="lm-card">
      <div className="lm-card-top">
        <span className="lm-upcoming-tag">UPCOMING</span>
        <span className="lm-format">{match.format || "Cricket"}</span>
      </div>
      <h4 className="lm-match-name">{match.matchName}</h4>
      <div className="lm-vs-row">
        <span>{teamLabel(match.teamA, "Team A")}</span>
        <span className="lm-vs">vs</span>
        <span>{teamLabel(match.teamB, "Team B")}</span>
      </div>
      <div className="lm-card-foot">
        <span>
          <CalendarDays size={12} /> {formatDateTime(match.scheduledAt)}
        </span>
        {match.venue ? (
          <span>
            <MapPin size={12} /> {match.venue}
          </span>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

/* ----- RESULTS ----- */
function ResultMatchCard({ match }) {
  const a =
    match.teamA?.nameSnapshot ||
    match.teamA?.name ||
    match.teamA?.shortNameSnapshot ||
    "Team A";
  const b =
    match.teamB?.nameSnapshot ||
    match.teamB?.name ||
    match.teamB?.shortNameSnapshot ||
    "Team B";

  return (
    <div className="lm-card">
      <div className="lm-card-top">
        <span className="lm-done-tag">COMPLETED</span>
        <span className="lm-format">{match.format || "Cricket"}</span>
      </div>
      <h4 className="lm-match-name">{match.matchName}</h4>
      <div className="lm-vs-row">
        <span>{a}</span>
        <span className="lm-vs">vs</span>
        <span>{b}</span>
      </div>
      <div className="lm-result-banner">
        <Trophy size={14} />
        {match.resultText ||
          (match.winner && match.winner !== "Tie"
            ? `${match.winner} won`
            : match.winner === "Tie"
            ? "Match tied"
            : "Result announced")}
      </div>
    </div>
  );
}

export default function UserLiveMatches() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("LIVE");
  const [data, setData] = useState({ LIVE: [], UPCOMING: [], RESULTS: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    try {
      setError("");
      const [live, upcoming, results] = await Promise.all([
        getLiveMatches().catch(() => []),
        getUpcomingMatches().catch(() => []),
        getMatchResults().catch(() => []),
      ]);
      setData({ LIVE: live, UPCOMING: upcoming, RESULTS: results });
    } catch (err) {
      setError(err.message || "Unable to load matches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();

    const refresh = () => loadAll();
    socket.on("match:scoreUpdated", refresh);
    socket.on("new-live-match", refresh);
    socket.on("match:completed", refresh);

    return () => {
      socket.off("match:scoreUpdated", refresh);
      socket.off("new-live-match", refresh);
      socket.off("match:completed", refresh);
    };
  }, [loadAll]);

  const list = data[activeTab] || [];

  const emptyText = {
    LIVE: "No matches are live right now.",
    UPCOMING: "No upcoming matches scheduled.",
    RESULTS: "No completed matches yet.",
  }[activeTab];

  return (
    <div className="mobile-app-container">
      <header className="book-turf-header">
        <button className="icon-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </button>
        <div className="bt-header-title">
          <h1>Live Matches</h1>
          <div className="bt-location-meta">
            <PlayCircle size={12} /> <span>Cricket scores &amp; fixtures</span>
          </div>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <div className="lm-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`lm-tab ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {activeTab === tab.key && <span className="lm-tab-underline" />}
          </button>
        ))}
      </div>

      <div
        className="home-scroll-area"
        style={{ padding: "16px", paddingBottom: 110 }}
      >
        {loading ? (
          <div className="status-box">Loading matches...</div>
        ) : error ? (
          <div className="status-box">
            <p>{error}</p>
            <button className="btn-primary" onClick={loadAll}>
              Try Again
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="lm-empty">
            <PlayCircle size={44} />
            <h3>Nothing here yet</h3>
            <p>{emptyText}</p>
          </div>
        ) : (
          <div className="lm-list">
            {list.map((match) =>
              activeTab === "LIVE" ? (
                <LiveMatchCard key={match._id} match={match} />
              ) : activeTab === "UPCOMING" ? (
                <UpcomingMatchCard key={match._id} match={match} />
              ) : (
                <ResultMatchCard key={match._id} match={match} />
              )
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
