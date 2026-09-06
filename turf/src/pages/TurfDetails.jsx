import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Share2, MapPin, CheckCircle2, Clock } from "lucide-react";
import { getTurf, getBookedSlots } from "../services/api";
import { generateSlots } from "../services/slots";

function buildDateChips(count = 7) {
  const chips = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    chips.push({
      day:
        i === 0
          ? "TODAY"
          : d.toLocaleDateString("en-IN", { weekday: "short" }),
      num: d.getDate().toString().padStart(2, "0"),
      fullDate: d.toISOString().split("T")[0],
    });
  }
  return chips;
}

export default function TurfDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);

  const dateChips = buildDateChips(7);
  const [selectedDate, setSelectedDate] = useState(dateChips[0].fullDate);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

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

  useEffect(() => {
    let active = true;
    if (!id || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    getBookedSlots(id, selectedDate)
      .then((slots) => {
        if (active) setBookedSlots(slots);
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, selectedDate]);

  if (loading) return <div className="status-box">Loading...</div>;
  if (!turf) return <div className="status-box">Turf not found</div>;

  const slots = generateSlots(turf, { date: selectedDate, bookedSlots });
  const duration = turf.slotDurationMinutes || 60;

  const handleBooking = () => {
    if (!selectedSlot) return;
    const chosen = slots.find((s) => s.value === selectedSlot);
    navigate(`/turfs/${id}/checkout`, {
      state: {
        turf,
        date: selectedDate,
        slot: selectedSlot,
        endSlot: chosen?.endLabel,
        durationMinutes: duration,
      },
    });
  };

  return (
    <div className="mobile-app-container">
      <div className="turf-details-hero">
        <img
          src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop"
          alt={turf.name}
        />
        <div className="td-top-actions">
          <button className="td-icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="td-icon-btn">
              <Heart size={20} />
            </button>
            <button className="td-icon-btn">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="td-content-wrapper home-scroll-area"
        style={{ paddingBottom: 100 }}
      >
        <div className="td-title-row">
          <h1 className="td-title">{turf.name}</h1>
          <div className="td-rating">★ 4.8</div>
        </div>

        <div className="td-location">
          <MapPin
            size={18}
            style={{ color: "var(--primary-purple)", marginTop: 2 }}
          />
          <div>
            {turf.location}
            <div
              style={{
                color: "var(--primary-purple)",
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              View on Map
            </div>
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
            <div className="td-facility-item">
              <CheckCircle2 size={16} color="var(--color-success)" /> Parking
            </div>
            <div className="td-facility-item">
              <CheckCircle2 size={16} color="var(--color-success)" /> Washroom
            </div>
            <div className="td-facility-item">
              <CheckCircle2 size={16} color="var(--color-success)" /> Floodlights
            </div>
          </div>
        </div>

        <div className="td-section">
          <h3>About this Turf</h3>
          <p className="td-about">
            Experience premium sports action at {turf.name}. We provide
            top-quality artificial turf suitable for professional and casual
            games, fully equipped with stadium floodlights and spectator seating.
          </p>
        </div>

        <div className="td-section">
          <h3>Select Date &amp; Time</h3>
          <div className="td-hours-line">
            <Clock size={14} /> Open {turf.openingTime || "06:00"} –{" "}
            {turf.closingTime || "23:00"} · {duration} min slots
          </div>
          <div
            className="bt-horizontal-scroll"
            style={{ paddingRight: 0, marginBottom: 20, marginTop: 12 }}
          >
            {dateChips.map((chip, idx) => (
              <button
                key={idx}
                className={`bt-date-chip ${
                  selectedDate === chip.fullDate ? "selected" : ""
                }`}
                onClick={() => setSelectedDate(chip.fullDate)}
              >
                <span className="bt-date-day">{chip.day}</span>
                <span className="bt-date-num">{chip.num}</span>
              </button>
            ))}
          </div>

          {slotsLoading ? (
            <div className="status-box">Checking availability...</div>
          ) : slots.length === 0 ? (
            <div className="status-box">
              No slots configured for this turf yet.
            </div>
          ) : (
            <div className="td-slot-grid">
              {slots.map((slot) => {
                const isSelected = selectedSlot === slot.value;
                const cls = isSelected
                  ? "selected"
                  : slot.available
                  ? "available"
                  : "booked";
                return (
                  <button
                    key={slot.value}
                    className={`td-slot ${cls}`}
                    disabled={!slot.available && !isSelected}
                    onClick={() =>
                      slot.available && setSelectedSlot(slot.value)
                    }
                  >
                    {slot.label}
                    {!slot.available && (
                      <span className="td-slot-tag">
                        {slot.isPast ? "Past" : "Booked"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
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
          {selectedSlot ? "Continue to Book" : "Choose a Slot"}
        </button>
      </div>
    </div>
  );
}
