import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage.tsx";
import SignupPage from "../pages/SignupPage.tsx";
import DashboardLayout from "../components/DashboardLayout.tsx";
import ProtectedRoute from "../components/ProtectedRoute.tsx";
import DashboardPage from "../pages/DashboardPage.tsx";
import ReservationsPage from "../pages/ReservationsPage.tsx";
import StallsPage from "../pages/StallsPage.tsx";

export default function AppRoutes() {
  return (
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to={localStorage.getItem("token") ? "/dashboard" : "/login"} replace />
          }
        />

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/stalls" element={<StallsPage />} />
          </Route>
        </Route>
      </Routes>
  );
}

