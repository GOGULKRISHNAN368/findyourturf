import { Navigate, Route, Routes } from "react-router-dom";

import "./App.css";
import AdminDashboard from "./pages/AdminDashboard";
import TournamentManagement from "./pages/TournamentManagement";
import LiveScoringConsole from "./pages/LiveScoringConsole";

function App() {
  return (
    <Routes>
      <Route
        path="/admin"
        element={<AdminDashboard />}
      />

      <Route
        path="/tournament/:eventId"
        element={<TournamentManagement />}
      />

      <Route
        path="/live-matches/:matchId/score"
        element={<LiveScoringConsole />}
      />

      <Route
        path="/"
        element={<Navigate to="/admin" replace />}
      />
      <Route
        path="/login"
        element={<Navigate to="/admin" replace />}
      />

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default App;
