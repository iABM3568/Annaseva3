import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { displayStatus } from '../utils/format';
import ListingCard from '../components/ListingCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';
import { useSocket } from '../context/SocketContext';

export default function DonorDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true); // state 1: loading
  const [error, setError] = useState(''); // state 2: error
  const [notice, setNotice] = useState('');
  const { socket } = useSocket();

  // useCallback: the SAME function between renders, so it is safe in effect dependency arrays.
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/listings/mine');
      setListings(data.listings); // state 4: data (state 3, empty, is checked in the JSX)
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // LIVE UPDATES: an NGO claimed one of my listings (or it changed elsewhere, e.g. another tab).
  useEffect(() => {
    if (!socket) return;

    function handleUpdated(listing) {
      // Swap the changed listing in place. Ignore ones that aren't on this screen.
      setListings((previous) => previous.map((l) => (l._id === listing._id ? listing : l)));
      if (listing.status === 'claimed') {
        setNotice(`${listing.claimedBy?.organization || listing.claimedBy?.name || 'An NGO'} claimed "${listing.title}"`);
      }
    }

    socket.on('listing:updated', handleUpdated);
    socket.io.on('reconnect', load); // re-fetch the truth after a reconnect
    return () => {
      socket.off('listing:updated', handleUpdated);
      socket.io.off('reconnect', load);
    };
  }, [socket, load]);

  // action is 'complete' or 'cancel'. The server decides if it's allowed.
  async function act(id, action) {
    if (action === 'cancel' && !window.confirm('Cancel this listing?')) return;
    try {
      const { data } = await api.patch(`/listings/${id}/${action}`);
      // Replace just this listing with the server's version. All others stay as they are.
      setListings((previous) => previous.map((l) => (l._id === id ? data.listing : l)));
      setNotice(action === 'complete' ? 'Marked as picked up. Thank you!' : 'Listing cancelled.');
    } catch (err) {
      setNotice(getErrorMessage(err));
    }
  }

  if (loading) return <Loader />;
  if (error) return <main className="p-4"><ErrorMessage message={error} onRetry={load} /></main>;

  const active = listings.filter((l) => ['available', 'claimed'].includes(l.status) && displayStatus(l) !== 'expired');
  const history = listings.filter((l) => !active.includes(l));

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My listings</h1>
        <Link to="/donor/new" className="rounded bg-green-600 px-3 py-2 text-white">Post food</Link>
      </div>

      <Notice message={notice} onClose={() => setNotice('')} />

      {listings.length === 0 ? (
        <EmptyState title="You haven't posted anything yet" hint="Surplus food helps someone nearby. Post your first listing.">
          <Link to="/donor/new" className="mt-3 inline-block underline">Post food</Link>
        </EmptyState>
      ) : (
        <>
          <h2 className="mt-6 font-semibold">Active</h2>
          <div className="mt-2 grid gap-3">
            {active.map((listing) => (
              <ListingCard key={listing._id} listing={listing}>
                {listing.status === 'claimed' && (
                  <button type="button" onClick={() => act(listing._id, 'complete')} className="rounded bg-blue-600 px-3 py-1 text-white">
                    Mark picked up
                  </button>
                )}
                <button type="button" onClick={() => act(listing._id, 'cancel')} className="rounded border border-red-300 px-3 py-1 text-red-700">
                  Cancel
                </button>
              </ListingCard>
            ))}
            {active.length === 0 && <p className="text-sm text-gray-600">Nothing active right now.</p>}
          </div>

          <h2 className="mt-6 font-semibold">History</h2>
          <div className="mt-2 grid gap-3">
            {history.map((listing) => <ListingCard key={listing._id} listing={listing} />)}
            {history.length === 0 && <p className="text-sm text-gray-600">No past listings yet.</p>}
          </div>
        </>
      )}
    </main>
  );
}
