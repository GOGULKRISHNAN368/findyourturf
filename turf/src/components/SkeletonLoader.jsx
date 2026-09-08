export function TurfCardSkeleton() {
  return (
    <div className="fyt-turf-card fyt-skeleton-card">
      <div className="fyt-tc-media fyt-skeleton" />
      <div className="fyt-tc-content">
        <div className="fyt-skeleton-line title fyt-skeleton" />
        <div className="fyt-skeleton-line text fyt-skeleton" />
        <div className="fyt-skeleton-line slots fyt-skeleton" />
        <div className="fyt-skeleton-footer">
          <div className="fyt-skeleton-line price fyt-skeleton" />
          <div className="fyt-skeleton-btn fyt-skeleton" />
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="fyt-event-card fyt-skeleton-card">
      <div className="fyt-ec-img-box fyt-skeleton" />
      <div className="fyt-ec-content">
        <div className="fyt-skeleton-line date fyt-skeleton" />
        <div className="fyt-skeleton-line title fyt-skeleton" />
        <div className="fyt-skeleton-line text fyt-skeleton" />
      </div>
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="fyt-match-card fyt-skeleton-card">
      <div className="fyt-skeleton-line title fyt-skeleton" />
      <div className="fyt-skeleton-line text fyt-skeleton" />
      <div className="fyt-skeleton-line text fyt-skeleton" />
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div className="fyt-details-skeleton-wrap">
      <div className="fyt-details-hero-skeleton fyt-skeleton" />
      <div className="fyt-details-body-skeleton">
        <div className="fyt-skeleton-line title large fyt-skeleton" />
        <div className="fyt-skeleton-line text fyt-skeleton" />
        <div className="fyt-skeleton-grid">
          <div className="fyt-skeleton-box fyt-skeleton" />
          <div className="fyt-skeleton-box fyt-skeleton" />
          <div className="fyt-skeleton-box fyt-skeleton" />
          <div className="fyt-skeleton-box fyt-skeleton" />
        </div>
      </div>
    </div>
  );
}

