import React, { useState, useEffect } from "react";
import { socket } from "../services/socket";
import { IconLive, IconPlus } from "../components/common/Icons";

export default function LiveMatches() {
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("LIVE");

  useEffect(() => {
    // This is a placeholder for fetching live matches from the API
    // Normally you'd fetch from /api/live-matches here
    const fetchMatches = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/live-matches/admin", {
          headers: {
            "Content-Type": "application/json"
          }
        });
        const data = await response.json();
        if (data.success) {
          setMatches(data.active || []);
        }
      } catch (err) {
        console.error("Failed to fetch live matches", err);
      }
    };
    
    fetchMatches();
    
    const handleScoreUpdated = (update) => {
      // Handle real time updates without refresh
      fetchMatches(); // Quick refresh for now
    };
    
    socket.on("match:scoreUpdated", handleScoreUpdated);
    
    return () => {
      socket.off("match:scoreUpdated", handleScoreUpdated);
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Live Matches Console</h2>
        <button className="btn btn-primary">
          <IconPlus size={16} /> Assign Match
        </button>
      </div>
      
      <div className="filter-pills-group" style={{ marginBottom: "20px" }}>
        {["LIVE", "UPCOMING", "COMPLETED"].map((tab) => (
          <button 
            key={tab} 
            className={`filter-pill ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="card">
        {matches.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
            <IconLive size={48} style={{ opacity: 0.5, marginBottom: "10px" }} />
            <h3>No matches found</h3>
            <p>Assign a new match to see it here.</p>
          </div>
        ) : (
          <div className="matches-grid" style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            {matches.map(match => (
              <div key={match._id} style={{ border: "1px solid #eee", padding: "16px", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 10px 0" }}>{match.matchName}</h4>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                  <span>{match.teamA.name}</span>
                  <strong>vs</strong>
                  <span>{match.teamB.name}</span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-coral" style={{ flex: 1 }}>Score Match</button>
                  <button className="btn btn-outline" style={{ flex: 1 }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
