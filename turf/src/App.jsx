import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import "./App.css";
import { getEvent, getEvents, getTournament } from "./services/api";
import { socket } from "./services/socket";

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
      setError(err.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();

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
          event._id === updatedEvent._id ? updatedEvent : event
        )
      );
    };

    const handleDeletedEvent = ({ id }) => {
      setEvents((current) => current.filter((event) => event._id !== id));
    };

    socket.on("new-event", handleNewEvent);
    socket.on("event-updated", handleUpdatedEvent);
    socket.on("event-deleted", handleDeletedEvent);

    return () => {
      socket.off("new-event", handleNewEvent);
      socket.off("event-updated", handleUpdatedEvent);
      socket.off("event-deleted", handleDeletedEvent);
    };
  }, []);

  return {
    events,
    loading,
    error,
    loadEvents,
  };
}

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
            Discover and join exciting cricket & football tournaments near you.
          </p>

          <div className="hero-buttons">
            <Link to="/events" className="btn btn-primary">
              Explore Events
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
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
            <p>Find your game. Build your team. Join the competition.</p>
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

function HowItWorks() {
  return (
    <section className="how-section" id="how-it-works">
      <div className="section-title centered">
        <span>HOW IT WORKS</span>
        <h2>Join in 3 Simple Steps</h2>
      </div>

      <div className="steps">
        <div className="step">
          <div className="step-icon">1</div>
          <h3>Explore Events</h3>
          <p>Browse upcoming cricket and football tournaments.</p>
        </div>
        <div className="step">
          <div className="step-icon">2</div>
          <h3>Choose Your Game</h3>
          <p>Check the date, location, team size and prizes.</p>
        </div>
        <div className="step">
          <div className="step-icon">3</div>
          <h3>Register</h3>
          <p>Open the registration form and register your team.</p>
        </div>
      </div>
    </section>
  );
}

function EventGrid({ limit }) {
  const { events, loading, error, loadEvents } = useEvents();

  if (loading) {
    return <div className="status-box">Loading events...</div>;
  }

  if (error) {
    return (
      <div className="status-box">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadEvents}>
          Try Again
        </button>
      </div>
    );
  }

  const visibleEvents = limit ? events.slice(0, limit) : events;

  if (visibleEvents.length === 0) {
    return (
      <div className="status-box">
        <div className="status-icon">🏟️</div>
        <h3>No events available yet</h3>
        <p>New tournaments will appear here soon.</p>
      </div>
    );
  }

  return (
    <div className="event-grid">
      {visibleEvents.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );
}

function EventCard({ event }) {
  return (
    <article className="event-card">
      <div className="event-image">
        {event.eventImage ? (
          <img src={event.eventImage} alt={event.eventName} />
        ) : (
          <div className="image-placeholder">
            {event.sport === "Football" ? "⚽" : "🏏"}
          </div>
        )}
        <span className="sport-badge">{event.sport}</span>
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
            Registration ends {formatDate(event.registrationDeadline)}
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

        <Link to={`/events/${event._id}`} className="details-button">
          View Details
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

function EventsPage() {
  return (
    <div className="user-page">
      <Navbar />

      <section className="simple-header">
        <span>TOURNAMENTS</span>
        <h1>Explore Events</h1>
        <p>Find a tournament and get your team ready.</p>
      </section>

      <main className="events-page">
        <EventGrid />
      </main>
    </div>
  );
}

function isSameEvent(tournament, eventId) {
  if (!tournament?.event) {
    return false;
  }

  const eventValue = tournament.event;
  const tournamentEventId =
    typeof eventValue === "object" ? eventValue._id : eventValue;

  return String(tournamentEventId) === String(eventId);
}

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScMYbYIePNN-jBfKGrxUYieYqHzFFJMdNCIJAvakRza2HU71A/viewform?usp=publish-editor";

function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [tournament, setTournament] = useState({
    teams: [],
    matches: [],
    winner1: null,
    winner2: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError("");

        const [eventData, tournamentData] = await Promise.all([
          getEvent(id),
          getTournament(id),
        ]);

        if (!mounted) {
          return;
        }

        setEvent(eventData);
        setTournament(
          tournamentData || {
            teams: [],
            matches: [],
            winner1: null,
            winner2: null,
          }
        );
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load tournament.");
          setEvent(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPage();

    const handleEventUpdated = (updatedEvent) => {
      if (String(updatedEvent?._id) === String(id)) {
        setEvent(updatedEvent);
      }
    };

    const handleEventDeleted = ({ id: deletedId }) => {
      if (String(deletedId) === String(id)) {
        setEvent(null);
        setError("This tournament is no longer available.");
      }
    };

    const handleTournamentUpdated = (updatedTournament) => {
      if (isSameEvent(updatedTournament, id)) {
        setTournament(updatedTournament);
      }
    };

    const handleLiveScoreUpdated = (payload) => {
      const updatedTournament = payload?.tournament || payload;
      if (isSameEvent(updatedTournament, id)) {
        setTournament(updatedTournament);
      }
    };

    socket.on("event-updated", handleEventUpdated);
    socket.on("event-deleted", handleEventDeleted);
    socket.on("tournament-updated", handleTournamentUpdated);
    socket.on("live-score-updated", handleLiveScoreUpdated);

    return () => {
      mounted = false;
      socket.off("event-updated", handleEventUpdated);
      socket.off("event-deleted", handleEventDeleted);
      socket.off("tournament-updated", handleTournamentUpdated);
      socket.off("live-score-updated", handleLiveScoreUpdated);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="user-page">
        <Navbar />
        <div className="status-box">Loading tournament...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="user-page">
        <Navbar />
        <div className="not-found">
          <h1>Tournament Not Found</h1>
          <p>{error || "This tournament is no longer available."}</p>
          <button className="btn btn-primary" onClick={() => navigate("/events")}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const teams = tournament?.teams || [];
  const matches = tournament?.matches || [];
  const hasWinners = Boolean(tournament?.winner1 || tournament?.winner2);

  return (
    <div className="user-page">
      <Navbar />

      <main className="details-page">
        <button className="back-link" onClick={() => navigate("/events")}>
          ← Back to Events
        </button>

        <div className="details-image">
          {event.eventImage ? (
            <img src={event.eventImage} alt={event.eventName} />
          ) : (
            <div className="image-placeholder large">
              {event.sport === "Football" ? "⚽" : "🏏"}
            </div>
          )}
        </div>

        <div className="details-content">
          <span className="details-sport">{event.sport}</span>
          <h1>{event.eventName}</h1>

          <div className="details-info-grid">
            <div>
              <small>Team Size</small>
              <strong>👥 {event.teamSize}</strong>
            </div>
            <div>
              <small>Event Date</small>
              <strong>📅 {formatDate(event.eventDate)}</strong>
            </div>
            <div>
              <small>Registration Deadline</small>
              <strong>⏰ {formatDate(event.registrationDeadline)}</strong>
            </div>
            <div>
              <small>Location</small>
              <strong>📍 {event.location}</strong>
            </div>
          </div>

          <div className="prize-section">
            <h2>Prize Details</h2>
            <div className="large-prizes">
              <div>
                <span>🥇</span>
                <small>1st Prize</small>
                <strong>₹{event.firstPrize || 0}</strong>
              </div>
              <div>
                <span>🥈</span>
                <small>2nd Prize</small>
                <strong>₹{event.secondPrize || 0}</strong>
              </div>
              <div>
                <span>🥉</span>
                <small>3rd Prize</small>
                <strong>₹{event.thirdPrize || 0}</strong>
              </div>
            </div>
          </div>

          <section className="tournament-section">
            <span className="section-kicker">TOURNAMENT</span>
            <h2>Participating Teams</h2>
            {teams.length === 0 ? (
              <div className="status-box compact">
                <h3>Teams not announced yet</h3>
                <p>Team lists will appear here once the admin assigns them.</p>
              </div>
            ) : (
              <div className="public-teams">
                {teams.map((team, index) => (
                  <div key={`${team}-${index}`} className="public-team">
                    {index + 1}. {team}
                  </div>
                ))}
              </div>
            )}
          </section>

          {hasWinners && (
            <section className="tournament-section">
              <span className="section-kicker">QUALIFIED TEAMS</span>
              <h2>Round 1 Winners</h2>
              <div className="public-winners">
                <div>
                  <small>Winner 1</small>
                  <h3>🏆 {tournament.winner1 || "Waiting..."}</h3>
                </div>
                <div>
                  <small>Winner 2</small>
                  <h3>🏆 {tournament.winner2 || "Waiting..."}</h3>
                </div>
              </div>
            </section>
          )}

          <section className="tournament-section">
            <span className="section-kicker">LIVE TOURNAMENT</span>
            <h2>Bracket & Matches</h2>
            {matches.length === 0 ? (
              <div className="status-box compact">
                <h3>Tournament has not started yet</h3>
                <p>
                  Matches, live scores and winners will appear here after the
                  admin creates them.
                </p>
              </div>
            ) : (
              ["Round 1", "Round 2", "Semi Final", "Final"].map((round) => {
                const roundMatches = matches
                  .filter((match) => match.round === round)
                  .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0));

                if (roundMatches.length === 0) {
                  return null;
                }

                return (
                  <div key={round} className="public-round-block">
                    <h3>{round}</h3>
                    <div className="public-matches">
                      {roundMatches.map((match) => (
                        <div
                          key={match._id || `${round}-${match.matchNumber}`}
                          className="public-match"
                        >
                          <div className="public-match-header">
                            <div>
                              <strong>{match.round}</strong>
                              <div>Match {match.matchNumber}</div>
                            </div>
                            <span
                              className={`match-status ${String(
                                match.status || ""
                              ).toLowerCase()}`}
                            >
                              {match.status}
                            </span>
                          </div>

                          <div className="public-score-row">
                            <strong>{match.team1 || "TBD"}</strong>
                            <strong>
                              {match.team1Score || 0}/{match.team1Wickets || 0}
                            </strong>
                          </div>
                          <div className="public-score-row">
                            <strong>{match.team2 || "TBD"}</strong>
                            <strong>
                              {match.team2Score || 0}/{match.team2Wickets || 0}
                            </strong>
                          </div>

                          {match.winner ? (
                            <div className="public-winner-banner">
                              🏆 Winner: {match.winner}
                            </div>
                          ) : (
                            <div className="public-winner-banner">
                              Winner: Waiting...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <div className="register-section">
            <div>
              <h2>Ready to play?</h2>
              <p>
                Complete the registration form to participate in this tournament.
              </p>
            </div>

            <a
              href={GOOGLE_FORM_URL}
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

function formatDate(date) {
  if (!date) {
    return "-";
  }

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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<TournamentDetails />} />
    </Routes>
  );
}

export default App;
