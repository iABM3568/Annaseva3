import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { getErrorMessage } from '../utils/errors';
import ListingCard from '../components/ListingCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function MyClaims() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/listings/claimed');
      setListings(data.listings);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loader />;
  if (error) return <main className="p-4"><ErrorMessage message={error} onRetry={load} /></main>;

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-bold">My claims</h1>

      {listings.length === 0 ? (
        <div className="mt-4"><EmptyState title="You haven't claimed anything yet" hint="Find food near you and claim it." /></div>
      ) : (
        <div className="mt-4 grid gap-3">
          {listings.map((listing) => {
            const [lng, lat] = listing.location.coordinates; // stored order: LONGITUDE first
            return (
              <ListingCard key={listing._id} listing={listing}>
                <p className="w-full text-sm">From: {listing.donor?.organization || listing.donor?.name}</p>
                {listing.status === 'claimed' && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                    target="_blank" rel="noopener noreferrer"
                    className="rounded bg-blue-600 px-3 py-1 text-white">
                    Get directions
                  </a>
                )}
              </ListingCard>
            );
          })}
        </div>
      )}
    </main>
  );
}
