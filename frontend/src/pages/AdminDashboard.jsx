import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminToken,
  getAdmin,
  logoutAdmin,
} from "../services/auth";

const API_URL = "http://localhost:5000";

const initialForm = {
  eventName: "",
  sport: "Cricket",
  eventDate: "",
  teamSize: "",
  location: "",
  registrationDeadline: "",
  firstPrize: "",
  secondPrize: "",
  thirdPrize: "",
  eventImage: "",
  registrationLink: "",
};

function AdminDashboard() {
  const navigate = useNavigate();
  const admin = getAdmin();
  const token = getAdminToken();

  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    navigate("/admin/login");
    return null;
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");

    if (
      !form.eventName ||
      !form.eventDate ||
      !form.teamSize ||
      !form.location ||
      !form.registrationDeadline ||
      form.firstPrize === "" ||
      form.secondPrize === "" ||
      form.thirdPrize === ""
    ) {
      setMessage("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventName: form.eventName,
          sport: form.sport,
          eventDate: form.eventDate,
          teamSize: form.teamSize,
          location: form.location,
          registrationDeadline: form.registrationDeadline,
          firstPrize: Number(form.firstPrize),
          secondPrize: Number(form.secondPrize),
          thirdPrize: Number(form.thirdPrize),
          eventImage: form.eventImage,
          registrationLink: form.registrationLink,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create event");
      }

      setMessage("Event created successfully!");
      setForm(initialForm);
    } catch (error) {
      console.error("Create event error:", error);
      setMessage(error.message || "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logoutAdmin();
    navigate("/admin/login");
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-container">

        {/* Header */}
        <header className="admin-header">
          <div>
            <h1>Turf Hub Admin</h1>
            <p>
              Welcome, {admin?.name || "Admin"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        {/* Event Form */}
        <main className="admin-form-card">
          <h2>Upload Event</h2>

          <p>
            Create a Cricket or Football event for the public website.
          </p>

          <form
            className="event-form"
            onSubmit={handleSubmit}
          >

            {/* Event Name + Sport */}
            <div className="form-row">

              <div className="form-group">
                <label>Event Name *</label>

                <input
                  type="text"
                  name="eventName"
                  value={form.eventName}
                  onChange={handleChange}
                  placeholder="Example: Night Cricket League"
                  required
                />
              </div>

              <div className="form-group">
                <label>Sport *</label>

                <select
                  name="sport"
                  value={form.sport}
                  onChange={handleChange}
                  required
                >
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                </select>
              </div>

            </div>

            {/* Date + Team Size */}
            <div className="form-row">

              <div className="form-group">
                <label>Event Date *</label>

                <input
                  type="date"
                  name="eventDate"
                  value={form.eventDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Team Size *</label>

                <input
                  type="text"
                  name="teamSize"
                  value={form.teamSize}
                  onChange={handleChange}
                  placeholder="Example: 8 players"
                  required
                />
              </div>

            </div>

            {/* Location + Deadline */}
            <div className="form-row">

              <div className="form-group">
                <label>Location *</label>

                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Example: Coimbatore"
                  required
                />
              </div>

              <div className="form-group">
                <label>Registration Deadline *</label>

                <input
                  type="date"
                  name="registrationDeadline"
                  value={form.registrationDeadline}
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            {/* Prizes */}
            <div className="form-row three">

              <div className="form-group">
                <label>1st Prize *</label>

                <input
                  type="number"
                  name="firstPrize"
                  value={form.firstPrize}
                  onChange={handleChange}
                  min="0"
                  placeholder="10000"
                  required
                />
              </div>

              <div className="form-group">
                <label>2nd Prize *</label>

                <input
                  type="number"
                  name="secondPrize"
                  value={form.secondPrize}
                  onChange={handleChange}
                  min="0"
                  placeholder="5000"
                  required
                />
              </div>

              <div className="form-group">
                <label>3rd Prize *</label>

                <input
                  type="number"
                  name="thirdPrize"
                  value={form.thirdPrize}
                  onChange={handleChange}
                  min="0"
                  placeholder="2500"
                  required
                />
              </div>

            </div>

            {/* Image */}
            <div className="form-group">
              <label>Event Image URL</label>

              <input
                type="url"
                name="eventImage"
                value={form.eventImage}
                onChange={handleChange}
                placeholder="https://example.com/event-image.jpg"
              />
            </div>

            {/* Google Form */}
            <div className="form-group">
              <label>Google Form Registration Link</label>

              <input
                type="url"
                name="registrationLink"
                value={form.registrationLink}
                onChange={handleChange}
                placeholder="https://docs.google.com/forms/..."
              />
            </div>

            {/* Message */}
            {message && (
              <div
                className={
                  message.includes("successfully")
                    ? "success-message"
                    : "error"
                }
              >
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="upload-button"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload Event"}
            </button>

          </form>
        </main>

      </div>
    </div>
  );
}

export default AdminDashboard;