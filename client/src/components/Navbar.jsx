import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

// Minimal for now: Day 6 expands it.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout(); // clears localStorage and the user in Context
    navigate('/login', { replace: true });
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      <Link to="/" className="text-lg font-bold text-green-700">AnnaSeva</Link>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link to={user.role === 'donor' ? '/donor' : '/ngo'}>{user.name}</Link>
            <button type="button" onClick={handleLogout} className="rounded border border-gray-300 px-3 py-1">
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/register" className="rounded bg-green-600 px-3 py-1 text-white">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
