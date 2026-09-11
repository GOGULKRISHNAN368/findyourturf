import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle, CalendarDays, MapPin, Trophy, Radio, ArrowRight, Clock } from "lucide-react";
import { socket } from "../services/socket";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import { MatchCardSkeleton } from "../components/SkeletonLoader";
import EmptyState from "../components/EmptyState";
import {
  getLiveMatches,
  getUpcomingMatches,
  getMatchResults,
} from "../services/api";

const TABS = [
  { key: "LIVE", label: "Live", icon: Radio },
  { key: "UPCOMING", label: "Upcoming", icon: CalendarDays },
  { key: "RESULTS", label: "Results", icon: Trophy },
];

function oversDisplay(legalBalls = 0) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

function formatDateTime(value) {
  if (!value) return "Date & Time TBA";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date & Time TBA";
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

/* ----- LIVE MATCH CARD ----- */
function LiveMatchCard({ match }) {
  const navigate = useNavigate();
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
    if (!score) return <span className="fyt-score-yet">Yet to bat</span>;
    return (
      <span className="fyt-score-val">
        <strong>{score.runs || 0}/{score.wickets || 0}</strong>
        <small className="fyt-score-overs"> ({oversDisplay(score.legalBalls)} ov)</small>
      </span>
    );
  };

  // Current striker / bowler line (present once the player-aware scoring is used).
  const battingInns =
    innings === 2 ? match?.score?.secondInnings : match?.score?.firstInnings;
  const battingSlot = match?.state?.battingTeamId;
  const bowlingSlot = match?.state?.bowlingTeamId;
  const battingRoster =
    (battingSlot === "Team A" ? match?.teamA : match?.teamB)?.players || [];
  const bowlingRoster =
    (bowlingSlot === "Team A" ? match?.teamA : match?.teamB)?.players || [];
  const strikerRow = (battingInns?.batting || []).find(
    (b) => String(b.playerId) === String(match?.state?.strikerId)
  );
  const bowlerRow = (battingInns?.bowling || []).find(
    (b) => String(b.playerId) === String(match?.state?.bowlerId)
  );
  const strikerName =
    strikerRow?.name ||
    battingRoster.find((p) => String(p.playerId) === String(match?.state?.strikerId))?.name;
  const bowlerName =
    bowlerRow?.name ||
    bowlingRoster.find((p) => String(p.playerId) === String(match?.state?.bowlerId))?.name;

  return (
    <article
      className="fyt-match-card fyt-live-card"
      onClick={() => navigate(`/live/${match._id}`)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/live/${match._id}`);
        }
      }}
    >
      <div className="fyt-mc-header">
        <div className="fyt-mc-live-pill">
          <span className="fyt-live-pulse-dot" />
          <span>LIVE</span>
        </div>
        <span className="fyt-mc-format">{match.format || "Cricket"}</span>
      </div>

      <h4 className="fyt-mc-title">{match.matchName}</h4>

      <div className="fyt-mc-scores-box">
        <div className="fyt-mc-team-row">
          <span className="fyt-mc-team-name">{teamLabel(match.teamA, "Team A")}</span>
          {renderScore(aScore)}
        </div>
        <div className="fyt-mc-team-row">
          <span className="fyt-mc-team-name">{teamLabel(match.teamB, "Team B")}</span>
          {renderScore(bScore)}
        </div>
      </div>

      {(strikerName || bowlerName) && (
        <div className="fyt-mc-crease-line">
          {strikerName && (
            <span>
              🏏 {strikerName}
              {strikerRow ? ` ${strikerRow.runs} (${strikerRow.balls})` : ""} *
            </span>
          )}
          {bowlerName && (
            <span>
              🎯 {bowlerName}
              {bowlerRow ? ` ${bowlerRow.wickets}-${bowlerRow.runsConceded}` : ""}
            </span>
          )}
        </div>
      )}

      <div className="fyt-mc-footer">
        {match.venue ? (
          <span className="fyt-mc-venue">
            <MapPin size={13} /> {match.venue}
          </span>
        ) : (
          <span />
        )}
        <span className="fyt-mc-status-line">{line}</span>
      </div>
    </article>
  );
}

/* ----- UPCOMING MATCH CARD ----- */
function UpcomingMatchCard({ match }) {
  const navigate = useNavigate();
  return (
    <article
      className="fyt-match-card"
      onClick={() => navigate(`/live/${match._id}`)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/live/${match._id}`);
        }
      }}
    >
      <div className="fyt-mc-header">
        <span className="fyt-mc-badge-upcoming">UPCOMING</span>
        <span className="fyt-mc-format">{match.format || "Cricket"}</span>
      </div>

      <h4 className="fyt-mc-title">{match.matchName}</h4>

      <div className="fyt-mc-vs-container">
        <span className="fyt-mc-vs-team">{teamLabel(match.teamA, "Team A")}</span>
        <span className="fyt-mc-vs-pill">VS</span>
        <span className="fyt-mc-vs-team">{teamLabel(match.teamB, "Team B")}</span>
      </div>

      <div className="fyt-mc-footer">
        <span className="fyt-mc-time">
          <CalendarDays size={13} /> {formatDateTime(match.scheduledAt)}
        </span>
        {match.venue && (
          <span className="fyt-mc-venue">
            <MapPin size={13} /> {match.venue}
          </span>
        )}
      </div>
    </article>
  );
}

/* ----- RESULT MATCH CARD ----- */
function ResultMatchCard({ match }) {
  const navigate = useNavigate();
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
    <article
      className="fyt-match-card"
      onClick={() => navigate(`/live/${match._id}`)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/live/${match._id}`);
        }
      }}
    >
      <div className="fyt-mc-header">
        <span className="fyt-mc-badge-completed">COMPLETED</span>
        <span className="fyt-mc-format">{match.format || "Cricket"}</span>
      </div>

      <h4 className="fyt-mc-title">{match.matchName}</h4>

      <div className="fyt-mc-vs-container">
        <span className="fyt-mc-vs-team">{a}</span>
        <span className="fyt-mc-vs-pill">VS</span>
        <span className="fyt-mc-vs-team">{b}</span>
      </div>

      <div className="fyt-mc-result-banner">
        <Trophy size={15} />
        <span>
          {match.resultText ||
            (match.winner && match.winner !== "Tie"
              ? `${match.winner} won the match`
              : match.winner === "Tie"
              ? "Match ended in a tie"
              : "Result announced")}
        </span>
      </div>
    </article>
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
      setError(err.message || "Unable to load match scores.");
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
    socket.on("match:updated", refresh);
    socket.on("match:deleted", refresh);
    socket.on("live-score-updated", refresh);
    socket.on("tournament-updated", refresh);

    return () => {
      socket.off("match:scoreUpdated", refresh);
      socket.off("new-live-match", refresh);
      socket.off("match:completed", refresh);
      socket.off("match:updated", refresh);
      socket.off("match:deleted", refresh);
      socket.off("live-score-updated", refresh);
      socket.off("tournament-updated", refresh);
    };
  }, [loadAll]);

  const list = data[activeTab] || [];

  const emptyText = {
    LIVE: "No matches are live right now. Check back during tournament hours.",
    UPCOMING: "No upcoming matches scheduled at this time.",
    RESULTS: "No completed match results yet.",
  }[activeTab];

  return (
    <div className="fyt-app-shell">
      <Navbar />

      <main className="fyt-main-content" style={{ paddingBottom: 110 }}>
        {/* Banner */}
        <div className="fyt-page-banner">
          <div className="fyt-container">
            <div className="fyt-pb-content">
              <div className="fyt-pb-badge">
                <Radio size={14} /> <span>Real-Time Ball-by-Ball</span>
              </div>
              <h1 className="fyt-pb-title">Live Match Scores &amp; Fixtures</h1>
              <p className="fyt-pb-desc">
                Follow real-time tournament scores, upcoming fixtures, and verified match results across Coimbatore turfs.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <section className="fyt-lm-tabs-section">
          <div className="fyt-container">
            <div className="fyt-segmented-tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                const count = (data[tab.key] || []).length;
                return (
                  <button
                    key={tab.key}
                    className={`fyt-seg-tab ${active ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {count > 0 && <span className="fyt-seg-tab-badge">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Matches List Grid */}
        <section className="fyt-matches-grid-section">
          <div className="fyt-container">
            {loading ? (
              <div className="fyt-grid-2">
                {[1, 2, 3, 4].map((n) => (
                  <MatchCardSkeleton key={n} />
                ))}
              </div>
            ) : error ? (
              <EmptyState
                type="error"
                title="Unable to load matches"
                message={error}
                actionLabel="Try Again"
                onAction={loadAll}
              />
            ) : list.length === 0 ? (
              <EmptyState
                type="events"
                title="No matches found"
                message={emptyText}
                actionLabel="Explore Tournaments"
                onAction={() => navigate("/events")}
              />
            ) : (
              <div className="fyt-grid-2">
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
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
