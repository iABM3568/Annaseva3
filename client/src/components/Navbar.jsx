import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

// Role-aware: each role only sees the links that make sense for it.
// (Hiding links is UX only; the server's restrictTo is the real check.)
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 bg-green-700 px-4 py-3 text-white">
      <Link to="/" className="text-lg font-bold">AnnaSeva</Link>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        {!user && (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register">Register</Link>
          </>
        )}
        {user?.role === 'donor' && (
          <>
            <Link to="/donor">My listings</Link>
            <Link to="/donor/new">Post food</Link>
          </>
        )}
        {user?.role === 'ngo' && (
          <>
            <Link to="/ngo">Find food</Link>
            <Link to="/ngo/claims">My claims</Link>
          </>
        )}
        {user && (
          <>
            <span className="opacity-80">{user.name}</span>
            <button type="button" onClick={handleLogout} className="underline">Log out</button>
          </>
        )}
      </div>
    </nav>
  );
}
