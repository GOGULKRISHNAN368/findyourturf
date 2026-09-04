import { Link, useNavigate } from "react-router-dom";
import {
  IconDashboard,
  IconCalendar,
  IconTrophy,
  IconUsers,
  IconMatch,
  IconLive,
  IconSettings,
  IconLogout,
  IconX,
  IconShield,
  IconCollapse,
} from "../common/Icons";
import { getAdmin, logoutAdmin } from "../../services/auth";

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  collapsed = false,
  setCollapsed = null,
  counts = {},
}) {
  const navigate = useNavigate();
  const admin = getAdmin();

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate("/login");
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: IconDashboard },
    { id: "events", label: "Events", icon: IconCalendar, count: counts.events },
    { id: "tournaments", label: "Tournaments", icon: IconTrophy, count: counts.tournaments },
    { id: "teams", label: "Teams", icon: IconUsers, count: counts.teams },
    { id: "matches", label: "Matches", icon: IconMatch, count: counts.matches },
    { id: "livescore", label: "Live Scores", icon: IconLive, isLive: Boolean(counts.liveMatches), count: counts.liveMatches },
  ];

  return (
    <>
      {mobileOpen && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 45 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""} ${
          collapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <div className="sidebar-header">
          <Link
            to="/admin"
            className="brand-logo"
            onClick={() => handleNavClick("overview")}
            title="TURF HUB - SPORTS MANAGEMENT"
          >
            <div className="brand-icon-wrapper">
              <IconShield size={22} />
            </div>
            {!collapsed && (
              <div className="brand-text-block">
                <span className="brand-title">TURF HUB</span>
                <span className="brand-subtitle">SPORTS MANAGEMENT</span>
              </div>
            )}
          </Link>

          {setCollapsed && (
            <button
              className="sidebar-collapse-btn desktop-only"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar collapse"
            >
              <IconCollapse size={18} />
            </button>
          )}

          {mobileOpen && (
            <button
              className="topbar-icon-btn mobile-only"
              style={{
                width: "30px",
                height: "30px",
                color: "#ffffff",
                backgroundColor: "rgba(255,255,255,0.1)",
              }}
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <IconX size={16} />
            </button>
          )}
        </div>

        <div className="sidebar-nav-container">
          {!collapsed && <div className="nav-section-label">Main Menu</div>}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={19} />
                {!collapsed && <span>{item.label}</span>}

                {item.count !== undefined &&
                  item.count !== null &&
                  item.count > 0 && (
                    <span
                      className={`nav-badge ${
                        item.isLive ? "live-pulse-badge" : ""
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
              </button>
            );
          })}

          <div style={{ marginTop: "auto" }} />

          {!collapsed && <div className="nav-section-label">Account</div>}

          <button
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => handleNavClick("settings")}
            title={collapsed ? "Settings" : undefined}
          >
            <IconSettings size={19} />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>

        <div className="sidebar-footer">
          {!collapsed ? (
            <>
              <div className="sidebar-user-card">
                <div className="user-avatar-circle">
                  {(admin?.name || "A").charAt(0).toUpperCase()}
                </div>
                <div className="user-info-text">
                  <div className="user-display-name">{admin?.name || "Admin"}</div>
                  <div className="user-role-label">Administrator</div>
                </div>
              </div>

              <button className="logout-nav-btn" onClick={handleLogout}>
                <IconLogout size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <button
              className="topbar-icon-btn"
              style={{ margin: "0 auto", color: "#fda4af" }}
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <IconLogout size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
