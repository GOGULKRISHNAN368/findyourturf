import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Trophy, PlayCircle, CalendarDays, Radio, CheckCircle, ChevronRight } from "lucide-react";
import { getEvents, getMatchResults, getLiveMatches } from "../services/api";
import { markNotificationsSeen } from "../services/profile";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";

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
          title: `${m.matchName || "A cricket match"} is live now`,
          body: "Tap to follow real-time live scores & commentary.",
          at: m.updatedAt || m.createdAt,
          to: `/live/${m._id}`,
        });
      });

      events.slice(0, 10).forEach((e) => {
        feed.push({
          id: `event-${e._id}`,
          icon: "trophy",
          title: `New Tournament: ${e.eventName || "Tournament"}`,
          body: `${e.location || "Coimbatore"} • ${
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
          title: `Match Result: ${m.matchName || "Match"}`,
          body: m.resultText || (m.winner ? `${m.winner} won the match` : "Match completed"),
          at: m.completedAt || m.updatedAt,
          to: `/live/${m._id}`,
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
    if (kind === "live") return <Radio size={18} />;
    if (kind === "result") return <PlayCircle size={18} />;
    return <CalendarDays size={18} />;
  };

  return (
    <div className="fyt-app-shell">
      <Navbar />

      <main className="fyt-main-content" style={{ paddingBottom: 60 }}>
        <div className="fyt-container" style={{ maxWidth: 760 }}>
          {/* Top navigation */}
          <div className="fyt-td-nav-bar">
            <button className="fyt-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <h2 className="fyt-checkout-header-title">Notifications &amp; Activity</h2>
          </div>

          {loading ? (
            <div className="fyt-card" style={{ padding: 40, textAlign: "center" }}>
              <div className="fyt-loading-spinner" />
              <p style={{ marginTop: 14, color: "var(--text-secondary)" }}>Loading notifications...</p>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              type="bookings"
              title="You're all caught up!"
              message="New tournament announcements, live matches, and match results will appear here."
              actionLabel="Explore Turfs"
              onAction={() => navigate("/turfs")}
            />
          ) : (
            <div className="fyt-notif-feed">
              {items.map((n) => (
                <article
                  key={n.id}
                  className="fyt-card fyt-notif-item-card"
                  onClick={() => navigate(n.to)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(n.to);
                    }
                  }}
                >
                  <div className={`fyt-notif-icon-circle is-${n.icon}`}>
                    {iconFor(n.icon)}
                  </div>
                  <div className="fyt-notif-body">
                    <div className="fyt-notif-title-row">
                      <strong className="fyt-notif-title">{n.title}</strong>
                      <span className="fyt-notif-time">{timeAgo(n.at)}</span>
                    </div>
                    <p className="fyt-notif-desc">{n.body}</p>
                  </div>
                  <ChevronRight size={18} className="fyt-notif-chevron" />
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
