import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

export default function AdminLayout({
  activeTab,
  setActiveTab,
  title,
  breadcrumb,
  searchQuery,
  setSearchQuery,
  onRefresh,
  counts,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`admin-layout ${collapsed ? "layout-collapsed" : ""}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        counts={counts}
      />

      <div className={`admin-main-wrapper ${collapsed ? "wrapper-collapsed" : ""}`}>
        <TopNavbar
          title={title}
          breadcrumb={breadcrumb}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={onRefresh}
          setMobileOpen={setMobileOpen}
        />

        <main className="admin-content-area">{children}</main>
      </div>
    </div>
  );
}
