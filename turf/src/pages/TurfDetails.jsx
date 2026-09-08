import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  CheckCircle2,
  Clock,
  Star,
  ShieldCheck,
  Zap,
  Droplet,
  Users,
  Car,
  Bath,
  CalendarDays,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { getTurf, getBookedSlots } from "../services/api";
import { generateSlots } from "../services/slots";
import { getTurfImage } from "../utils/sportsImages";
import Navbar from "../components/Navbar";
import BottomNav from "../components/BottomNav";
import BookMyShowSlotPicker from "../components/BookMyShowSlotPicker";
import { DetailsSkeleton } from "../components/SkeletonLoader";

function buildDateChips(count = 7) {
  const chips = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
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
}

export default function TurfDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const dateChips = useMemo(() => buildDateChips(7), []);
  const [selectedDate, setSelectedDate] = useState(dateChips[0].fullDate);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getTurf(id);
        setTurf(data);
      } catch (err) {
        console.error("Failed to load turf details:", err);
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
        if (active) setBookedSlots(slots || []);
      })
      .catch(() => {
        if (active) setBookedSlots([]);
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, selectedDate]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: turf?.name || "Find Your Turf",
          text: `Check out ${turf?.name} on Find Your Turf!`,
          url: window.location.href,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="fyt-app-shell">
        <Navbar />
        <main className="fyt-main-content">
          <DetailsSkeleton />
        </main>
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="fyt-app-shell">
        <Navbar />
        <main className="fyt-main-content">
          <div className="fyt-container" style={{ padding: "60px 16px", textAlign: "center" }}>
            <h2>Turf Not Found</h2>
            <p style={{ color: "var(--text-secondary)", margin: "12px 0 24px" }}>
              The sports turf you are looking for does not exist or has been removed.
            </p>
            <button className="fyt-btn-primary" onClick={() => navigate("/turfs")}>
              Back to Turfs
            </button>
          </div>
        </main>
      </div>
    );
  }

  const duration = turf.slotDurationMinutes || 60;
  const slots = generateSlots(turf, { date: selectedDate, bookedSlots });
  const chosenSlotObj = slots.find((s) => s.value === selectedSlot);

  // Gallery image pool
  const galleryImages = [
    getTurfImage(turf, 0),
    getTurfImage(turf, 1),
    getTurfImage(turf, 2),
  ];

  const handleBooking = () => {
    if (!selectedSlot) return;
    navigate(`/turfs/${id}/checkout`, {
      state: {
        turf,
        date: selectedDate,
        slot: selectedSlot,
        endSlot: chosenSlotObj?.endLabel,
        durationMinutes: duration,
      },
    });
  };

  const amenities = [
    { icon: <Zap size={18} />, label: "Stadium Floodlights" },
    { icon: <Car size={18} />, label: "Free Vehicle Parking" },
    { icon: <Bath size={18} />, label: "Clean Washrooms" },
    { icon: <Droplet size={18} />, label: "Filtered Drinking Water" },
    { icon: <Users size={18} />, label: "Spectator Seating Area" },
    { icon: <ShieldCheck size={18} />, label: "First Aid Kit Available" },
  ];

  return (
    <div className="fyt-app-shell">
      <Navbar />

      <main className="fyt-main-content" style={{ paddingBottom: 110 }}>
        <div className="fyt-container">
          {/* Breadcrumb / Back button */}
          <div className="fyt-td-nav-bar">
            <button className="fyt-back-btn" onClick={() => navigate(-1)} aria-label="Go Back">
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <div className="fyt-td-top-actions">
              <button
                className={`fyt-action-circle ${isLiked ? "liked" : ""}`}
                onClick={() => setIsLiked(!isLiked)}
                aria-label="Favorite"
              >
                <Heart size={18} fill={isLiked ? "#EF4444" : "none"} color={isLiked ? "#EF4444" : "#0F172A"} />
              </button>
              <button className="fyt-action-circle" onClick={handleShare} aria-label="Share">
                <Share2 size={18} />
                {copied && <span className="fyt-copied-tooltip">Link copied!</span>}
              </button>
            </div>
          </div>

          {/* Desktop 2-Column Grid Layout */}
          <div className="fyt-td-layout-grid">
            {/* Left Column: Media Gallery, Info, Amenities */}
            <div className="fyt-td-left-col">
              {/* Media Gallery */}
              <div className="fyt-td-gallery">
                <div className="fyt-td-main-image-wrap">
                  <img
                    src={galleryImages[activeImageIndex]}
                    alt={turf.name}
                    className="fyt-td-main-img"
                  />
                  <div className="fyt-td-img-overlay">
                    <span className="fyt-td-sport-pill">
                      {turf.sportType === "Football" ? "⚽" : turf.sportType === "Cricket" ? "🏏" : "🏸"}{" "}
                      {turf.sportType} Arena
                    </span>
                    <span className="fyt-td-verified-pill">
                      <ShieldCheck size={14} /> Verified Partner
                    </span>
                  </div>
                </div>

                {/* Thumbnails */}
                <div className="fyt-td-thumbnails">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      className={`fyt-td-thumb ${activeImageIndex === idx ? "active" : ""}`}
                      onClick={() => setActiveImageIndex(idx)}
                    >
                      <img src={img} alt={`View ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Location Header */}
              <div className="fyt-td-header-card">
                <div className="fyt-td-title-row">
                  <div>
                    <h1 className="fyt-td-title">{turf.name}</h1>
                    <div className="fyt-td-loc-row">
                      <MapPin size={16} className="fyt-loc-pin" />
                      <span>{turf.location}, Coimbatore</span>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(turf.name + " " + turf.location)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="fyt-map-link"
                      >
                        <span>View on Maps</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  <div className="fyt-td-rating-box">
                    <div className="fyt-td-rating-val">
                      <Star size={16} fill="#FBBF24" color="#FBBF24" />
                      <span>4.8</span>
                    </div>
                    <span className="fyt-td-rating-count">120+ reviews</span>
                  </div>
                </div>

                <div className="fyt-td-tags-list">
                  <span className="fyt-badge-tag">{turf.sportType}</span>
                  <span className="fyt-badge-tag">5v5 / 7v7</span>
                  <span className="fyt-badge-tag">FIFA Approved Turf</span>
                  <span className="fyt-badge-tag">Floodlights Available</span>
                </div>
              </div>

              {/* Amenities / Facilities */}
              <section className="fyt-td-section-card">
                <h2 className="fyt-section-title">Amenities &amp; Facilities</h2>
                <div className="fyt-amenities-grid">
                  {amenities.map((item, idx) => (
                    <div key={idx} className="fyt-amenity-item">
                      <div className="fyt-amenity-icon">{item.icon}</div>
                      <span className="fyt-amenity-label">{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* About Turf */}
              <section className="fyt-td-section-card">
                <h2 className="fyt-section-title">About this Arena</h2>
                <p className="fyt-td-about-text">
                  Experience elite sports performance at <strong>{turf.name}</strong>. Featuring high-grade, cushioned all-weather artificial turf, pro-grade stadium floodlights for night matches, sanitized changing rooms, and comfortable seating for spectators.
                </p>
                <div className="fyt-td-hours-info">
                  <Clock size={16} className="fyt-clock-icon" />
                  <span>
                    Operating Hours: <strong>{turf.openingTime || "06:00"}</strong> to <strong>{turf.closingTime || "23:00"}</strong> · Slot duration: <strong>{duration} mins</strong>
                  </span>
                </div>
              </section>
            </div>

            {/* Right Column: BookMyShow-style Slot Picker & Sticky Booking Widget */}
            <div className="fyt-td-right-col">
              <div className="fyt-booking-panel">
                <div className="fyt-bp-header">
                  <div>
                    <span className="fyt-bp-tag">Step-by-Step Booking</span>
                    <h3 className="fyt-bp-title">Select Date &amp; Time Slot</h3>
                  </div>
                  <div className="fyt-bp-price">
                    <span className="fyt-bp-price-val">₹{turf.pricePerHour}</span>
                    <span className="fyt-bp-price-unit">/ hr</span>
                  </div>
                </div>

                {/* 1. BookMyShow-Style Horizontal Date Selector */}
                <div className="fyt-bp-section">
                  <label className="fyt-bp-label">
                    <CalendarDays size={16} /> <span>1. Select Date</span>
                  </label>
                  <div className="fyt-chips-scroll" style={{ padding: "4px 0 10px" }}>
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

                {/* 2. BookMyShow-Style Time Slot Selection (Morning, Afternoon, Evening, Night) */}
                <div className="fyt-bp-section">
                  <label className="fyt-bp-label" style={{ marginBottom: 12 }}>
                    <Clock size={16} /> <span>2. Select Time Slot</span>
                  </label>

                  <BookMyShowSlotPicker
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelectSlot={(val) => setSelectedSlot(val)}
                    loading={slotsLoading}
                    date={selectedDate}
                    turf={turf}
                  />
                </div>

                {/* CTA Action */}
                <button
                  className="fyt-btn-book-primary"
                  onClick={handleBooking}
                  disabled={!selectedSlot}
                  style={{ marginTop: 16 }}
                >
                  {selectedSlot ? `Continue (₹${turf.pricePerHour})` : "Choose an Available Slot"}
                </button>

                <div className="fyt-bp-guarantee">
                  <ShieldCheck size={14} /> <span>100% Instant Confirmation · No Hidden Charges</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action for Mobile Viewports */}
      <div className="fyt-sticky-mobile-bottom">
        <div className="fyt-smb-info">
          <div className="fyt-smb-price">
            <strong>₹{turf.pricePerHour}</strong>
            <span>/ hr</span>
          </div>
          <span className="fyt-smb-slot-indicator">
            {selectedSlot ? `Selected: ${selectedSlot}` : "Pick a time slot"}
          </span>
        </div>
        <button
          className="fyt-smb-btn"
          onClick={handleBooking}
          disabled={!selectedSlot}
        >
          {selectedSlot ? "Continue" : "Select Slot"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
