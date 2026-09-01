import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/auth";

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginAdmin(email, password);

      navigate("/admin");
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">

        <div className="admin-logo">
          ⚽
        </div>

        <div className="admin-login-heading">
          <span>ADMIN PORTAL</span>

          <h1>Welcome Back</h1>

          <p>
            Sign in to manage your tournaments.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="admin@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              required
            />
          </label>

          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>

        <button
          className="back-user-button"
          onClick={() => navigate("/")}
        >
          ← Back to User Website
        </button>

      </div>
    </div>
  );
}

export default AdminLogin;