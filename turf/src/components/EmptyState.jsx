import { Search, Calendar, Trophy, AlertCircle, RefreshCw } from "lucide-react";

export default function EmptyState({
  type = "search",
  title = "No results found",
  message = "Try changing your search keywords or filters to find what you need.",
  actionLabel,
  onAction,
  icon
}) {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case "turfs":
      case "search":
        return <Search size={36} />;
      case "bookings":
      case "slots":
        return <Calendar size={36} />;
      case "tournaments":
      case "events":
        return <Trophy size={36} />;
      case "error":
        return <AlertCircle size={36} />;
      default:
        return <Search size={36} />;
    }
  };

  return (
    <div className={`fyt-empty-state ${type === "error" ? "is-error" : ""}`}>
      <div className="fyt-empty-icon-box">
        {getIcon()}
      </div>
      <h3 className="fyt-empty-title">{title}</h3>
      <p className="fyt-empty-message">{message}</p>
      {actionLabel && onAction && (
        <button className="fyt-btn-empty-action" onClick={onAction}>
          {type === "error" && <RefreshCw size={14} style={{ marginRight: 6 }} />}
          {actionLabel}
        </button>
      )}
    </div>
  );
}

