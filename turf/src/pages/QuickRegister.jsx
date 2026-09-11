import { useState } from "react";
import { registerVisitor } from "../services/api";
import { saveVisitor } from "../services/profile";

const PHONE_RE = /^[6-9]\d{9}$/;

// One-time gate shown before the rest of the public site. Collects just a
// name + phone number (no OTP, no password) and stores it in MongoDB via
// `POST /api/visitors/register`. Once done, the browser remembers it via
// localStorage (see services/profile.js) so this never shows again here.
export default function QuickRegister({ onComplete }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e) => {
    // Digits only — letters simply can't be typed into this field.
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
  };

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!phone) next.phone = "Please enter your phone number.";
    else if (!PHONE_RE.test(phone)) next.phone = "Enter a valid 10-digit mobile number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const visitor = await registerVisitor({ name: name.trim(), phone });
      saveVisitor({ visitorId: visitor.id, name: visitor.name, phone: visitor.phone });
      onComplete();
    } catch (err) {
      setSubmitError(
        err.isNetworkError || err.status === 0
          ? "Can't reach the server right now. Please check your connection and try again."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-page)",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--bg-card)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-default)",
          padding: "32px 28px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏟️</div>
          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 6px",
            }}
          >
            Welcome to Find Your Turf 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", margin: 0 }}>
            Enter your details to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="fyt-form-group">
            <label>Name *</label>
            <input
              type="text"
              className="fyt-input"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={loading}
            />
            {errors.name && (
              <span style={{ display: "block", color: "#DC2626", fontSize: "0.78rem", marginTop: 4 }}>
                {errors.name}
              </span>
            )}
          </div>

          <div className="fyt-form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              inputMode="numeric"
              className="fyt-input"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={10}
              disabled={loading}
            />
            {errors.phone && (
              <span style={{ display: "block", color: "#DC2626", fontSize: "0.78rem", marginTop: 4 }}>
                {errors.phone}
              </span>
            )}
          </div>

          {submitError && (
            <div className="fyt-error-banner" style={{ marginTop: 4, marginBottom: 12 }}>
              {submitError}
            </div>
          )}

          <button
            type="submit"
            className="fyt-btn-primary"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          >
            {loading ? "Please wait…" : "Continue"}
          </button>
        </form>

        <p
          style={{
            marginTop: 18,
            fontSize: "0.74rem",
            color: "var(--text-muted)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          We use your details to provide a better booking experience.
        </p>
      </div>
    </div>
  );
}
