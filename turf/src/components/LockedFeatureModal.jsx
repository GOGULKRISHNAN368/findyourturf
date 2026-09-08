import { Lock, X } from "lucide-react";

export default function LockedFeatureModal({ feature, onClose }) {
  return (
    <div className="fyt-locked-feature-overlay" role="presentation" onClick={onClose}>
      <div
        className="fyt-locked-feature-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="locked-feature-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="fyt-locked-feature-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className="fyt-locked-feature-icon">
          <Lock size={22} />
        </div>
        <h2 id="locked-feature-title">{feature} is coming soon</h2>
        <p>This feature is currently under development. Stay tuned!</p>
        <button className="fyt-btn-primary" onClick={onClose}>OK</button>
      </div>
    </div>
  );
}
