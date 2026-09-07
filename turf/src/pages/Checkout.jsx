import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, User } from "lucide-react";
import { createBooking } from "../services/api";
import { getProfile, addLocalBooking } from "../services/profile";

// Placeholder identity until real user accounts land. The booking API
// requires a user id; the human-readable name/phone come from the local
// profile and are stored with the booking on this device.
const PLACEHOLDER_USER_ID = "64a0f44e1234567890abcdef";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!state || !state.turf) {
    return <div className="status-box">Invalid booking session</div>;
  }

  const { turf, date, slot, endSlot } = state;
  const profile = getProfile();
  const platformFee = 20;
  const total = turf.pricePerHour + platformFee;

  const handleConfirm = async () => {
    if (!profile) {
      setError("Please add your name and phone number before booking.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const bookingData = {
        user: PLACEHOLDER_USER_ID,
        turf: turf._id,
        bookingDate: date,
        startTime: slot,
        endTime: endSlot || slot,
        totalAmount: total,
        status: "Confirmed",
      };

      await createBooking(bookingData);

      addLocalBooking({
        turfId: turf._id,
        turfName: turf.name,
        turfLocation: turf.location,
        date,
        slot,
        endSlot: endSlot || slot,
        totalAmount: total,
        status: "Confirmed",
        bookedBy: profile.name,
        phone: profile.phone,
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to book. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mobile-app-container" style={{ backgroundColor: "var(--bg-main)", minHeight: "100vh" }}>
        <div className="co-success-container">
          <div className="co-success-icon">
            <CheckCircle2 size={40} />
          </div>
          <h2>Turf Booked Successfully!</h2>
          <p>Your slot is confirmed and ready to play.</p>
          
          <div className="co-success-card">
            <div className="co-detail-item" style={{ marginBottom: 16 }}>
              <small>Turf</small>
              <strong>{turf.name}</strong>
            </div>
            <div className="co-detail-item" style={{ marginBottom: 16 }}>
              <small>Date & Time</small>
              <strong>{new Date(date).toLocaleDateString()} at {slot}</strong>
            </div>
            <div className="co-detail-item">
              <small>Amount Paid</small>
              <strong>₹{total}</strong>
            </div>
          </div>
          
          <button className="register-button" style={{ marginTop: 0 }} onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-app-container">
      <header className="book-turf-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="bt-header-title" style={{ alignItems: "center", width: "100%" }}>
          <h1>Booking Summary</h1>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <div className="home-scroll-area" style={{ paddingBottom: 100 }}>
        <div className="co-summary-card">
          <div className="co-venue-row">
            <img src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=200&auto=format&fit=crop" className="co-venue-img" alt={turf.name} />
            <div className="co-venue-details">
              <h3>{turf.name}</h3>
              <p>{turf.location}</p>
              <div className="td-sport-tag" style={{ display: "inline-block", padding: "4px 8px", fontSize: 11 }}>{turf.sportType}</div>
            </div>
          </div>

          <div className="co-booking-details">
            <div className="co-detail-item">
              <small>Date</small>
              <strong>{new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
            </div>
            <div className="co-detail-item">
              <small>Time</small>
              <strong>{endSlot ? `${slot} – ${endSlot}` : slot}</strong>
            </div>
            <div className="co-detail-item">
              <small>Facility</small>
              <strong>Main Ground</strong>
            </div>
          </div>
        </div>

        {profile ? (
          <div className="co-summary-card" style={{ marginTop: 16 }}>
            <div className="co-detail-item">
              <small>Booking for</small>
              <strong>{profile.name} · +91 {profile.phone}</strong>
            </div>
          </div>
        ) : (
          <Link to="/profile" className="co-profile-prompt">
            <User size={18} />
            <span>Add your name &amp; phone number to continue</span>
          </Link>
        )}

        <div className="co-price-breakdown">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Price Breakdown</h3>
          <div className="co-price-row">
            <span>Turf Charge (1 Hour)</span>
            <span>₹{turf.pricePerHour}</span>
          </div>
          <div className="co-price-row">
            <span>Platform Fee</span>
            <span>₹{platformFee}</span>
          </div>
          <div className="co-price-total">
            <span>Total Amount</span>
            <span>₹{total}</span>
          </div>
        </div>
      </div>

      <div className="td-sticky-bottom" style={{ flexDirection: "column", height: "auto", alignItems: "stretch", padding: "12px 16px" }}>
        {error && <p className="co-error">{error}</p>}
        <button
          className="register-button"
          style={{ margin: 0, opacity: profile ? 1 : 0.5 }}
          onClick={handleConfirm}
          disabled={loading || !profile}
        >
          {loading ? "Processing..." : `Pay ₹${total}`}
        </button>
      </div>
    </div>
  );
}
