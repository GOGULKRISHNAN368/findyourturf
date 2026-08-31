import { useEffect, useState } from "react";
import "./App.css";
import { getEvents } from "./services/api";
import { socket } from "./services/socket";

// 🔗 Paste your actual Google Form link here
const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScMYbYIePNN-jBfKGrxUYieYqHzFFJMdNCIJAvakRza2HU71A/viewform?usp=publish-editor";

// Temporary events until backend is ready
const fallbackEvents = [
  {
    id: "demo-cricket",
    sport: "Cricket",
    title: "Night Cricket League",
    image:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=80",
    teamSize: 8,
    location: "Coimbatore",
    firstPrize: "₹10,000",
    secondPrize: "₹5,000",
    thirdPrize: "₹2,500",
    registerLink: GOOGLE_FORM_URL,
  },
  {
    id: "demo-football",
    sport: "Football",
    title: "Turf Football Championship",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=80",
    teamSize: 8,
    location: "Coimbatore",
    firstPrize: "₹10,000",
    secondPrize: "₹5,000",
    thirdPrize: "₹2,500",
    registerLink: GOOGLE_FORM_URL,
  },
];

function App() {
  const [events, setEvents] = useState(fallbackEvents);

  useEffect(() => {
    // Get events from backend
    loadEvents();

    // Connect to WebSocket
    socket.connect();

    // Listen for newly uploaded events
    socket.on("new-event", (newEvent) => {
      setEvents((currentEvents) => {
        const alreadyExists = currentEvents.some(
          (event) =>
            event.id === newEvent.id ||
            event._id === newEvent._id
        );

        if (alreadyExists) {
          return currentEvents;
        }

        return [...currentEvents, newEvent];
      });
    });

    // Cleanup
    return () => {
      socket.off("new-event");
      socket.disconnect();
    };
  }, []);

  async function loadEvents() {
    try {
      const data = await getEvents();

      // If backend has events, display them
      if (Array.isArray(data) && data.length > 0) {
        setEvents(data);
      }
    } catch (error) {
      // Backend is not ready yet
      console.log(
        "Backend not connected yet:",
        error.message
      );
    }
  }

  return (
    <div className="app">

      {/* Header */}
      <header className="hero">
        <p className="tag">TURF HUB</p>

        <h1>Upcoming Events</h1>

        <p className="subtitle">
          Find your game. Build your team. Join the competition.
        </p>
      </header>

      {/* Events */}
      <main className="events-container">

        {events.length === 0 ? (
          <p className="no-events">
            No events available yet.
          </p>
        ) : (
          events.map((event) => (
            <div
              className="event-card"
              key={event.id || event._id}
            >

              {/* Event Image */}
              <img
                src={event.image}
                alt={`${event.sport} event`}
                className="event-image"
              />

              <div className="event-content">

                {/* Sport */}
                <span className="sport-badge">
                  {event.sport}
                </span>

                {/* Title */}
                <h2>{event.title}</h2>

                {/* Details */}
                <div className="event-details">

                  <p>
                    <strong>👥 Team Size:</strong>{" "}
                    {event.teamSize}
                  </p>

                  <p>
                    <strong>📍 Location:</strong>{" "}
                    {event.location}
                  </p>

                </div>

                {/* Prizes */}
                <div className="prizes">

                  <div>
                    <span>🥇</span>
                    <small>1st Prize</small>
                    <strong>
                      {event.firstPrize}
                    </strong>
                  </div>

                  <div>
                    <span>🥈</span>
                    <small>2nd Prize</small>
                    <strong>
                      {event.secondPrize}
                    </strong>
                  </div>

                  <div>
                    <span>🥉</span>
                    <small>3rd Prize</small>
                    <strong>
                      {event.thirdPrize}
                    </strong>
                  </div>

                </div>

                {/* Register */}
                <a
                  href={
                    event.registerLink ||
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
        )}

      </main>
    </div>
  );
}

export default App;