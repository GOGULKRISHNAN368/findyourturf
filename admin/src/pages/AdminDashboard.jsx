import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAdminToken,
  getAdmin,
  logoutAdmin,
} from "../services/auth";

import { getEvents } from "../services/api";

const API_URL = "http://localhost:5000";

const emptyForm = {
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

  const token = getAdminToken();
  const admin = getAdmin();

  const [events, setEvents] = useState([]);

  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] =
    useState(true);

  /* =========================
     AUTH CHECK
  ========================= */

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadEvents();
  }, []);

  /* =========================
     LOAD EVENTS
  ========================= */

  async function loadEvents() {
    try {
      setEventsLoading(true);

      const data = await getEvents();

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError("Unable to load events.");
    } finally {
      setEventsLoading(false);
    }
  }

  /* =========================
     FORM CHANGE
  ========================= */

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =========================
     EDIT EVENT
  ========================= */

  function handleEdit(event) {
    setEditingId(event._id);

    setForm({
      eventName: event.eventName || "",
      sport: event.sport || "Cricket",
      eventDate: formatInputDate(event.eventDate),
      teamSize: event.teamSize || "",
      location: event.location || "",
      registrationDeadline:
        formatInputDate(
          event.registrationDeadline
        ),
      firstPrize: event.firstPrize || "",
      secondPrize: event.secondPrize || "",
      thirdPrize: event.thirdPrize || "",
      eventImage: event.eventImage || "",
      registrationLink:
        event.registrationLink || "",
    });

    setMessage("");

    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =========================
     SUBMIT
  ========================= */

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !form.eventName ||
      !form.eventDate ||
      !form.teamSize ||
      !form.location ||
      !form.registrationDeadline
    ) {
      setError(
        "Please fill all required fields."
      );

      return;
    }

    try {
      setLoading(true);

      const payload = {
        eventName: form.eventName,
        sport: form.sport,
        eventDate: form.eventDate,
        teamSize: form.teamSize,
        location: form.location,
        registrationDeadline:
          form.registrationDeadline,

        firstPrize: Number(form.firstPrize || 0),
        secondPrize: Number(
          form.secondPrize || 0
        ),
        thirdPrize: Number(
          form.thirdPrize || 0
        ),

        eventImage: form.eventImage,
        registrationLink:
          form.registrationLink,
      };

      const url = editingId
        ? `${API_URL}/api/events/${editingId}`
        : `${API_URL}/api/events`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save event."
        );
      }

      setMessage(
        editingId
          ? "Event updated successfully."
          : "Event created successfully."
      );

      setEditingId(null);

      setForm(emptyForm);

      await loadEvents();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save event."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     CANCEL EDIT
  ========================= */

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);

    setMessage("");
    setError("");
  }

  /* =========================
     LOGOUT
  ========================= */

  function handleLogout() {
    logoutAdmin();

    navigate("/login");
  }

  if (!token) {
    return null;
  }

  return (
    <div className="admin-page">

      {/* ADMIN HEADER */}

      <header className="admin-topbar">

        <div className="admin-brand">
          <div className="admin-brand-icon">
            ⚽
          </div>

          <div>
            <strong>TURF HUB</strong>
            <small>ADMIN</small>
          </div>
        </div>

        <div className="admin-account">

          <div className="admin-user">
            <strong>
              {admin?.name || "Admin"}
            </strong>

            <span>
              {admin?.email || ""}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="admin-logout"
          >
            Logout
          </button>

        </div>

      </header>

      <main className="admin-main">

        {/* HEADING */}

        <div className="admin-heading">

          <div>
            <span>EVENT MANAGEMENT</span>

            <h1>Admin Dashboard</h1>

            <p>
              Create and update tournament
              information.
            </p>
          </div>

        </div>

        {/* FORM */}

        <section className="admin-form-card">

          <div className="admin-card-heading">

            <div>
              <span>
                {editingId
                  ? "UPDATE EVENT"
                  : "CREATE EVENT"}
              </span>

              <h2>
                {editingId
                  ? "Update Event"
                  : "Add New Event"}
              </h2>
            </div>

            {editingId && (
              <button
                className="cancel-button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}

          </div>

          <form
            className="admin-form"
            onSubmit={handleSubmit}
          >

            <div className="form-field full">
              <label>Event Name *</label>

              <input
                name="eventName"
                value={form.eventName}
                onChange={handleChange}
                placeholder="Example: Night Cricket League"
                required
              />
            </div>

            <div className="form-row">

              <div className="form-field">
                <label>Sport *</label>

                <select
                  name="sport"
                  value={form.sport}
                  onChange={handleChange}
                >
                  <option value="Cricket">
                    Cricket
                  </option>

                  <option value="Football">
                    Football
                  </option>
                </select>
              </div>

              <div className="form-field">
                <label>Team Size *</label>

                <input
                  name="teamSize"
                  value={form.teamSize}
                  onChange={handleChange}
                  placeholder="Example: 8 players"
                  required
                />
              </div>

            </div>

            <div className="form-row">

              <div className="form-field">
                <label>Event Date *</label>

                <input
                  type="date"
                  name="eventDate"
                  value={form.eventDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label>
                  Registration Deadline *
                </label>

                <input
                  type="date"
                  name="registrationDeadline"
                  value={
                    form.registrationDeadline
                  }
                  onChange={handleChange}
                  required
                />
              </div>

            </div>

            <div className="form-field full">
              <label>Location *</label>

              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Example: Coimbatore"
                required
              />
            </div>

            <div className="prize-heading">
              Prize Details
            </div>

            <div className="form-row three">

              <div className="form-field">
                <label>1st Prize</label>

                <input
                  type="number"
                  min="0"
                  name="firstPrize"
                  value={form.firstPrize}
                  onChange={handleChange}
                  placeholder="10000"
                />
              </div>

              <div className="form-field">
                <label>2nd Prize</label>

                <input
                  type="number"
                  min="0"
                  name="secondPrize"
                  value={form.secondPrize}
                  onChange={handleChange}
                  placeholder="5000"
                />
              </div>

              <div className="form-field">
                <label>3rd Prize</label>

                <input
                  type="number"
                  min="0"
                  name="thirdPrize"
                  value={form.thirdPrize}
                  onChange={handleChange}
                  placeholder="2500"
                />
              </div>

            </div>

            <div className="form-field full">
              <label>Event Image URL</label>

              <input
                type="url"
                name="eventImage"
                value={form.eventImage}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>

            <div className="form-field full">
              <label>
                Google Form Registration Link
              </label>

              <input
                type="url"
                name="registrationLink"
                value={form.registrationLink}
                onChange={handleChange}
                placeholder="https://docs.google.com/forms/..."
              />
            </div>

            {message && (
              <div className="admin-success">
                ✓ {message}
              </div>
            )}

            {error && (
              <div className="admin-form-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="save-event-button"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update Event"
                : "Create Event"}
            </button>

          </form>
        </section>

        {/* EXISTING EVENTS */}

        <section className="existing-events">

          <div className="admin-card-heading">

            <div>
              <span>EVENTS</span>
              <h2>Existing Events</h2>
            </div>

            <button
              className="refresh-button"
              onClick={loadEvents}
            >
              ↻ Refresh
            </button>

          </div>

          {eventsLoading ? (
            <div className="admin-empty">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="admin-empty">
              No events created yet.
            </div>
          ) : (
            <div className="admin-event-list">

              {events.map((event) => (
                <div
                  className="admin-event-item"
                  key={event._id}
                >

                  <div className="admin-event-image">

                    {event.eventImage ? (
                      <img
                        src={event.eventImage}
                        alt={event.eventName}
                      />
                    ) : (
                      <span>
                        {event.sport ===
                        "Football"
                          ? "⚽"
                          : "🏏"}
                      </span>
                    )}

                  </div>

                  <div className="admin-event-details">

                    <span>
                      {event.sport}
                    </span>

                    <h3>
                      {event.eventName}
                    </h3>

                    <p>
                      {event.teamSize} •{" "}
                      {event.location}
                    </p>

                    <small>
                      {formatDate(
                        event.eventDate
                      )}
                    </small>

                  </div>

                  <button
                    className="update-event-button"
                    onClick={() =>
                      handleEdit(event)
                    }
                  >
                    Update Event
                  </button>

                </div>
              ))}

            </div>
          )}

        </section>

      </main>
    </div>
  );
}

/* =========================
   HELPERS
========================= */

function formatInputDate(date) {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toISOString().split("T")[0];
}

function formatDate(date) {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default AdminDashboard;