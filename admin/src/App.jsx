import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import "./App.css";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import TournamentManagement from "./pages/TournamentManagement";
import { isAdminAuthenticated } from "./services/auth";

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

function LoginRoute() {
  const location = useLocation();

  if (isAdminAuthenticated()) {
    return <Navigate to={location.state?.from || "/admin"} replace />;
  }

  return <AdminLogin />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tournament/:eventId"
        element={
          <ProtectedRoute>
            <TournamentManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to={isAdminAuthenticated() ? "/admin" : "/login"}
            replace
          />
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
