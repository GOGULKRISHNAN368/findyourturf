import { useState } from "react";

const API_URL = "http://localhost:5000";

function Admin() {
  const [form, setForm] = useState({
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
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

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
        throw new Error(
          data.message || "Failed to create event"
        );
      }

      setMessage("✅ Event uploaded successfully!");

      setForm({
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
      });
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page">

      <div className="admin-container">

        <h1>Admin Panel</h1>

        <p className="admin-subtitle">
          Upload a new Cricket or Football event
        </p>

        <form onSubmit={handleSubmit}>

          {/* Event Name */}
          <label>
            Event Name
          </label>

          <input
            type="text"
            name="eventName"
            value={form.eventName}
            onChange={handleChange}
            placeholder="Enter event name"
            required
          />

          {/* Sport */}
          <label>
            Sport
          </label>

          <select
            name="sport"
            value={form.sport}
            onChange={handleChange}
            required
          >
            <option value="Cricket">Cricket</option>
            <option value="Football">Football</option>
          </select>

          {/* Event Date */}
          <label>
            Event Date
          </label>

          <input
            type="datetime-local"
            name="eventDate"
            value={form.eventDate}
            onChange={handleChange}
            required
          />

          {/* Team Size */}
          <label>
            Team Size
          </label>

          <input
            type="text"
            name="teamSize"
            value={form.teamSize}
            onChange={handleChange}
            placeholder="Example: 8"
            required
          />

          {/* Location */}
          <label>
            Location
          </label>

          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Example: Coimbatore"
            required
          />

          {/* Registration Deadline */}
          <label>
            Registration Deadline
          </label>

          <input
            type="datetime-local"
            name="registrationDeadline"
            value={form.registrationDeadline}
            onChange={handleChange}
            required
          />

          {/* Prizes */}
          <h3>Prize Amount</h3>

          <label>
            🥇 1st Prize
          </label>

          <input
            type="number"
            name="firstPrize"
            value={form.firstPrize}
            onChange={handleChange}
            placeholder="10000"
            min="0"
            required
          />

          <label>
            🥈 2nd Prize
          </label>

          <input
            type="number"
            name="secondPrize"
            value={form.secondPrize}
            onChange={handleChange}
            placeholder="5000"
            min="0"
            required
          />

          <label>
            🥉 3rd Prize
          </label>

          <input
            type="number"
            name="thirdPrize"
            value={form.thirdPrize}
            onChange={handleChange}
            placeholder="2500"
            min="0"
            required
          />

          {/* Image */}
          <label>
            Event Image URL
          </label>

          <input
            type="url"
            name="eventImage"
            value={form.eventImage}
            onChange={handleChange}
            placeholder="https://..."
          />

          {/* Google Form */}
          <label>
            Google Form Registration Link
          </label>

          <input
            type="url"
            name="registrationLink"
            value={form.registrationLink}
            onChange={handleChange}
            placeholder="https://docs.google.com/forms/..."
            required
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Uploading..." : "UPLOAD EVENT"}
          </button>

        </form>

        {message && (
          <p className="admin-message">
            {message}
          </p>
        )}

      </div>

    </div>
  );
}

export default Admin;