import { Routes, Route } from 'react-router';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import NewListing from './pages/NewListing';
import NgoNearby from './pages/NgoNearby';
import MyClaims from './pages/MyClaims';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Role-protected pages: the real security is on the server; this is for a clean experience. */}
        <Route path="/donor" element={<ProtectedRoute role="donor"><DonorDashboard /></ProtectedRoute>} />
        <Route path="/donor/new" element={<ProtectedRoute role="donor"><NewListing /></ProtectedRoute>} />
        <Route path="/ngo" element={<ProtectedRoute role="ngo"><NgoNearby /></ProtectedRoute>} />
        <Route path="/ngo/claims" element={<ProtectedRoute role="ngo"><MyClaims /></ProtectedRoute>} />

        {/* path="*" matches anything else */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
