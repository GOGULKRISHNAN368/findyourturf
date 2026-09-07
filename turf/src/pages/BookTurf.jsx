import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, SlidersHorizontal, ArrowLeft, Heart } from "lucide-react";
import { getTurfs } from "../services/api";
import { generateSlots } from "../services/slots";

export default function BookTurf() {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTurfs() {
      try {
        const data = await getTurfs();
        setTurfs(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTurfs();
  }, []);

  // Generate some quick date chips (e.g. today + next 4 days)
  const dateChips = [];
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    dateChips.push({
      day: i === 0 ? "TODAY" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      num: d.getDate().toString().padStart(2, '0'),
      fullDate: d.toISOString().split("T")[0]
    });
  }

  const [selectedDate, setSelectedDate] = useState(dateChips[0].fullDate);

  return (
    <div className="mobile-app-container">
      <header className="book-turf-header">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="bt-header-title">
          <h1>Book a Turf</h1>
          <div className="bt-location-meta">
            <MapPin size={12} />
            <span>Coimbatore, India</span>
          </div>
        </div>
        <button className="icon-btn">
          <Search size={24} />
        </button>
      </header>

      <div className="home-scroll-area">
        <div className="bt-search-container">
          <div className="bt-search-bar">
            <Search size={20} />
            <input type="text" placeholder="Search turf, area or venue" />
          </div>
        </div>

        <section className="bt-scroll-section">
          <h2 className="bt-section-heading">Choose Sport</h2>
          <div className="bt-horizontal-scroll">
            <button className="bt-sport-chip selected">⚽ Football</button>
            <button className="bt-sport-chip">🏏 Cricket</button>
            <button className="bt-sport-chip">🏸 Badminton</button>
          </div>
        </section>

        <section className="bt-scroll-section">
          <h2 className="bt-section-heading">Date</h2>
          <div className="bt-horizontal-scroll">
            {dateChips.map((chip, idx) => (
              <button
                key={idx}
                className={`bt-date-chip ${selectedDate === chip.fullDate ? "selected" : ""}`}
                onClick={() => setSelectedDate(chip.fullDate)}
              >
                <span className="bt-date-day">{chip.day}</span>
                <span className="bt-date-num">{chip.num}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bt-scroll-section" style={{ paddingBottom: 0 }}>
          <div className="bt-horizontal-scroll">
            <button className="bt-filter-chip">
              <SlidersHorizontal size={14} /> Filters
            </button>
            <button className="bt-filter-chip">Distance</button>
            <button className="bt-filter-chip">Price</button>
            <button className="bt-filter-chip">Rating</button>
          </div>
        </section>

        <section className="tournaments-section" style={{ backgroundColor: "var(--bg-main)" }}>
          <div className="section-header">
            <h2>Recommended Turfs</h2>
            <button className="section-action">See All</button>
          </div>

          {loading ? (
            <div className="status-box">Loading turfs...</div>
          ) : turfs.length === 0 ? (
            <div className="status-box">No turfs available.</div>
          ) : (
            turfs.map((turf) => (
              <div key={turf._id} className="bt-turf-card">
                <div className="bt-tc-image-area">
                  <img src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop" alt="Turf" />
                  <div className="bt-tc-overlay-top-left">POPULAR</div>
                  <button className="bt-tc-overlay-top-right">
                    <Heart size={16} />
                  </button>
                </div>
                <div className="bt-tc-info">
                  <div className="bt-tc-header">
                    <h3 className="bt-tc-title">{turf.name}</h3>
                    <div className="bt-tc-price">
                      ₹{turf.pricePerHour}<span>/hr</span>
                    </div>
                  </div>
                  <div className="bt-tc-meta">
                    <div><MapPin size={14} /> {turf.location}</div>
                    <div>★ <strong>4.8</strong> (120)</div>
                  </div>
                  <div className="bt-tc-meta">
                    <div style={{ color: "var(--primary-purple)", fontWeight: 600 }}>{turf.sportType}</div>
                  </div>
                  
                  <div className="bt-tc-slots-area">
                    <div className="bt-tc-slots-heading">
                      Today · {turf.openingTime || "06:00"}–{turf.closingTime || "23:00"}
                    </div>
                    <div className="bt-slots-row">
                      {(() => {
                        const today = new Date().toISOString().split("T")[0];
                        const upcoming = generateSlots(turf, { date: today }).filter(
                          (s) => !s.isPast
                        );
                        if (upcoming.length === 0) {
                          return (
                            <div className="bt-slot-chip unavailable">
                              Closed for today
                            </div>
                          );
                        }
                        return upcoming.slice(0, 4).map((s) => (
                          <div
                            key={s.value}
                            className={`bt-slot-chip ${
                              s.available ? "available" : "unavailable"
                            }`}
                          >
                            {s.label}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <button className="bt-tc-action" onClick={() => navigate(`/turfs/${turf._id}`)}>
                    Book Slot
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

      </div>
    </div>
  );
}
