import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

// Role-aware: each role only sees the links that make sense for it.
// (Hiding links is UX only; the server's restrictTo is the real check.)
export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-2 bg-green-700 px-4 py-3 text-white">
      <Link to="/" className="text-lg font-bold">AnnaSeva</Link>

      <div className="flex flex-wrap items-center gap-x-4 text-sm [&>a]:py-3 [&>button]:py-3">
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
            <span>{user.name}</span>
            {/* Live badge: is the real-time connection up? */}
            <span title={connected ? 'Live updates on' : 'Reconnecting...'} className="text-xs" aria-live="polite">
              {connected ? '● Live' : '○ Offline'}
            </span>
            <button type="button" onClick={handleLogout} className="underline">Log out</button>
          </>
        )}
      </div>
    </nav>
  );
}
