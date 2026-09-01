import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import "./App.css";
import { getEvents } from "./services/api";
import { socket } from "./services/socket";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const DEFAULT_FORM =
  "https://docs.google.com/forms/d/e/1FAIpQLScMYbYIePNN-jBfKGrxUYieYqHzFFJMdNCIJAvakRza2HU71A/viewform?usp=dialogr";

function useEvents() {
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
      console.error(err);
      setError("Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();

    socket.connect();

    const handleNewEvent = (event) => {
      setEvents((current) => {
        if (current.some((item) => item._id === event._id)) {
          return current;
        }

        return [event, ...current];
      });
    };

    const handleUpdatedEvent = (updatedEvent) => {
      setEvents((current) =>
        current.map((event) =>
          event._id === updatedEvent._id
            ? updatedEvent
            : event
        )
      );
    };

    const handleDeletedEvent = ({ id }) => {
      setEvents((current) =>
        current.filter((event) => event._id !== id)
      );
    };

    socket.on("new-event", handleNewEvent);
    socket.on("event-updated", handleUpdatedEvent);
    socket.on("event-deleted", handleDeletedEvent);

    return () => {
      socket.off("new-event", handleNewEvent);
      socket.off("event-updated", handleUpdatedEvent);
      socket.off("event-deleted", handleDeletedEvent);
      socket.disconnect();
    };
  }, []);

  return {
    events,
    loading,
    error,
    loadEvents,
  };
}

/* =========================
   USER NAVBAR
========================= */

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="logo">
        <span className="logo-mark">⚽</span>

        <span>
          <strong>TURF HUB</strong>
          <small>PLAY • COMPETE • WIN</small>
        </span>
      </Link>

      <nav>
        <Link to="/">Home</Link>
        <Link to="/events">Explore Events</Link>
        <a href="/#how-it-works">How It Works</a>
      </nav>
    </header>
  );
}

/* =========================
   HOME
========================= */

function Home() {
  return (
    <div className="user-page">
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <span className="hero-label">
            CRICKET • FOOTBALL • TOURNAMENTS
          </span>

          <h1>
            Find Your Game.
            <br />
            <span>Play Your Best.</span>
          </h1>

          <p>
            Discover and join exciting cricket & football
            tournaments near you.
          </p>

          <div className="hero-buttons">
            <Link to="/events" className="btn btn-primary">
              Explore Events
            </Link>

            <a
              href="#how-it-works"
              className="btn btn-secondary"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      <section className="events-section">
        <div className="section-title">
          <div>
            <span>UPCOMING TOURNAMENTS</span>
            <h2>Upcoming Events</h2>
            <p>
              Find your game. Build your team. Join the competition.
            </p>
          </div>

          <Link to="/events" className="view-all">
            View all events →
          </Link>
        </div>

        <EventGrid limit={3} />
      </section>

      <HowItWorks />

      <footer className="footer">
        <strong>TURF HUB</strong>
        <span>Sports tournaments made simple.</span>
      </footer>
    </div>
  );
}

/* =========================
   HOW IT WORKS
========================= */

function HowItWorks() {
  return (
    <section
      className="how-section"
      id="how-it-works"
    >
      <div className="section-title centered">
        <span>HOW IT WORKS</span>
        <h2>Join in 3 Simple Steps</h2>
      </div>

      <div className="steps">
        <div className="step">
          <div className="step-icon">1</div>
          <h3>Explore Events</h3>
          <p>
            Browse upcoming cricket and football tournaments.
          </p>
        </div>

        <div className="step">
          <div className="step-icon">2</div>
          <h3>Choose Your Game</h3>
          <p>
            Check the date, location, team size and prizes.
          </p>
        </div>

        <div className="step">
          <div className="step-icon">3</div>
          <h3>Register</h3>
          <p>
            Open the registration form and register your team.
          </p>
        </div>
      </div>
    </section>
  );
}

/* =========================
   EVENTS GRID
========================= */

function EventGrid({ limit }) {
  const {
    events,
    loading,
    error,
    loadEvents,
  } = useEvents();

  if (loading) {
    return (
      <div className="status-box">
        Loading events...
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-box">
        <p>{error}</p>

        <button
          className="btn btn-primary"
          onClick={loadEvents}
        >
          Try Again
        </button>
      </div>
    );
  }

  const visibleEvents = limit
    ? events.slice(0, limit)
    : events;

  if (visibleEvents.length === 0) {
    return (
      <div className="status-box">
        <div className="status-icon">🏟️</div>

        <h3>No events available yet</h3>

        <p>
          New tournaments will appear here soon.
        </p>
      </div>
    );
  }

  return (
    <div className="event-grid">
      {visibleEvents.map((event) => (
        <EventCard
          key={event._id}
          event={event}
        />
      ))}
    </div>
  );
}

/* =========================
   EVENT CARD
========================= */

function EventCard({ event }) {
  return (
    <article className="event-card">
      <div className="event-image">
        {event.eventImage ? (
          <img
            src={event.eventImage}
            alt={event.eventName}
          />
        ) : (
          <div className="image-placeholder">
            {event.sport === "Football"
              ? "⚽"
              : "🏏"}
          </div>
        )}

        <span className="sport-badge">
          {event.sport}
        </span>
      </div>

      <div className="event-body">
        <h3>{event.eventName}</h3>

        <div className="event-info">
          <p>
            <span>👥</span>
            {event.teamSize}
          </p>

          <p>
            <span>📍</span>
            {event.location}
          </p>

          <p>
            <span>📅</span>
            {formatDate(event.eventDate)}
          </p>

          <p>
            <span>⏰</span>
            Registration ends{" "}
            {formatDate(event.registrationDeadline)}
          </p>
        </div>

        <div className="card-prizes">
          <div>
            <small>1st Prize</small>
            <strong>₹{event.firstPrize || 0}</strong>
          </div>

          <div>
            <small>2nd Prize</small>
            <strong>₹{event.secondPrize || 0}</strong>
          </div>

          <div>
            <small>3rd Prize</small>
            <strong>₹{event.thirdPrize || 0}</strong>
          </div>
        </div>

        <Link
          to={`/events/${event._id}`}
          className="details-button"
        >
          View Details
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

/* =========================
   EVENTS PAGE
========================= */

function EventsPage() {
  return (
    <div className="user-page">
      <Navbar />

      <section className="simple-header">
        <span>TOURNAMENTS</span>

        <h1>Explore Events</h1>

        <p>
          Find a tournament and get your team ready.
        </p>
      </section>

      <main className="events-page">
        <EventGrid />
      </main>
    </div>
  );
}

/* =========================
   TOURNAMENT DETAILS
========================= */

function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    events,
    loading,
  } = useEvents();

  if (loading) {
    return (
      <div className="user-page">
        <Navbar />

        <div className="status-box">
          Loading tournament...
        </div>
      </div>
    );
  }

  const event = events.find(
    (item) => String(item._id) === String(id)
  );

  if (!event) {
    return (
      <div className="user-page">
        <Navbar />

        <div className="not-found">
          <h1>Tournament Not Found</h1>

          <p>
            This tournament is no longer available.
          </p>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/events")}
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const registrationLink =
    event.registrationLink || DEFAULT_FORM;

  return (
    <div className="user-page">
      <Navbar />

      <main className="details-page">
        <button
          className="back-link"
          onClick={() => navigate("/events")}
        >
          ← Back to Events
        </button>

        <div className="details-image">
          {event.eventImage ? (
            <img
              src={event.eventImage}
              alt={event.eventName}
            />
          ) : (
            <div className="image-placeholder large">
              {event.sport === "Football"
                ? "⚽"
                : "🏏"}
            </div>
          )}
        </div>

        <div className="details-content">
          <span className="details-sport">
            {event.sport}
          </span>

          <h1>{event.eventName}</h1>

          <div className="details-info-grid">
            <div>
              <small>Team Size</small>
              <strong>👥 {event.teamSize}</strong>
            </div>

            <div>
              <small>Event Date</small>
              <strong>
                📅 {formatDate(event.eventDate)}
              </strong>
            </div>

            <div>
              <small>Registration Deadline</small>
              <strong>
                ⏰{" "}
                {formatDate(
                  event.registrationDeadline
                )}
              </strong>
            </div>

            <div>
              <small>Location</small>
              <strong>
                📍 {event.location}
              </strong>
            </div>
          </div>

          <div className="prize-section">
            <h2>Prize Details</h2>

            <div className="large-prizes">
              <div>
                <span>🥇</span>
                <small>1st Prize</small>
                <strong>
                  ₹{event.firstPrize || 0}
                </strong>
              </div>

              <div>
                <span>🥈</span>
                <small>2nd Prize</small>
                <strong>
                  ₹{event.secondPrize || 0}
                </strong>
              </div>

              <div>
                <span>🥉</span>
                <small>3rd Prize</small>
                <strong>
                  ₹{event.thirdPrize || 0}
                </strong>
              </div>
            </div>
          </div>

          <div className="register-section">
            <div>
              <h2>Ready to play?</h2>

              <p>
                Complete the registration form to
                participate in this tournament.
              </p>
            </div>

            <a
              href={registrationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="register-button"
            >
              Register Now →
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

/* =========================
   HELPERS
========================= */

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

/* =========================
   ROUTES
========================= */

function App() {
  return (
    <Routes>
      {/* USER */}
      <Route path="/" element={<Home />} />

      <Route
        path="/events"
        element={<EventsPage />}
      />

      <Route
        path="/events/:id"
        element={<TournamentDetails />}
      />

      {/* ADMIN - SEPARATE */}
      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin"
        element={<AdminDashboard />}
      />
    </Routes>
  );
}

export default App;