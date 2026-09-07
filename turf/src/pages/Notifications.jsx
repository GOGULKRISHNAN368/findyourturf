import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Trophy, PlayCircle, CalendarDays } from "lucide-react";
import { getEvents, getMatchResults, getLiveMatches } from "../services/api";
import { markNotificationsSeen } from "../services/profile";

function timeAgo(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [events, results, live] = await Promise.all([
        getEvents().catch(() => []),
        getMatchResults().catch(() => []),
        getLiveMatches().catch(() => []),
      ]);
      if (!mounted) return;

      const feed = [];

      live.forEach((m) => {
        feed.push({
          id: `live-${m._id}`,
          icon: "live",
          title: `${m.matchName || "A match"} is live now`,
          body: "Tap to follow the live score.",
          at: m.updatedAt || m.createdAt,
          to: "/live",
        });
      });

      events.slice(0, 10).forEach((e) => {
        feed.push({
          id: `event-${e._id}`,
          icon: "trophy",
          title: `New tournament: ${e.eventName || "Tournament"}`,
          body: `${e.location || "Venue TBA"} • ${
            e.eventDate
              ? new Date(e.eventDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })
              : "Date TBA"
          }`,
          at: e.createdAt,
          to: `/events/${e._id}`,
        });
      });

      results.slice(0, 10).forEach((m) => {
        feed.push({
          id: `result-${m._id}`,
          icon: "result",
          title: `Result: ${m.matchName || "Match"}`,
          body: m.resultText || (m.winner ? `${m.winner} won` : "Match completed"),
          at: m.completedAt || m.updatedAt,
          to: "/live",
        });
      });

      feed.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
      setItems(feed);
      setLoading(false);
      markNotificationsSeen();
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const iconFor = (kind) => {
    if (kind === "trophy") return <Trophy size={18} />;
    if (kind === "live" || kind === "result") return <PlayCircle size={18} />;
    return <CalendarDays size={18} />;
  };

  return (
    <div className="mobile-app-container">
      <header className="book-turf-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="bt-header-title">
          <h1>Notifications</h1>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <div className="home-scroll-area" style={{ padding: 16, paddingBottom: 40 }}>
        {loading ? (
          <div className="status-box">Loading...</div>
        ) : items.length === 0 ? (
          <div className="lm-empty">
            <Bell size={44} />
            <h3>You're all caught up</h3>
            <p>Tournament and live-match updates will show up here.</p>
          </div>
        ) : (
          <div className="notif-list">
            {items.map((n) => (
              <button
                key={n.id}
                className="notif-item"
                onClick={() => navigate(n.to)}
              >
                <div className={`notif-icon notif-${n.icon}`}>
                  {iconFor(n.icon)}
                </div>
                <div className="notif-text">
                  <strong>{n.title}</strong>
                  <span>{n.body}</span>
                  <em>{timeAgo(n.at)}</em>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
