export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "blue",
  trend,
  trendType = "positive",
  subtitle,
}) {
  return (
    <div className={`stat-card color-${color}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon-wrapper">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="stat-value">{value ?? "0"}</div>

      {(trend || subtitle) && (
        <div className="stat-footer">
          {trend && (
            <span className={`stat-trend ${trendType}`}>
              {trend}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
