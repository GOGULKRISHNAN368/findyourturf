import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Pencil,
  LogOut,
} from "lucide-react";
import {
  getProfile,
  saveProfile,
  clearProfile,
  getLocalBookings,
} from "../services/profile";
import BottomNav from "../components/BottomNav";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => getProfile());
  const [editing, setEditing] = useState(() => !getProfile());
  const [form, setForm] = useState(
    () => getProfile() || { name: "", phone: "", email: "" }
  );
  const [error, setError] = useState("");

  const bookings = getLocalBookings();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    const saved = saveProfile({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    });
    setProfile(saved);
    setEditing(false);
    setError("");
  };

  const handleSignOut = () => {
    clearProfile();
    setProfile(null);
    setForm({ name: "", phone: "", email: "" });
    setEditing(true);
  };

  return (
    <div className="mobile-app-container">
      <header className="book-turf-header">
        <button className="icon-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </button>
        <div className="bt-header-title">
          <h1>My Profile</h1>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <div className="home-scroll-area" style={{ padding: 16, paddingBottom: 110 }}>
        <div className="pf-hero">
          <div className="pf-avatar">
            <User size={34} />
          </div>
          <div>
            <h2 className="pf-name">{profile?.name || "Guest player"}</h2>
            <p className="pf-sub">
              {profile?.phone ? `+91 ${profile.phone}` : "Add your details to book faster"}
            </p>
          </div>
        </div>

        {editing ? (
          <form className="pf-form" onSubmit={handleSave}>
            <label>Full name</label>
            <div className="pf-input">
              <User size={16} />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
              />
            </div>

            <label>Phone number</label>
            <div className="pf-input">
              <Phone size={16} />
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                inputMode="numeric"
              />
            </div>

            <label>Email (optional)</label>
            <div className="pf-input">
              <Mail size={16} />
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>

            {error && <p className="pf-error">{error}</p>}

            <button type="submit" className="pf-save-btn">
              Save details
            </button>
            {profile && (
              <button
                type="button"
                className="pf-cancel-btn"
                onClick={() => {
                  setForm(profile);
                  setEditing(false);
                  setError("");
                }}
              >
                Cancel
              </button>
            )}
          </form>
        ) : (
          <div className="pf-details">
            <div className="pf-detail-row">
              <Phone size={16} />
              <span>+91 {profile.phone}</span>
            </div>
            {profile.email && (
              <div className="pf-detail-row">
                <Mail size={16} />
                <span>{profile.email}</span>
              </div>
            )}
            <button className="pf-edit-btn" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit details
            </button>
          </div>
        )}

        <h3 className="pf-section-title">My Bookings</h3>
        {bookings.length === 0 ? (
          <div className="pf-empty">
            <Calendar size={28} />
            <p>No bookings yet. Book a turf to see it here.</p>
            <button className="pf-save-btn" onClick={() => navigate("/turfs")}>
              Book a Turf
            </button>
          </div>
        ) : (
          <div className="pf-booking-list">
            {bookings.map((b, i) => (
              <div key={i} className="pf-booking-card">
                <div className="pf-booking-top">
                  <strong>{b.turfName}</strong>
                  <span className={`pf-status pf-status-${(b.status || "").toLowerCase()}`}>
                    {b.status || "Confirmed"}
                  </span>
                </div>
                <div className="pf-booking-meta">
                  <span>
                    <Calendar size={12} />{" "}
                    {b.date
                      ? new Date(b.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "-"}
                  </span>
                  <span>{b.slot}</span>
                </div>
                {b.turfLocation && (
                  <div className="pf-booking-meta">
                    <span>
                      <MapPin size={12} /> {b.turfLocation}
                    </span>
                    <span>₹{b.totalAmount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {profile && (
          <button className="pf-signout" onClick={handleSignOut}>
            <LogOut size={16} /> Clear my details
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
