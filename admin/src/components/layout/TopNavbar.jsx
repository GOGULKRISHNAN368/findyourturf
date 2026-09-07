import {
  IconMenu,
  IconSearch,
  IconRefresh,
  IconBell,
  IconLogout,
} from "../common/Icons";
import { getAdmin, logoutAdmin } from "../../services/auth";

function handleLogout() {
  logoutAdmin();
  window.dispatchEvent(new Event("admin-auth-changed"));
}

export default function TopNavbar({
  title = "Dashboard",
  breadcrumb = "Overview",
  searchQuery = "",
  setSearchQuery = null,
  onRefresh = null,
  setMobileOpen,
}) {
  const admin = getAdmin();

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <IconMenu size={20} />
        </button>

        <div className="topbar-title-block">
          <h1 className="topbar-page-title">{title}</h1>
          <span className="topbar-breadcrumb">{breadcrumb}</span>
        </div>
      </div>

      <div className="topbar-right">
        {setSearchQuery && (
          <div className="topbar-search-box">
            <IconSearch size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search tournaments, teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tournaments"
            />
          </div>
        )}

        <div className="live-sync-indicator" title="Real-time Gateway Synced">
          <span className="pulse-dot" />
          <span>Live Gateway</span>
        </div>

        {onRefresh && (
          <button
            className="topbar-icon-btn"
            onClick={onRefresh}
            title="Refresh data"
            aria-label="Refresh data"
          >
            <IconRefresh size={17} />
          </button>
        )}

        <button
          className="topbar-icon-btn"
          title="Notifications"
          aria-label="Notifications"
        >
          <IconBell size={18} />
          <span className="notification-badge" />
        </button>

        <div className="topbar-user-profile" title={admin?.email || "Administrator"}>
          <div className="user-avatar-circle" style={{ width: "36px", height: "36px" }}>
            {(admin?.name || "A").charAt(0).toUpperCase()}
          </div>
          <div className="topbar-user-text desktop-only">
            <span className="topbar-user-name">{admin?.name || "Admin"}</span>
            <span className="topbar-user-role">Administrator</span>
          </div>
        </div>

        <button
          className="topbar-icon-btn"
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
        >
          <IconLogout size={18} />
        </button>
      </div>
    </header>
  );
}
