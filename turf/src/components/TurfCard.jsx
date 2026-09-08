import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Heart, Clock, ArrowRight, Lock, Sparkles } from "lucide-react";
import { getTurfImage } from "../utils/sportsImages";
import { generateSlots } from "../services/slots";

export default function TurfCard({
  turf,
  index = 0,
  showSlots = true,
  onLockedClick,
}) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const imageUrl = getTurfImage(turf, index);
  const isLocked = Boolean(turf.isLocked);

  const sportEmoji = {
    Football: "⚽",
    Cricket: "🏏",
    Badminton: "🏸",
    Basketball: "🏀",
    Tennis: "🎾"
  }[turf.sportType] || "🏆";

  // Calculate upcoming available slots for today if not locked
  const today = new Date().toISOString().split("T")[0];
  const slots = !isLocked ? generateSlots(turf, { date: today }).filter((s) => !s.isPast) : [];

  const handleCardClick = () => {
    if (isLocked) {
      if (onLockedClick) onLockedClick(turf);
    } else {
      navigate(`/turfs/${turf._id}`);
    }
  };

  return (
    <article
      className={`fyt-turf-card ${isLocked ? "is-locked" : ""}`}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`${turf.name} - ${isLocked ? "Booking Locked" : "Book Slot"}`}
    >
      {/* Media Image Area */}
      <div className="fyt-tc-media">
        <img
          src={imageUrl}
          alt={turf.name}
          className="fyt-tc-img"
          loading="lazy"
        />
        <div className={`fyt-tc-gradient-scrim ${isLocked ? "locked-scrim" : ""}`} />

        {/* Top Badges */}
        <div className="fyt-tc-top-badges">
          <span className="fyt-tc-sport-badge">
            <span>{sportEmoji}</span> {turf.sportType || "Turf"}
          </span>

          {isLocked ? (
            <span className="fyt-tc-lock-badge">
              <Lock size={12} /> <span>Locked</span>
            </span>
          ) : (
            <button
              className={`fyt-tc-heart-btn ${isLiked ? "liked" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              aria-label="Save to favorites"
            >
              <Heart size={16} fill={isLiked ? "#EF4444" : "none"} color={isLiked ? "#EF4444" : "#FFFFFF"} />
            </button>
          )}
        </div>

        {/* Bottom Floating Rating Badge */}
        <div className="fyt-tc-rating-badge">
          <Star size={13} className="fyt-star-icon" fill="#FBBF24" color="#FBBF24" />
          <span className="fyt-rating-score">{turf.rating || "4.8"}</span>
          <span className="fyt-rating-count">({turf.reviewsCount || 100}+)</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="fyt-tc-content">
        <div className="fyt-tc-header">
          <h3 className="fyt-tc-title" title={turf.name}>
            {turf.name}
          </h3>
          <div className="fyt-tc-location">
            <MapPin size={14} className="fyt-loc-pin" />
            <span>{turf.location}</span>
          </div>
        </div>

        {/* Slot previews for active turfs OR locked state banner for demo turfs */}
        {isLocked ? (
          <div className="fyt-tc-locked-preview-box">
            <div className="fyt-tcl-header">
              <Lock size={13} />
              <span>🔒 Booking Locked</span>
            </div>
            <p className="fyt-tcl-msg">Demo arena • Online slots opening soon</p>
          </div>
        ) : (
          showSlots && (
            <div className="fyt-tc-slots-box">
              <div className="fyt-tc-slots-label">
                <Clock size={12} />
                <span>
                  Today · {turf.openingTime || "06:00"}–{turf.closingTime || "23:00"}
                </span>
              </div>
              <div className="fyt-tc-slots-pills">
                {slots.length === 0 ? (
                  <span className="fyt-slot-mini-pill closed">Closed for today</span>
                ) : (
                  slots.slice(0, 3).map((slot) => (
                    <span
                      key={slot.value}
                      className={`fyt-slot-mini-pill ${slot.available ? "avail" : "taken"}`}
                    >
                      {slot.label}
                    </span>
                  ))
                )}
                {slots.length > 3 && (
                  <span className="fyt-slot-mini-pill more">
                    +{slots.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        )}

        {/* Bottom Pricing & CTA */}
        <div className="fyt-tc-footer">
          <div className="fyt-tc-pricing">
            <span className="fyt-price-unit">Price</span>
            <div className="fyt-price-val">
              <strong>₹{turf.pricePerHour}</strong>
              <span className="fyt-price-suffix">/ hr</span>
            </div>
          </div>

          {isLocked ? (
            <button
              className="fyt-btn-locked-cta"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <Lock size={13} />
              <span>Coming Soon</span>
            </button>
          ) : (
            <button
              className="fyt-btn-book"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/turfs/${turf._id}`);
              }}
            >
              <span>Book Now</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
