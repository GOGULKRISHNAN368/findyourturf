import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getAdminToken,
  getAdmin,
  logoutAdmin,
} from "../services/auth";

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../services/api";

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
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setEventsLoading(true);
      const data = await getEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load events.");
    } finally {
      setEventsLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleEdit(event) {
    setEditingId(event._id);
    setForm({
      eventName: event.eventName || "",
      sport: event.sport || "Cricket",
      eventDate: formatInputDate(event.eventDate),
      teamSize: event.teamSize || "",
      location: event.location || "",
      registrationDeadline: formatInputDate(event.registrationDeadline),
      firstPrize: event.firstPrize || "",
      secondPrize: event.secondPrize || "",
      thirdPrize: event.thirdPrize || "",
      eventImage: event.eventImage || "",
      registrationLink: event.registrationLink || "",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
      setError("Please fill all required fields.");
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
        registrationDeadline: form.registrationDeadline,
        firstPrize: Number(form.firstPrize || 0),
        secondPrize: Number(form.secondPrize || 0),
        thirdPrize: Number(form.thirdPrize || 0),
        eventImage: form.eventImage,
        registrationLink: form.registrationLink,
      };

      if (editingId) {
        await updateEvent(editingId, payload);
        setMessage("Event updated successfully.");
      } else {
        await createEvent(payload);
        setMessage("Event created successfully.");
      }

      setEditingId(null);
      setForm(emptyForm);
      await loadEvents();
    } catch (err) {
      setError(err.message || "Unable to save event.");
    } finally {
      setLoading(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function handleDelete(event) {
    const confirmed = window.confirm(`Delete ${event.eventName}?`);

    if (!confirmed) {
      return;
    }

    try {
      await deleteEvent(event._id);
      setMessage("Event deleted successfully.");
      await loadEvents();
    } catch (err) {
      setError(err.message || "Unable to delete event.");
    }
  }

  function handleManageTournament(event) {
    navigate(`/tournament/${event._id}`);
  }

  function handleLogout() {
    logoutAdmin();
    navigate("/login");
  }

  if (!token) {
    return null;
  }

  return (
    <div className="admin-page">
      <header className="admin-topbar">
        <div className="admin-brand">
          <div className="admin-brand-icon">⚽</div>
          <div>
            <strong>TURF HUB</strong>
            <small>ADMIN</small>
          </div>
        </div>

        <div className="admin-account">
          <div className="admin-user">
            <strong>{admin?.name || "Admin"}</strong>
            <span>{admin?.email || ""}</span>
          </div>
          <button onClick={handleLogout} className="admin-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-heading">
          <div>
            <span>EVENT MANAGEMENT</span>
            <h1>Admin Dashboard</h1>
            <p>Create and update tournament information.</p>
          </div>
        </div>

        <section className="admin-form-card">
          <div className="admin-card-heading">
            <div>
              <span>{editingId ? "UPDATE EVENT" : "CREATE EVENT"}</span>
              <h2>{editingId ? "Update Event" : "Add New Event"}</h2>
            </div>
            {editingId && (
              <button className="cancel-button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>

          <form className="admin-form" onSubmit={handleSubmit}>
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
                <select name="sport" value={form.sport} onChange={handleChange}>
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
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

            <div className="prize-heading">Prize Details</div>

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
              <label>Google Form Registration Link</label>
              <input
                type="url"
                name="registrationLink"
                value={form.registrationLink}
                onChange={handleChange}
                placeholder="https://docs.google.com/forms/d/e/<FORM_ID>/viewform"
              />
            </div>

            {message && <div className="admin-success">✓ {message}</div>}
            {error && <div className="admin-form-error">{error}</div>}

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

        <section className="existing-events">
          <div className="admin-card-heading">
            <div>
              <span>EVENTS</span>
              <h2>Existing Events</h2>
            </div>
            <button className="refresh-button" onClick={loadEvents}>
              ↻ Refresh
            </button>
          </div>

          {eventsLoading ? (
            <div className="admin-empty">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="admin-empty">No events created yet.</div>
          ) : (
            <div className="admin-event-list">
              {events.map((event) => (
                <div className="admin-event-item" key={event._id}>
                  <div className="admin-event-image">
                    {event.eventImage ? (
                      <img src={event.eventImage} alt={event.eventName} />
                    ) : (
                      <span>{event.sport === "Football" ? "⚽" : "🏏"}</span>
                    )}
                  </div>

                  <div className="admin-event-details">
                    <span>{event.sport}</span>
                    <h3>{event.eventName}</h3>
                    <p>
                      {event.teamSize} • {event.location}
                    </p>
                    <small>{formatDate(event.eventDate)}</small>
                  </div>

                  <button
                    className="update-event-button"
                    onClick={() => handleEdit(event)}
                  >
                    Update Event
                  </button>

                  <button
                    className="manage-tournament-button"
                    onClick={() => handleManageTournament(event)}
                  >
                    Manage Tournament
                  </button>

                  <button
                    className="delete-event-button"
                    onClick={() => handleDelete(event)}
                  >
                    Delete
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

function formatInputDate(date) {
  if (!date) return "";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "";
  return value.toISOString().split("T")[0];
}

function formatDate(date) {
  if (!date) return "-";
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return "-";
  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default AdminDashboard;
