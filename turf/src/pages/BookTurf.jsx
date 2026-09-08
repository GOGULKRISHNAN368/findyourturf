import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, MapPin, SlidersHorizontal, ArrowLeft, X, Sparkles, Lock } from "lucide-react";
import { getTurfs } from "../services/api";
import { LOCKED_DEMO_TURFS } from "../utils/sportsImages";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import TurfCard from "../components/TurfCard";
import LockedTurfModal from "../components/LockedTurfModal";
import { TurfCardSkeleton } from "../components/SkeletonLoader";
import EmptyState from "../components/EmptyState";

const SPORTS = [
  { id: "ALL", name: "All Sports", icon: "🏆" },
  { id: "Football", name: "Football", icon: "⚽" },
  { id: "Cricket", name: "Cricket", icon: "🏏" },
  { id: "Badminton", name: "Badminton", icon: "🏸" },
  { id: "Basketball", name: "Basketball", icon: "🏀" },
  { id: "Tennis", name: "Tennis", icon: "🎾" },
];

export default function BookTurf() {
  const navigate = useNavigate();
  const location = useLocation();
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLockedTurf, setSelectedLockedTurf] = useState(null);

  // Read query params if arriving from a category click e.g. /turfs?sport=Football
  const searchParams = new URLSearchParams(location.search);
  const initialSport = searchParams.get("sport") || "ALL";
  const [selectedSport, setSelectedSport] = useState(initialSport);
  const [sortBy, setSortBy] = useState("recommended");

  // Generate 7-day date chips (BookMyShow-style MON 07, TUE 08)
  const dateChips = useMemo(() => {
    const chips = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      chips.push({
        day: i === 0 ? "TODAY" : i === 1 ? "TOMORROW" : d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
        num: d.getDate().toString().padStart(2, "0"),
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        fullDate: d.toISOString().split("T")[0],
      });
    }
    return chips;
  }, []);

  const [selectedDate, setSelectedDate] = useState(dateChips[0].fullDate);

  useEffect(() => {
    async function loadTurfs() {
      try {
        setLoading(true);
        const data = await getTurfs();
        setTurfs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load real turfs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTurfs();
  }, []);

  // Filter real turfs
  const filteredRealTurfs = useMemo(() => {
    let list = [...turfs];
    if (selectedSport && selectedSport !== "ALL") {
      list = list.filter((t) => (t.sportType || "").toLowerCase() === selectedSport.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.location || "").toLowerCase().includes(q) ||
          (t.sportType || "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "price_asc") {
      list.sort((a, b) => (a.pricePerHour || 0) - (b.pricePerHour || 0));
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => (b.pricePerHour || 0) - (a.pricePerHour || 0));
    }
    return list;
  }, [turfs, selectedSport, searchQuery, sortBy]);

  // Filter demo locked turfs
  const filteredDemoTurfs = useMemo(() => {
    let list = [...LOCKED_DEMO_TURFS];
    if (selectedSport && selectedSport !== "ALL") {
      list = list.filter((t) => (t.sportType || "").toLowerCase() === selectedSport.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.location || "").toLowerCase().includes(q) ||
          (t.sportType || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedSport, searchQuery]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSport("ALL");
    setSortBy("recommended");
  };

  return (
    <div className="fyt-app-shell">
      <Navbar />

      <main className="fyt-main-content" style={{ paddingBottom: 110 }}>
        {/* Top Header & Search Area */}
        <div className="fyt-page-banner">
          <div className="fyt-container">
            <div className="fyt-td-nav-bar" style={{ padding: 0, marginBottom: 12 }}>
              <button className="fyt-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
              <div className="fyt-pb-badge" style={{ margin: 0 }}>
                <Sparkles size={14} /> <span>Instant Slot Booking</span>
              </div>
            </div>

            <div className="fyt-pb-content">
              <h1 className="fyt-pb-title">Book Your Turf</h1>
              <p className="fyt-pb-desc">
                Choose your turf, pick your preferred date and time slot, and get ready to play.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="fyt-search-bar-wrap">
              <div className="fyt-search-box">
                <Search size={20} className="fyt-search-icon" />
                <input
                  type="text"
                  placeholder="Search turf, area (e.g. Peelamedu, Gandhipuram), or sport..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="fyt-search-input"
                />
                {searchQuery && (
                  <button
                    className="fyt-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <section className="fyt-filters-section">
          <div className="fyt-container">
            {/* Sport Category Filter Chips */}
            <div className="fyt-filter-group">
              <span className="fyt-filter-group-label">Sport:</span>
              <div className="fyt-chips-scroll">
                {SPORTS.map((sport) => (
                  <button
                    key={sport.id}
                    className={`fyt-sport-chip ${selectedSport === sport.id ? "active" : ""}`}
                    onClick={() => setSelectedSport(sport.id)}
                  >
                    <span className="fyt-chip-icon">{sport.icon}</span>
                    <span>{sport.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* BookMyShow-style Date Selection Chips */}
            <div className="fyt-filter-group" style={{ marginTop: 12 }}>
              <span className="fyt-filter-group-label">Date:</span>
              <div className="fyt-chips-scroll">
                {dateChips.map((chip) => (
                  <button
                    key={chip.fullDate}
                    className={`fyt-date-chip ${selectedDate === chip.fullDate ? "active" : ""}`}
                    onClick={() => setSelectedDate(chip.fullDate)}
                  >
                    <span className="fyt-dc-day">{chip.day}</span>
                    <span className="fyt-dc-num">{chip.num}</span>
                    <span className="fyt-dc-month">{chip.month}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-filters (Sort & Counter) */}
            <div className="fyt-subfilter-bar">
              <div className="fyt-results-counter">
                Showing <strong>{filteredRealTurfs.length + filteredDemoTurfs.length}</strong> arenas
                {selectedSport !== "ALL" && ` in ${selectedSport}`}
              </div>

              <div className="fyt-sort-dropdown-wrap">
                <SlidersHorizontal size={14} className="fyt-sort-icon" />
                <select
                  className="fyt-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort Turfs"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Real Available Turfs Section */}
        <section className="fyt-turfs-grid-section" style={{ paddingBottom: 24 }}>
          <div className="fyt-container">
            <div className="fyt-section-header-row" style={{ marginBottom: 16 }}>
              <div>
                <span className="fyt-section-kicker">INSTANT RESERVATION</span>
                <h2 className="fyt-section-title">Available Turfs for Online Booking</h2>
              </div>
            </div>

            {loading ? (
              <div className="fyt-grid-3">
                {[1, 2, 3].map((n) => (
                  <TurfCardSkeleton key={n} />
                ))}
              </div>
            ) : filteredRealTurfs.length === 0 ? (
              <EmptyState
                type="turfs"
                title="No live turfs found"
                message="Try changing your search query or sport filter to see available arenas."
                actionLabel="Reset Filters"
                onAction={handleResetFilters}
              />
            ) : (
              <div className="fyt-grid-3">
                {filteredRealTurfs.map((turf, idx) => (
                  <TurfCard key={turf._id} turf={turf} index={idx} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 2. 4–5 Locked Demo Turfs (Coming Soon) */}
        {filteredDemoTurfs.length > 0 && (
          <section className="fyt-section fyt-demo-turfs-section">
            <div className="fyt-container">
              <div className="fyt-section-header-row" style={{ marginBottom: 16 }}>
                <div>
                  <span className="fyt-section-kicker" style={{ color: "var(--accent-indigo)" }}>
                    <Lock size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    DEMO ARENAS (COMING SOON)
                  </span>
                  <h2 className="fyt-section-title">Partner Arenas Onboarding Soon</h2>
                </div>
              </div>

              <div className="fyt-grid-3">
                {filteredDemoTurfs.map((demoTurf, idx) => (
                  <TurfCard
                    key={demoTurf._id}
                    turf={demoTurf}
                    index={idx + 4}
                    onLockedClick={(turf) => setSelectedLockedTurf(turf)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Friendly Bottom Sheet for Locked Demo Turfs */}
      {selectedLockedTurf && (
        <LockedTurfModal
          turf={selectedLockedTurf}
          onClose={() => setSelectedLockedTurf(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
