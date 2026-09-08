import { Lock, MapPin, X, Sparkles, CheckCircle2 } from "lucide-react";

export default function LockedTurfModal({ turf, onClose }) {
  if (!turf) return null;

  return (
    <div className="fyt-modal-backdrop" onClick={onClose}>
      <div
        className="fyt-bottom-sheet-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="fyt-bs-handle" />

        <div className="fyt-bs-header">
          <div className="fyt-bs-lock-icon">
            <Lock size={26} />
          </div>
          <button className="fyt-bs-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="fyt-bs-body">
          <div className="fyt-bs-badge">
            <Sparkles size={13} /> <span>Demonstration Preview</span>
          </div>

          <h3 className="fyt-bs-title">Booking Coming Soon</h3>
          <p className="fyt-bs-desc">
            <strong>{turf.name}</strong> is currently locked for demonstration. Live online slot reservation for this arena will be unlocked soon.
          </p>

          <div className="fyt-bs-turf-card">
            {turf.image && (
              <img src={turf.image} alt={turf.name} className="fyt-bs-turf-img" />
            )}
            <div className="fyt-bs-turf-info">
              <span className="fyt-bs-turf-sport">{turf.sportType} Arena</span>
              <h4 className="fyt-bs-turf-name">{turf.name}</h4>
              <div className="fyt-bs-turf-loc">
                <MapPin size={13} /> <span>{turf.location}</span>
              </div>
              <div className="fyt-bs-turf-price">
                From <strong>₹{turf.pricePerHour}</strong> / hour
              </div>
            </div>
          </div>
        </div>

        <div className="fyt-bs-footer">
          <button className="fyt-btn-primary" style={{ width: "100%" }} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

