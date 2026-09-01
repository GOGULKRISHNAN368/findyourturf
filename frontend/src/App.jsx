import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import "./App.css";

import { getEvents } from "./services/api";
import { socket } from "./services/socket";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScMYbYIePNN-jBfKGrxUYieYqHzFFJMdNCIJAvakRza2HU71A/viewform?usp=dialog";


// =====================================================
// PUBLIC EVENTS PAGE
// =====================================================

function PublicEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const data = await getEvents();

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Events loading error:", err);

      setError(
        "Unable to load events. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }


  // ===================================================
  // LOAD EVENTS + SOCKET CONNECTION
  // ===================================================

  useEffect(() => {
    loadEvents();

    socket.connect();


    // New event created
    socket.on("new-event", (newEvent) => {
      setEvents((currentEvents) => {

        const exists = currentEvents.some(
          (event) => event._id === newEvent._id
        );

        if (exists) {
          return currentEvents;
        }

        return [newEvent, ...currentEvents];
      });
    });


    // Event updated
    socket.on("event-updated", (updatedEvent) => {
      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event._id === updatedEvent._id
            ? updatedEvent
            : event
        )
      );
    });


    // Event deleted
    socket.on("event-deleted", ({ id }) => {
      setEvents((currentEvents) =>
        currentEvents.filter(
          (event) => event._id !== id
        )
      );
    });


    // Cleanup
    return () => {
      socket.off("new-event");
      socket.off("event-updated");
      socket.off("event-deleted");

      socket.disconnect();
    };

  }, []);


  // ===================================================
  // PUBLIC WEBSITE UI
  // ===================================================

  return (
    <div className="app">

      {/* Header */}

      <header className="hero">

        <p className="tag">
          TURF HUB
        </p>

        <h1>
          Upcoming Events
        </h1>

        <p className="subtitle">
          Find your game. Build your team. Join the competition.
        </p>

      </header>


      {/* Events */}

      <main className="events-container">

        {/* Loading */}

        {loading && (
          <p className="no-events">
            Loading events...
          </p>
        )}


        {/* Error */}

        {!loading && error && (
          <div className="no-events">

            <p>
              {error}
            </p>

            <button onClick={loadEvents}>
              Retry
            </button>

          </div>
        )}


        {/* No Events */}

        {!loading &&
          !error &&
          events.length === 0 && (
            <p className="no-events">
              No events available yet.
            </p>
          )
        }


        {/* Event Cards */}

        {!loading &&
          !error &&
          events.map((event) => (

            <div
              className="event-card"
              key={event._id}
            >

              {/* Event Image */}

              {event.eventImage && (
                <img
                  src={event.eventImage}
                  alt={event.eventName}
                  className="event-image"
                />
              )}


              <div className="event-content">

                {/* Sport */}

                <span className="sport-badge">
                  {event.sport}
                </span>


                {/* Event Name */}

                <h2>
                  {event.eventName}
                </h2>


                {/* Event Details */}

                <div className="event-details">

                  <p>
                    👥 <strong>Team Size:</strong>{" "}
                    {event.teamSize}
                  </p>

                  <p>
                    📍 <strong>Location:</strong>{" "}
                    {event.location}
                  </p>

                  <p>
                    📅 <strong>Event Date:</strong>{" "}
                    {new Date(
                      event.eventDate
                    ).toLocaleDateString()}
                  </p>

                  <p>
                    ⏰ <strong>Registration Deadline:</strong>{" "}
                    {new Date(
                      event.registrationDeadline
                    ).toLocaleDateString()}
                  </p>

                </div>


                {/* Prizes */}

                <div className="prizes">

                  <div>
                    <span>🥇</span>

                    <small>
                      1st Prize
                    </small>

                    <strong>
                      ₹{event.firstPrize}
                    </strong>
                  </div>


                  <div>
                    <span>🥈</span>

                    <small>
                      2nd Prize
                    </small>

                    <strong>
                      ₹{event.secondPrize}
                    </strong>
                  </div>


                  <div>
                    <span>🥉</span>

                    <small>
                      3rd Prize
                    </small>

                    <strong>
                      ₹{event.thirdPrize}
                    </strong>
                  </div>

                </div>


                {/* Registration */}

                <a
                  href={
                    event.registrationLink ||
                    GOOGLE_FORM_URL
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="register-button"
                >
                  REGISTER HERE
                </a>

              </div>

            </div>

          ))
        }

      </main>

    </div>
  );
}


// =====================================================
// MAIN APP + ROUTES
// =====================================================

function App() {

  return (
    <Routes>

      {/* Public Website */}

      <Route
        path="/"
        element={<PublicEvents />}
      />


      {/* Admin Login */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />


      {/* Admin Dashboard */}

      <Route
        path="/admin"
        element={<AdminDashboard />}
      />

    </Routes>
  );
}

export default App;