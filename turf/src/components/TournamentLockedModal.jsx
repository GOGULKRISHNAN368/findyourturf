import { Lock, Trophy, X, Sparkles } from "lucide-react";

export default function TournamentLockedModal({ tournament, onClose }) {
  if (!tournament) return null;

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
          <div className="fyt-bs-lock-icon" style={{ background: "#EEF2FF", color: "#6366F1" }}>
            <Lock size={26} />
          </div>
          <button className="fyt-bs-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="fyt-bs-body">
          <div className="fyt-bs-badge" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
            <Sparkles size={13} /> <span>Coming Soon</span>
          </div>

          <h3 className="fyt-bs-title">Tournament Coming Soon</h3>
          <p className="fyt-bs-desc" style={{ marginBottom: 16 }}>
            Tournament registration is not open yet. Live squad entry and slot reservation for{" "}
            <strong>{tournament.eventName || "this tournament"}</strong> will open soon.
          </p>

          <div className="fyt-tourney-locked-info-box">
            <div className="fyt-tli-row">
              <span>Sport</span>
              <strong>{tournament.sport || "Cricket"}</strong>
            </div>
            {tournament.location && (
              <div className="fyt-tli-row">
                <span>Location</span>
                <strong>{tournament.location}</strong>
              </div>
            )}
            {tournament.firstPrize > 0 && (
              <div className="fyt-tli-row">
                <span>1st Prize Pool</span>
                <strong style={{ color: "var(--accent-amber)" }}>₹{tournament.firstPrize}</strong>
              </div>
            )}
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

