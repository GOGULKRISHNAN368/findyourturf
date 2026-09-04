import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Share2, MapPin, CheckCircle2 } from "lucide-react";
import { getTurf, checkAvailability } from "../services/api";

export default function TurfDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Date selection
  const dateChips = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    dateChips.push({
      day: i === 0 ? "TODAY" : d.toLocaleDateString("en-IN", { weekday: "short" }),
      num: d.getDate().toString().padStart(2, '0'),
      fullDate: d.toISOString().split("T")[0]
    });
  }
  const [selectedDate, setSelectedDate] = useState(dateChips[0].fullDate);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Available slots for demo purpose since we don't have a real slot list in backend
  const demoSlots = ["06:00 AM", "07:00 AM", "08:00 AM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM"];

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getTurf(id);
        setTurf(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="status-box">Loading...</div>;
  if (!turf) return <div className="status-box">Turf not found</div>;

  const handleBooking = () => {
    if (selectedSlot) {
      navigate(`/turfs/${id}/checkout`, {
        state: { turf, date: selectedDate, slot: selectedSlot }
      });
    }
  };

  return (
    <div className="mobile-app-container">
      <div className="turf-details-hero">
        <img src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop" alt={turf.name} />
        <div className="td-top-actions">
          <button className="td-icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="td-icon-btn"><Heart size={20} /></button>
            <button className="td-icon-btn"><Share2 size={20} /></button>
          </div>
        </div>
      </div>

      <div className="td-content-wrapper home-scroll-area" style={{ paddingBottom: 100 }}>
        <div className="td-title-row">
          <h1 className="td-title">{turf.name}</h1>
          <div className="td-rating">★ 4.8</div>
        </div>

        <div className="td-location">
          <MapPin size={18} style={{ color: "var(--primary-purple)", marginTop: 2 }} />
          <div>
            {turf.location}
            <div style={{ color: "var(--primary-purple)", fontWeight: 600, marginTop: 4 }}>View on Map</div>
          </div>
        </div>

        <div className="td-sports-tags">
          <div className="td-sport-tag">{turf.sportType}</div>
          <div className="td-sport-tag">5v5</div>
          <div className="td-sport-tag">7v7</div>
        </div>

        <div className="td-section">
          <h3>Facilities</h3>
          <div className="td-facilities">
            <div className="td-facility-item"><CheckCircle2 size={16} color="var(--color-success)" /> Parking</div>
            <div className="td-facility-item"><CheckCircle2 size={16} color="var(--color-success)" /> Washroom</div>
            <div className="td-facility-item"><CheckCircle2 size={16} color="var(--color-success)" /> Floodlights</div>
          </div>
        </div>

        <div className="td-section">
          <h3>About this Turf</h3>
          <p className="td-about">
            Experience premium sports action at {turf.name}. We provide top-quality artificial turf suitable for professional and casual games, fully equipped with stadium floodlights and spectator seating.
          </p>
        </div>

        <div className="td-section">
          <h3>Select Date & Time</h3>
          <div className="bt-horizontal-scroll" style={{ paddingRight: 0, marginBottom: 24 }}>
            {dateChips.map((chip, idx) => (
              <button
                key={idx}
                className={`bt-date-chip ${selectedDate === chip.fullDate ? "selected" : ""}`}
                onClick={() => { setSelectedDate(chip.fullDate); setSelectedSlot(null); }}
              >
                <span className="bt-date-day">{chip.day}</span>
                <span className="bt-date-num">{chip.num}</span>
              </button>
            ))}
          </div>

          <div className="td-slot-grid">
            {demoSlots.map((slot, idx) => (
              <button 
                key={idx} 
                className={`td-slot ${selectedSlot === slot ? 'selected' : 'available'}`}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="td-sticky-bottom">
        <div className="td-sb-price">
          <h4>₹{turf.pricePerHour}</h4>
          <span>per hour</span>
        </div>
        <button 
          className="td-sb-btn" 
          onClick={handleBooking}
          style={{ opacity: selectedSlot ? 1 : 0.5 }}
          disabled={!selectedSlot}
        >
          {selectedSlot ? "Select Slot" : "Choose a Slot"}
        </button>
      </div>
    </div>
  );
}
