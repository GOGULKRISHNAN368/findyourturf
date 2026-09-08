import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Phone,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Home,
  Check,
} from "lucide-react";
import { createBooking } from "../services/api";
import { getProfile, saveProfile, addLocalBooking } from "../services/profile";
import { getTurfImage } from "../utils/sportsImages";
import Navbar from "../components/Navbar";

const PLACEHOLDER_USER_ID = "64a0f44e1234567890abcdef";

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState(() => getProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(() => !getProfile());
  const [profileForm, setProfileForm] = useState(() => ({
    name: profile?.name || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
  }));

  if (!state || !state.turf) {
    return (
      <div className="fyt-app-shell">
        <Navbar />
        <main className="fyt-main-content">
          <div className="fyt-container" style={{ padding: "60px 16px", textAlign: "center" }}>
            <h2>Invalid Booking Session</h2>
            <p style={{ color: "var(--text-secondary)", margin: "12px 0 24px" }}>
              Please select a turf and time slot before proceeding to checkout.
            </p>
            <button className="fyt-btn-primary" onClick={() => navigate("/turfs")}>
              Browse Turfs
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { turf, date, slot, endSlot } = state;
  const platformFee = 20;
  const total = turf.pricePerHour + platformFee;
  const turfImage = getTurfImage(turf, 0);

  const handleSaveProfileInline = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim() || !profileForm.phone.trim()) {
      setError("Name and 10-digit mobile number are required.");
      return;
    }
    if (!/^\d{10}$/.test(profileForm.phone.trim())) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    const saved = saveProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
    });
    setProfile(saved);
    setIsEditingProfile(false);
    setError("");
  };

  const handleConfirm = async () => {
    if (!profile || !profile.name || !profile.phone) {
      setIsEditingProfile(true);
      setError("Please fill in your name and phone number before proceeding.");
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
      setError(err.message || "Failed to complete booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (success) {
    return (
      <div className="fyt-app-shell">
        <Navbar />
        <main className="fyt-main-content">
          <div className="fyt-container" style={{ maxWidth: 640, padding: "40px 16px" }}>
            <div className="fyt-success-screen">
              <div className="fyt-success-icon-badge">
                <CheckCircle2 size={48} />
              </div>

              <span className="fyt-success-badge-pill">
                <Sparkles size={14} /> Booking Confirmed
              </span>
              <h1 className="fyt-success-title">Get Ready to Play!</h1>
              <p className="fyt-success-subtitle">
                Your turf slot is locked in. We have sent confirmation details to{" "}
                <strong>+91 {profile?.phone}</strong>.
              </p>

              {/* Booking Summary Receipt Card */}
              <div className="fyt-receipt-card">
                <div className="fyt-receipt-header">
                  <img src={turfImage} alt={turf.name} className="fyt-receipt-thumb" />
                  <div>
                    <h3 className="fyt-receipt-turf-name">{turf.name}</h3>
                    <div className="fyt-receipt-loc">
                      <MapPin size={13} /> <span>{turf.location}, Coimbatore</span>
                    </div>
                  </div>
                </div>

                <div className="fyt-receipt-divider" />

                <div className="fyt-receipt-grid">
                  <div className="fyt-receipt-item">
                    <span className="fyt-receipt-label">Play Date</span>
                    <strong className="fyt-receipt-val">
                      {new Date(date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </div>

                  <div className="fyt-receipt-item">
                    <span className="fyt-receipt-label">Time Slot</span>
                    <strong className="fyt-receipt-val">
                      {endSlot ? `${slot} – ${endSlot}` : slot}
                    </strong>
                  </div>

                  <div className="fyt-receipt-item">
                    <span className="fyt-receipt-label">Booked By</span>
                    <strong className="fyt-receipt-val">{profile?.name}</strong>
                  </div>

                  <div className="fyt-receipt-item">
                    <span className="fyt-receipt-label">Total Paid</span>
                    <strong className="fyt-receipt-val" style={{ color: "var(--primary)" }}>
                      ₹{total}
                    </strong>
                  </div>
                </div>

                <div className="fyt-receipt-status-banner">
                  <span className="fyt-confirmed-dot" />
                  <span>Status: <strong>Confirmed &amp; Paid</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="fyt-success-actions">
                <button
                  className="fyt-btn-primary"
                  onClick={() => navigate("/profile")}
                  style={{ width: "100%" }}
                >
                  View in My Bookings
                </button>
                <button
                  className="fyt-btn-secondary"
                  onClick={() => navigate("/")}
                  style={{ width: "100%", marginTop: 10 }}
                >
                  <Home size={16} /> <span>Back to Home</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fyt-app-shell">
      <Navbar />

      <main className="fyt-main-content" style={{ paddingBottom: 100 }}>
        <div className="fyt-container" style={{ maxWidth: 800 }}>
          {/* Breadcrumb / Back button */}
          <div className="fyt-td-nav-bar">
            <button className="fyt-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
              <ArrowLeft size={18} />
              <span>Back to Details</span>
            </button>
            <h2 className="fyt-checkout-header-title">Booking Summary &amp; Checkout</h2>
          </div>

          <div className="fyt-checkout-grid">
            {/* Left: Summary and Customer Details */}
            <div className="fyt-checkout-left">
              {/* Venue Summary Card */}
              <div className="fyt-card fyt-checkout-venue-card">
                <div className="fyt-cvc-header">
                  <img src={turfImage} alt={turf.name} className="fyt-cvc-img" />
                  <div className="fyt-cvc-info">
                    <span className="fyt-badge-tag">{turf.sportType} Arena</span>
                    <h3 className="fyt-cvc-name">{turf.name}</h3>
                    <div className="fyt-cvc-loc">
                      <MapPin size={14} className="fyt-loc-pin" />
                      <span>{turf.location}, Coimbatore</span>
                    </div>
                  </div>
                </div>

                <div className="fyt-cvc-details-grid">
                  <div className="fyt-cvc-item">
                    <span className="fyt-cvc-label"><Calendar size={13} /> Selected Date</span>
                    <strong className="fyt-cvc-val">
                      {new Date(date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </div>

                  <div className="fyt-cvc-item">
                    <span className="fyt-cvc-label"><Clock size={13} /> Match Slot</span>
                    <strong className="fyt-cvc-val">
                      {endSlot ? `${slot} – ${endSlot}` : slot}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Customer Contact Details Card */}
              <div className="fyt-card fyt-customer-card">
                <div className="fyt-card-head">
                  <div className="fyt-card-head-title">
                    <User size={18} />
                    <h3>Player Information</h3>
                  </div>
                  {profile && !isEditingProfile && (
                    <button
                      className="fyt-edit-link"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      Change Details
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleSaveProfileInline} className="fyt-inline-form">
                    <div className="fyt-form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, name: e.target.value })
                        }
                        className="fyt-input"
                        required
                      />
                    </div>

                    <div className="fyt-form-group">
                      <label>10-Digit Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, phone: e.target.value })
                        }
                        className="fyt-input"
                        required
                      />
                    </div>

                    <div className="fyt-form-group">
                      <label>Email (Optional for invoice)</label>
                      <input
                        type="email"
                        placeholder="e.g. rahul@example.com"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, email: e.target.value })
                        }
                        className="fyt-input"
                      />
                    </div>

                    <button type="submit" className="fyt-btn-primary" style={{ marginTop: 8 }}>
                      Save Player Details
                    </button>
                  </form>
                ) : (
                  <div className="fyt-saved-profile-box">
                    <div className="fyt-sp-row">
                      <span className="fyt-sp-label">Player:</span>
                      <strong>{profile.name}</strong>
                    </div>
                    <div className="fyt-sp-row">
                      <span className="fyt-sp-label">Contact:</span>
                      <strong>+91 {profile.phone}</strong>
                    </div>
                    {profile.email && (
                      <div className="fyt-sp-row">
                        <span className="fyt-sp-label">Email:</span>
                        <span>{profile.email}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Price Breakdown & Payment CTA */}
            <div className="fyt-checkout-right">
              <div className="fyt-card fyt-price-breakdown-card">
                <h3 className="fyt-pbc-title">Price Breakdown</h3>

                <div className="fyt-price-line">
                  <span>Turf Rate (1 Hour)</span>
                  <strong>₹{turf.pricePerHour}</strong>
                </div>

                <div className="fyt-price-line">
                  <span>Platform &amp; Convenience Fee</span>
                  <strong>₹{platformFee}</strong>
                </div>

                <div className="fyt-price-line-total">
                  <span>Total Amount</span>
                  <span className="fyt-price-total-val">₹{total}</span>
                </div>

                {error && <div className="fyt-error-banner">{error}</div>}

                <button
                  className="fyt-btn-pay"
                  onClick={handleConfirm}
                  disabled={loading || isEditingProfile || !profile}
                >
                  {loading ? (
                    <span>Processing Booking...</span>
                  ) : (
                    <span>Pay ₹{total} &amp; Confirm Booking</span>
                  )}
                </button>

                <div className="fyt-checkout-guarantees">
                  <div className="fyt-cg-item">
                    <ShieldCheck size={16} /> <span>100% Secure &amp; Instant Confirmation</span>
                  </div>
                  <div className="fyt-cg-item">
                    <Check size={16} /> <span>No cancellation fee up to 4 hrs before match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
