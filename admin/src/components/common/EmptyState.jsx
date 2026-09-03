import React from "react";
import { IconAlertCircle } from "./Icons";

export default function EmptyState({
  icon: Icon = IconAlertCircle,
  emoji = null,
  title = "No data found",
  description = "Get started by creating a new item.",
  actionLabel = null,
  onAction = null,
}) {
  return (
    <div className="empty-state-box">
      <div className="empty-state-icon">
        {emoji ? emoji : <Icon size={30} />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {actionLabel && onAction && (
        <button className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
