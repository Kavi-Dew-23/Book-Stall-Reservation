import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
// import PublisherDashboard from './pages/PublisherDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import StallMap from './pages/StallMap';
import PublisherHome from './pages/PublisherHome';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"
        element={
            <LandingPage/>
        }>
        
        </Route>
        <Route 
        path="/register"
        element={
          <Register/>
        }>
        </Route>
        <Route 
        path="/login"
        element={
          <Login/>
        }>
        </Route>
        <Route 
        path="/stallmap"
        element={
          <StallMap/>
        }>
        </Route>

        {/* Protected routes */}
        {/* <Route
          path="/publisher"
          element={
            <ProtectedRoute allowedRoles={["publisher"]}>
              <PublisherDashboard />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/publisher"
          element={
            <ProtectedRoute allowedRoles={["publisher"]}>
              <StallMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/publisher/home"
          element={
            <ProtectedRoute allowedRoles={["publisher"]}>
              <PublisherHome />
            </ProtectedRoute>
          }
        />

        {/* Protected routes */}
        <Route
          path="/organizer"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
