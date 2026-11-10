import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Wrap a page in <ProtectedRoute role="donor"> to restrict who can see it.
// This is for a clean EXPERIENCE only: the real security is the server's protect + restrictTo.
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  // While we are still checking the saved token, show a spinner.
  // WITHOUT this, a logged-in user would flash the login page on every refresh.
  if (loading) return <Loader />;

  if (!user) return <Navigate to="/login" replace />; // not logged in
  if (role && user.role !== role) return <Navigate to="/" replace />; // wrong role

  return children;
}
