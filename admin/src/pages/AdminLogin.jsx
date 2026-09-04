import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/auth";
import { IconEye, IconEyeOff, IconAlertCircle, IconArrowLeft, IconShield } from "../components/common/Icons";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginAdmin(email, password);
      navigate(location.state?.from || "/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-auth-wrapper">
      <div className="auth-ambient-orb orb-1" />
      <div className="auth-ambient-orb orb-2" />

      <div className="admin-auth-card">
        <div className="auth-brand-badge">
          <IconShield size={28} />
        </div>

        <div className="auth-header">
          <span className="auth-subtitle">Sports Management Platform</span>
          <h1 className="auth-title">Turf Hub Admin</h1>
          <p className="auth-desc">Sign in to manage tournaments, fixtures and live scores</p>
        </div>

        {error && (
          <div className="alert-banner error" style={{ margin: "0 0 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IconAlertCircle size={18} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ color: "#e2e8f0" }}>
              Admin Email
            </label>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@turfhub.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: "#e2e8f0" }}>
              Password
            </label>
            <div className="auth-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-input-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Admin Portal"}
          </button>
        </form>

        <a
          className="auth-back-link"
          href="http://localhost:5173"
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconArrowLeft size={16} />
          <span>Back to User Website</span>
        </a>
      </div>
    </div>
  );
}
