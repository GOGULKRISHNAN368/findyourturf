import { useLocation, useNavigate } from "react-router-dom";
import {
  Home as HomeIcon,
  Trophy,
  Calendar,
  PlayCircle,
  User,
} from "lucide-react";

const ITEMS = [
  { path: "/", label: "Home", Icon: HomeIcon },
  { path: "/events", label: "Events", Icon: Trophy },
  { path: "/turfs", label: "Book Turf", Icon: Calendar },
  { path: "/live", label: "Live", Icon: PlayCircle },
  { path: "/profile", label: "Profile", Icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav-fixed">
      {ITEMS.map(({ path, label, Icon }) => {
        const active =
          path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(path);
        return (
          <button
            key={path}
            className={`nav-item-new ${active ? "active" : ""}`}
            onClick={() => navigate(path)}
          >
            <Icon size={24} />
            <span className="nav-label-new">{label}</span>
            {active && <div className="nav-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
