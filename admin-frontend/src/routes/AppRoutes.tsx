import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage.tsx";
import SignupPage from "../pages/SignupPage.tsx";
import DashboardLayout from "../components/DashboardLayout.tsx";
import ProtectedRoute from "../components/ProtectedRoute.tsx";
// REMOVE this import
// import { BrowserRouter } from "react-router-dom"; 

// Page Components
import DashboardPage from "../pages/DashboardPage.tsx";
import ReservationsPage from "../pages/ReservationsPage.tsx";
import StallsPage from "../pages/StallsPage.tsx";
// We are removing the test page
// import StallMapTestPage from "pages/StallMapTestPage";

export default function AppRoutes() {
  return (
    // REMOVE this wrapper
    // <BrowserRouter>
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
            {/* These routes are nested inside the layout */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/stalls" element={<StallsPage />} />
            
            {/* The test route is now removed */}
            {/* <Route path="/map-test" element={<StallMapTestPage />} /> */}
          </Route>
        </Route>
      </Routes>
    // </BrowserRouter>
    // REMOVE this wrapper
  );
}




// //1st version


// import { Routes, Route, Navigate } from "react-router-dom";
// import LoginPage from "../pages/LoginPage";
// import SignupPage from "../pages/SignupPage";
// import DashboardLayout from "../components/DashboardLayout";
// import ProtectedRoute from "../components/ProtectedRoute";

// // Import your new page components
// import DashboardPage from "../pages/DashboardPage";
// import ReservationsPage from "../pages/ReservationsPage";
// import StallsPage from "../pages/StallsPage";

// //import StallMapTestPage from "../pages/StallMapTestPage"; // Import the new page

// export default function AppRoutes() {
//   return (
//     <Routes>
//       {/* Public Routes */}
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/signup" element={<SignupPage />} />

//       {/* Redirect root to login */}
//       <Route path="/" element={<Navigate to="/login" replace />} />

//       {/* Protected Routes */}
//       <Route element={<ProtectedRoute />}>
//         <Route element={<DashboardLayout />}>
//           {/* These routes are nested inside the layout */}
//           <Route path="/dashboard" element={<DashboardPage />} />
//           <Route path="/reservations" element={<ReservationsPage />} />
//           <Route path="/stalls" element={<StallsPage />} />

//         </Route>
//       </Route>

//       {/* Add a 404 not found page if you like */}
//       {/* <Route path="*" element={<div>Page Not Found</div>} /> */}
//     </Routes>
//   );
// }

