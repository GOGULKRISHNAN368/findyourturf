import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams
} from "react-router-dom";
import {
  Bell,
  User,
  Trophy,
  Calendar,
  PlayCircle,
  ChevronRight,
  MapPin,
  Search,
  ArrowRight,
  Heart,
  Star,
  Users,
  ArrowLeft,
  Share2,
  CalendarDays,
  Clock
} from "lucide-react";

import "./App.css";
import { getEvent, getEvents, getTournament, getTurfs } from "./services/api";
import { socket } from "./services/socket";

// Pages
import BookTurf from "./pages/BookTurf";
import TurfDetails from "./pages/TurfDetails";
import Checkout from "./pages/Checkout";
import UserLiveMatches from "./pages/UserLiveMatches";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import BottomNav from "./components/BottomNav";
import { getNotificationsSeenAt } from "./services/profile";

// Banners
import banner1 from "./assets/banners/promo_tournaments_1788516995082.jpg";
import banner2 from "./assets/banners/promo_book_turf_1788516919639.jpg";
import banner3 from "./assets/banners/promo_find_players_1788516932200.jpg";

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

function MobileHeader() {
  const navigate = useNavigate();
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    // Show the unread dot until the user opens the notifications screen once.
    setShowBadge(!getNotificationsSeenAt());
  }, []);

  return (
    <header className="app-header">
      <div className="header-logo-container">
        <div className="header-f-icon">F</div>
        <div className="header-text-group">
          <div className="header-brand">FindYour<span>Turf</span></div>
          <div className="header-tagline">Play • Book • Compete • Connect</div>
        </div>
      </div>
      <div className="header-right">
        <button
          className="notification-btn"
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
        >
          <Bell size={22} color="#0E1224" />
          {showBadge && <div className="notification-badge" />}
        </button>
        <button
          className="profile-avatar-circle"
          aria-label="Profile"
          onClick={() => navigate("/profile")}
        >
          <User size={24} />
        </button>
      </div>
    </header>
  );
}

function LocationSearch() {
  return (
    <div className="location-search-row">
      <div className="loc-selector">
        <MapPin size={18} color="#0E1224" />
        <span className="loc-selector-text">Coimbatore</span>
      </div>
      <div className="search-input-box">
        <Search size={20} color="#9297A8" />
        <input type="text" placeholder="Search turfs, tournaments, players..." />
      </div>
    </div>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  
  return (
    <div className="qa-container">
      <button className="qa-card purple-bg" onClick={() => navigate("/events")}>
        <Trophy size={28} className="qa-icon-top" />
        <Trophy size={90} className="qa-bg-icon" />
        <div className="qa-title">Explore<br/>Events</div>
        <div className="qa-arrow-btn"><ArrowRight size={16} /></div>
      </button>
      <button className="qa-card teal-bg" onClick={() => navigate("/turfs")}>
        <Calendar size={28} className="qa-icon-top" />
        <Calendar size={90} className="qa-bg-icon" />
        <div className="qa-title">Book<br/>Turf</div>
        <div className="qa-arrow-btn"><ArrowRight size={16} /></div>
      </button>
      <button className="qa-card coral-bg" onClick={() => navigate("/live")}>
        <PlayCircle size={28} className="qa-icon-top" />
        <PlayCircle size={90} className="qa-bg-icon" />
        <div className="qa-title">See Live<br/>Matches</div>
        <div className="qa-arrow-btn"><ArrowRight size={16} /></div>
      </button>
    </div>
  );
}

function PromotionalSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      image: banner1,
      eyebrow: "TOURNAMENTS • CRICKET • FOOTBALL",
      headline: <>See all the<br/><span>tournaments</span></>,
      description: "Discover upcoming cricket and football tournaments near you."
    },
    {
      image: banner2,
      eyebrow: "BOOK TURF • ONLINE • EASY SLOTS",
      headline: <>Book your<br/><span>turf online</span></>,
      description: "Choose your time slot and reserve your game instantly."
    },
    {
      image: banner3,
      eyebrow: "PLAY TOGETHER • CONNECT • TEAM UP",
      headline: <>Find the<br/><span>partner to play</span></>,
      description: "Connect with nearby players and build your team fast."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="promo-banner">
      <img src={slides[currentSlide].image} alt="Promotion" className="promo-bg-img" />
      <div className="promo-overlay-new">
        <div className="promo-eyebrow-new">{slides[currentSlide].eyebrow}</div>
        <div className="promo-headline-new">{slides[currentSlide].headline}</div>
        <div className="promo-desc-new">{slides[currentSlide].description}</div>
      </div>
      <div className="promo-dots">
        {slides.map((_, index) => (
          <div key={index} className={`promo-dot-new ${index === currentSlide ? "active" : ""}`} />
        ))}
      </div>
    </div>
  );
}

const BottomNavigation = BottomNav;

function Home() {
  const navigate = useNavigate();
  return (
    <div className="mobile-app-container">
      <MobileHeader />
      <LocationSearch />

      <div className="home-scroll-area" style={{ paddingBottom: 100 }}>
        <QuickActions />
        
        <PromotionalSlider />

        <section className="section-container">
          <div className="section-header-row">
            <h2>Upcoming Tournaments</h2>
            <span
              className="section-view-all"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate("/events")}
            >
              View All <ChevronRight size={16} />
            </span>
          </div>
          <EventGrid limit={4} />
        </section>

        <section className="section-container">
          <div className="section-header-row">
            <h2>Nearby Turfs</h2>
            <span
              className="section-view-all"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate("/turfs")}
            >
              View All <ChevronRight size={16} />
            </span>
          </div>
          <NearbyTurfs />
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
}

function EventGrid({ limit }) {
  const { events, loading, error, loadEvents } = useEvents();

  if (loading) return <div className="status-box">Loading events...</div>;
  if (error) return <div className="status-box"><p>{error}</p><button className="btn-primary" onClick={loadEvents}>Try Again</button></div>;

  const visibleEvents = limit ? events.slice(0, limit) : events;

  if (visibleEvents.length === 0) return <div className="status-box"><h3>No events</h3></div>;

  return (
    <div className="horiz-scroll-list">
      {visibleEvents.map((event) => (
        <EventCard key={event._id} event={event} />
      ))}
    </div>
  );
}

function EventCard({ event }) {
  const navigate = useNavigate();

  const isNightRiders = event.eventName === 'night riders';
  const displayTitle = isNightRiders ? 'One Day Cricket Turf Tournament' : (event.eventName || 'One Day Cricket Turf Tournament');
  const displayLocation = isNightRiders ? 'Coimbatore' : (event.location || 'Coimbatore');
  const displayDate = isNightRiders ? '12 Sept 2026' : (event.eventDate ? formatDate(event.eventDate) : '12 Sept 2026');
  const displayImage = isNightRiders ? '/cricket-turf.jpg' : (event.eventImage || (event.sport === 'Football' ? "https://images.unsplash.com/photo-1518605368461-1ee18eb1e79f?w=600&q=80" : "/cricket-turf.jpg"));

  return (
    <article className="tourney-h-card" onClick={() => navigate(`/events/${event._id}`)}>
      <div className="th-img-box">
        <img 
          src={displayImage} 
          alt={displayTitle} 
        />
      </div>
      <div className="th-content">
        <div className="th-meta-row">
          <Calendar size={12} color="#7047FF" /> {displayDate}
        </div>
        <h3 className="th-title">{displayTitle}</h3>
        <div className="th-meta-row" style={{marginBottom: 8}}>
          <MapPin size={12} /> {displayLocation}
        </div>
        <div className="th-meta-row">
          <Users size={12} /> {event.maxTeams || 16} Teams
        </div>
        <div className="th-arrow-btn"><ArrowRight size={14} /></div>
      </div>
    </article>
  );
}

// "Nearby" for this launch = turfs around Peelamedu / Coimbatore,
// and we intentionally do not surface Berkley Sports Center.
const NEARBY_AREAS = ["peelamedu", "coimbatore"];
const NEARBY_EXCLUDE = ["berkley"];

function filterNearbyTurfs(turfs) {
  const matched = turfs.filter((t) => {
    const loc = `${t.location || ""} ${t.name || ""}`.toLowerCase();
    const inArea = NEARBY_AREAS.some((a) => loc.includes(a));
    const excluded = NEARBY_EXCLUDE.some((x) =>
      (t.name || "").toLowerCase().includes(x)
    );
    return inArea && !excluded;
  });
  // Until the Coimbatore turfs are added in admin, fall back to the full
  // list (minus excluded) so the section is never empty.
  if (matched.length > 0) return matched;
  return turfs.filter(
    (t) => !NEARBY_EXCLUDE.some((x) => (t.name || "").toLowerCase().includes(x))
  );
}

function NearbyTurfs() {
  const [turfs, setTurfs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getTurfs().then(data => setTurfs(data || [])).catch(err => console.error(err));
  }, []);

  const nearby = filterNearbyTurfs(turfs);

  if (nearby.length === 0) return null;

  return (
    <div className="horiz-scroll-list">
      {nearby.map(turf => (
        <article key={turf._id} className="turf-h-card" onClick={() => navigate(`/turfs/${turf._id}`)}>
          <div className="turf-h-img-box">
            <img src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop" alt={turf.name} />
            <div className="turf-h-heart"><Heart size={16} /></div>
            <div className="turf-h-rating"><Star size={12} fill="#fff" /> 4.8 (120)</div>
          </div>
          <div className="turf-h-content">
            <h3 className="turf-h-title">{turf.name}</h3>
            <div className="turf-h-loc"><MapPin size={12} /> {turf.location}</div>
            <div className="turf-h-bottom">
              <div className="turf-h-sport">
                {turf.sportType === 'Football' ? '⚽' : '🏏'} {turf.sportType} • 5v5
              </div>
              <div className="turf-h-price">
                <span>From</span>
                <strong>₹{turf.pricePerHour}/hr</strong>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function EventsPage() {
  return (
    <div className="mobile-app-container">
      <MobileHeader />

      <div className="home-scroll-area">
        <div className="section-header" style={{marginTop: 16}}>
          <h2>All Tournaments</h2>
        </div>
        <EventGrid />
      </div>

      <BottomNavigation />
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
  "https://docs.google.com/forms/d/e/1FAIpQLScMYbYIePNN-jBfKGrxUYieYqHzFFJMdNCIJAvakRza2HU71A/viewform";

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
  const [activeTab, setActiveTab] = useState('Overview');

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

    const handleEventDeleted = (deletedId) => {
      if (String(deletedId) === String(id)) {
        setError("This tournament has been deleted.");
        setEvent(null);
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
      <div className="mobile-app-container">
        <MobileHeader />
        <div className="status-box">Loading tournament...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mobile-app-container">
        <MobileHeader />
        <div className="status-box">
          <h3>Tournament Not Found</h3>
          <p>{error || "This tournament is no longer available."}</p>
          <button className="btn-primary" onClick={() => navigate("/events")}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  const isClosed = event.registrationDeadline ? new Date(event.registrationDeadline) < new Date() : false;

  const fallbackImage = event.sport === 'Football' ? "https://images.unsplash.com/photo-1518605368461-1ee18eb1e79f?w=600&q=80" : "/cricket-turf.jpg";
  const displayImage = event.eventImage || fallbackImage;

  return (
    <div className="mobile-app-container td-page-bg">
      <div className="td-hero">
        <img 
          src={displayImage} 
          alt={event.eventName || 'Tournament'} 
          className="td-hero-img" 
        />
        <div className="td-hero-overlay"></div>
        <div className="td-top-controls">
          <button className="td-icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={22} color="#fff" /></button>
          <div style={{display:'flex', gap:10}}>
            <button className="td-icon-btn"><Share2 size={22} color="#fff" /></button>
            <button className="td-icon-btn"><Heart size={22} color="#fff" /></button>
          </div>
        </div>
        <div className="td-hero-content">
          <div className="td-sport-badge">{event.sport}</div>
          <h1 className="td-title">{event.eventName || 'Tournament'}</h1>
          <div className="td-quick-info">
            <div className="td-qi-item"><MapPin size={14} /> {event.location || 'Location TBA'}</div>
            <div className="td-qi-sep">|</div>
            <div className="td-qi-item"><CalendarDays size={14} /> {event.eventDate ? formatDate(event.eventDate) : 'Date TBA'}</div>
            <div className="td-qi-sep">|</div>
            <div className="td-qi-item"><Users size={14} /> {event.maxTeams || 16} Teams</div>
          </div>
        </div>
      </div>

      <div className="td-sheet">
        <div className="td-tabs">
          {['Overview', 'Rules', 'Prizes', 'Venue', 'Contact'].map(tab => (
            <div 
              key={tab} 
              className={`td-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {activeTab === tab && <div className="td-tab-indicator" />}
            </div>
          ))}
        </div>

        <div className="td-content">
          {activeTab === 'Overview' && (
            <>
              <h2 className="td-section-title">Tournament Information</h2>
              <div className="td-info-grid">
                <div className="td-info-card">
                  <div className="td-ic-icon"><Users size={22} /></div>
                  <div className="td-ic-text">
                    <small>Team Size</small>
                    <strong>{event.teamSize || '8 Players + 1 Impact'}</strong>
                  </div>
                </div>
                <div className="td-info-card">
                  <div className="td-ic-icon"><CalendarDays size={22} /></div>
                  <div className="td-ic-text">
                    <small>Event Date</small>
                    <strong>{event.eventDate ? formatDate(event.eventDate) : 'TBA'}</strong>
                  </div>
                </div>
                <div className="td-info-card">
                  <div className="td-ic-icon"><Clock size={22} /></div>
                  <div className="td-ic-text">
                    <small>Registration Deadline</small>
                    <strong>{event.registrationDeadline ? formatDate(event.registrationDeadline) : 'TBA'}</strong>
                  </div>
                </div>
                <div className="td-info-card">
                  <div className="td-ic-icon"><MapPin size={22} /></div>
                  <div className="td-ic-text">
                    <small>Location</small>
                    <strong>{event.location || 'TBA'}</strong>
                  </div>
                </div>
              </div>

              <div className="td-divider" />
              
              <h2 className="td-section-title">About Tournament</h2>
              <div style={{fontSize: 14, color: '#5E6578', lineHeight: 1.55, marginBottom: 24, whiteSpace: 'pre-wrap'}}>
                {event.description || 'Information about this tournament will be updated soon.'}
              </div>

              <h2 className="td-section-title">Prize Details</h2>
              <div className="td-prize-cards">
                <div className="td-prize-card gold">
                  <div className="td-prize-label"><Trophy size={16} /> 1st Prize</div>
                  <div className="td-prize-amt">₹{event.firstPrize || '0'}</div>
                </div>
                <div className="td-prize-card silver">
                  <div className="td-prize-label"><Trophy size={16} color="#8A90A2" /> 2nd Prize</div>
                  <div className="td-prize-amt">₹{event.secondPrize || '0'}</div>
                </div>
              </div>

              <div className="td-divider" />

              <h2 className="td-section-title">Key Highlights</h2>
              <div style={{fontSize: 14, color: '#5E6578', lineHeight: 1.55, whiteSpace: 'pre-wrap'}}>
                {event.keyHighlights || 'No key highlights available.'}
              </div>
            </>
          )}

          {activeTab === 'Rules' && (
            <div style={{paddingTop: 10}}>
              <h2 className="td-section-title">Tournament Rules</h2>
              <div style={{fontSize: 14, color: '#5E6578', lineHeight: 1.8, whiteSpace: 'pre-wrap'}}>
                {event.rules || 'No rules specified.'}
              </div>
            </div>
          )}

          {activeTab === 'Prizes' && (
            <div style={{paddingTop: 10}}>
              <h2 className="td-section-title">Total Prize Pool: ₹{(event.firstPrize || 0) + (event.secondPrize || 0) + (event.thirdPrize || 0)}</h2>
              <p style={{fontSize: 14, color: '#5E6578', marginBottom: 16}}>
                🥇 1st Prize — ₹{event.firstPrize || 0}<br/>
                🥈 2nd Prize — ₹{event.secondPrize || 0}<br/>
                🥉 3rd Prize — ₹{event.thirdPrize || 0}
              </p>
            </div>
          )}

          {activeTab === 'Venue' && (
            <div style={{paddingTop: 10}}>
              <h2 className="td-section-title">{event.venueName || 'Venue TBA'}</h2>
              <p style={{fontSize: 14, color: '#5E6578'}}>
                {event.location || 'Location TBA'}
              </p>
            </div>
          )}

          {activeTab === 'Contact' && (
            <div style={{paddingTop: 10}}>
              <h2 className="td-section-title">Organizer Contact</h2>
              <p style={{fontSize: 14, color: '#5E6578'}}>
                For registration and more details, contact:<br/>
                <strong>{event.contactPhone || 'No contact provided'}</strong>
              </p>
            </div>
          )}

          <div style={{height: 100}} />
        </div>
      </div>

      <div className="td-sticky-footer">
        {isClosed ? (
          <div className="td-btn-disabled">Registration Closed</div>
        ) : (
          <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer" className="td-btn-register">
            Register Now <ArrowRight size={18} style={{marginLeft: 8}} />
          </a>
        )}
      </div>
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
      <Route path="/turfs" element={<BookTurf />} />
      <Route path="/turfs/:id" element={<TurfDetails />} />
      <Route path="/turfs/:id/checkout" element={<Checkout />} />
      <Route path="/live" element={<UserLiveMatches />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;
