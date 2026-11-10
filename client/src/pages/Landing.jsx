import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// A small component that shows the "meals rescued" number.
function ImpactCounter() {
  const [stats, setStats] = useState(null); // null = not loaded yet (or the request failed)

  useEffect(() => {
    let ignore = false; // becomes true if the visitor leaves before the answer arrives
    api
      .get('/stats')
      .then(({ data }) => {
        if (!ignore) setStats(data);
      })
      // This number is decoration. If it fails, show nothing rather than an error banner.
      // (Never do this for something the user needs to know about, such as a failed claim.)
      .catch(() => {});
    return () => {
      ignore = true; // cleanup: don't update state on a page that is gone
    };
  }, []);

  if (!stats) return null;

  return (
    <p className="mt-8 text-lg">
      {/* MDN: Number.prototype.toLocaleString() adds thousands separators */}
      <strong className="text-3xl text-green-700">{stats.mealsRescued.toLocaleString()}</strong> meals rescued
      {stats.pickups > 0 && <> across {stats.pickups.toLocaleString()} {stats.pickups === 1 ? 'pickup' : 'pickups'}</>}
    </p>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'donor' ? '/donor' : '/ngo';

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Surplus food, to the people who need it, before it spoils.</h1>
      <p className="mt-3 text-gray-700">
        AnnaSeva connects restaurants, caterers and hostels with nearby NGOs. Post what is left over, and the first NGO to
        claim it collects it.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {user ? (
          <Link to={dashboardPath} className="inline-flex min-h-11 items-center rounded bg-green-700 px-4 py-2 text-white">Go to my dashboard</Link>
        ) : (
          <>
            <Link to="/register" className="inline-flex min-h-11 items-center rounded bg-green-700 px-4 py-2 text-white">Get started</Link>
            <Link to="/login" className="inline-flex min-h-11 items-center rounded border border-gray-400 px-4 py-2">Log in</Link>
          </>
        )}
      </div>

      <ImpactCounter />

      <h2 className="mt-10 text-xl font-semibold">How it works</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5">
        <li><strong>Donors post</strong> what is left: what it is, how much, and until when.</li>
        <li><strong>NGOs see it nearby</strong>, on a map and in a list, updated live.</li>
        <li><strong>One NGO claims it.</strong> Nobody else can, and everyone sees that instantly.</li>
        <li><strong>The donor confirms the pickup</strong>, and the meals are added to the total above.</li>
      </ol>
    </main>
  );
}
