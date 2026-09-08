import { useNavigate } from "react-router-dom";
import { SPORT_CATEGORIES } from "../utils/sportsImages";
import { ArrowRight } from "lucide-react";

export default function SportCategoryCards({ onSelectSport }) {
  const navigate = useNavigate();

  const handleCardClick = (sportName) => {
    if (onSelectSport) {
      onSelectSport(sportName);
    } else {
      navigate(`/turfs?sport=${encodeURIComponent(sportName)}`);
    }
  };

  return (
    <div className="fyt-sports-carousel">
      {SPORT_CATEGORIES.map((category) => (
        <div
          key={category.id}
          className="fyt-sport-card"
          onClick={() => handleCardClick(category.name)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick(category.name);
            }
          }}
        >
          <img
            src={category.image}
            alt={category.name}
            className="fyt-sc-img"
            loading="lazy"
          />
          <div className="fyt-sc-overlay" />
          <div className="fyt-sc-body">
            <div className="fyt-sc-badge">{category.badge}</div>
            <div className="fyt-sc-title-row">
              <span className="fyt-sc-emoji">{category.icon}</span>
              <h4 className="fyt-sc-name">{category.name}</h4>
            </div>
            <div className="fyt-sc-cta">
              <span>Explore Turfs</span>
              <ArrowRight size={13} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

