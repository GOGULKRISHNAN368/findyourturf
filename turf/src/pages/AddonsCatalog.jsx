import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Video, Users, Dumbbell, Star, ArrowRight } from "lucide-react";
import { getAddons } from "../services/api";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";

const SECTIONS = [
  { type: "photography", title: "📸 Photography", Icon: Camera },
  { type: "videography", title: "🎥 Videography", Icon: Video },
  { type: "coach", title: "🏃 Coach Booking", Icon: Users },
  { type: "equipment", title: "🏏 Sports Equipment", Icon: Dumbbell },
];

function ServiceCard({ s }) {
  return (
    <div
      className="fyt-card"
      style={{ padding: 12, display: "flex", gap: 12, alignItems: "stretch" }}
    >
      {s.image ? (
        <img
          src={s.image}
          alt=""
          style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover", flex: "0 0 auto" }}
        />
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <strong style={{ fontSize: "0.95rem" }}>{s.name}</strong>
          <strong style={{ whiteSpace: "nowrap", color: "var(--primary)" }}>
            ₹{s.price}
            {s.priceUnit ? <span style={{ fontWeight: 400, fontSize: "0.75rem", color: "var(--text-secondary)" }}> / {s.priceUnit}</span> : null}
          </strong>
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
          {s.description || s.packageDetails || s.specialization || ""}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6, fontSize: "0.74rem", color: "var(--text-muted)" }}>
          {s.sport && <span>{s.sport}</span>}
          {s.experienceYears != null && <span>{s.experienceYears} yrs experience</span>}
          {s.durationLabel && <span>{s.durationLabel}</span>}
          {s.type === "equipment" && <span>{s.stock} in stock</span>}
          {s.rating != null && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: "#b45309" }}>
              <Star size={11} fill="#f59e0b" color="#f59e0b" /> {s.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AddonsCatalog() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAddons()
      .then((list) => active && setItems(list))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="fyt-app-shell">
      <Navbar />
      <main className="fyt-main-content" style={{ paddingBottom: 110 }}>
        <div className="fyt-container">
          <div className="fyt-td-nav-bar">
            <button className="fyt-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
          </div>

          <div className="fyt-pb-content" style={{ marginBottom: 8 }}>
            <h1 className="fyt-pb-title">Session Add-ons</h1>
            <p className="fyt-pb-desc">
              Photography, videography, coaching and equipment rental — added to your booking when you reserve a turf slot.
            </p>
          </div>

          <button
            className="fyt-btn-primary"
            style={{ marginBottom: 20 }}
            onClick={() => navigate("/turfs")}
          >
            Book a turf slot to add these <ArrowRight size={16} />
          </button>

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading services…</p>
          ) : (
            SECTIONS.map(({ type, title }) => {
              const list = items.filter((s) => s.type === type);
              if (!list.length) return null;
              return (
                <section key={type} style={{ marginBottom: 24 }}>
                  <h2 className="fyt-section-title" style={{ marginBottom: 12 }}>{title}</h2>
                  <div style={{ display: "grid", gap: 10 }}>
                    {list.map((s) => (
                      <ServiceCard key={s._id} s={s} />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
