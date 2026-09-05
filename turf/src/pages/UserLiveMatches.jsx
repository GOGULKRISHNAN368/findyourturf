import React, { useState, useEffect } from "react";
import { socket } from "../services/socket";
import { PlayCircle } from "lucide-react";
import { API_URL } from "../services/config";

// Assuming we have a MobileHeader similar to App.jsx
// We'll just build a basic UI for now
export default function UserLiveMatches() {
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("LIVE");

  useEffect(() => {
    // This is a placeholder for fetching live matches from the API
    const fetchMatches = async () => {
      try {
        const response = await fetch(`${API_URL}/api/live-matches/live`, {
          headers: {
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        if (data.success) {
          setMatches(data.matches || []);
        }
      } catch (err) {
        console.error("Failed to fetch live matches", err);
      }
    };
    
    fetchMatches();
    
    const handleScoreUpdated = (update) => {
      // Real-time update logic
      fetchMatches();
    };
    
    socket.on("match:scoreUpdated", handleScoreUpdated);
    
    return () => {
      socket.off("match:scoreUpdated", handleScoreUpdated);
    };
  }, []);

  return (
    <div className="mobile-app-container">
      {/* MobileHeader replica or import it properly if possible */}
      <header className="app-header">
        <div className="header-logo-container">
          <div className="header-text-group">
            <div className="header-brand">FindYour<span>Turf</span></div>
            <div className="header-tagline">Live Cricket Scores</div>
          </div>
        </div>
      </header>

      <div className="home-scroll-area" style={{ padding: "20px" }}>
        <h2 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <PlayCircle size={24} color="#f43f5e" /> Live Action
        </h2>
        
        <div className="filter-pills-group" style={{ marginBottom: "20px" }}>
          {["LIVE", "UPCOMING", "RESULTS"].map((tab) => (
            <button 
              key={tab} 
              className={`filter-pill ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "none",
                backgroundColor: activeTab === tab ? "#000" : "#f0f0f0",
                color: activeTab === tab ? "#fff" : "#000",
                marginRight: "8px"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {matches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <PlayCircle size={48} style={{ opacity: 0.5, marginBottom: "10px" }} />
            <h3>No Live Matches</h3>
            <p>Check back later for live action.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {matches.map(match => (
              <div key={match._id} style={{ border: "1px solid #eee", padding: "16px", borderRadius: "8px", backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#f43f5e", fontWeight: "bold" }}>● LIVE</span>
                  <span style={{ fontSize: "12px", color: "#666" }}>{match.format}</span>
                </div>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>{match.matchName}</h4>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{match.teamA.shortName}</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                      {match.score.firstInnings.runs}/{match.score.firstInnings.wickets}
                      <span style={{ fontSize: "12px", color: "#666", marginLeft: "4px" }}>
                        ({Math.floor(match.score.firstInnings.legalBalls / 6)}.{match.score.firstInnings.legalBalls % 6})
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: "0 16px", color: "#999", fontSize: "14px", fontStyle: "italic" }}>vs</div>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{match.teamB.shortName}</div>
                    <div style={{ fontSize: "20px", fontWeight: "bold", color: "#666" }}>Yet to bat</div>
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "#666", textAlign: "center", fontStyle: "italic", borderTop: "1px solid #eee", paddingTop: "8px" }}>
                  {match.resultText || "Match in progress"}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: "100px" }}></div>
      </div>
    </div>
  );
}
