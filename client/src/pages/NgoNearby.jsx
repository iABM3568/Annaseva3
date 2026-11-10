import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import useGeolocation from '../hooks/useGeolocation';
import { getErrorMessage } from '../utils/errors';
import { DEFAULT_CENTER, distanceKm, formatDistance, listingLatLng } from '../utils/geo';
import ListingMap from '../components/ListingMap';
import ListingCard from '../components/ListingCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';
import { useSocket } from '../context/SocketContext';

export default function NgoNearby() {
  const { coords: gpsCoords, error: geoError, loading: geoLoading, locate } = useGeolocation();
  const { socket } = useSocket();

  const [center, setCenter] = useState(null); // where we search: from GPS, a map click, or the default city
  const [radiusKm, setRadiusKm] = useState(10);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [claimingId, setClaimingId] = useState(null); // which listing is being claimed right now

  // When GPS gives us a location, use it as the search centre.
  useEffect(() => {
    if (gpsCoords) setCenter(gpsCoords);
  }, [gpsCoords]);
  // If location fails (denied, timeout, unsupported) and we have no centre yet, fall back to the
  // default city so the MAP still appears and the user can click it to search somewhere else.
  useEffect(() => {
    if (geoError) setCenter((current) => current ?? DEFAULT_CENTER);
  }, [geoError]);
  // Ask for GPS once when the page opens.
  useEffect(() => {
    locate();
  }, [locate]);

  // A counter that guards against STALE responses (see Concept 6).
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    if (!center) return;
    const requestId = ++latestRequest.current; // number this request
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/listings/nearby', {
        params: { lat: center.lat, lng: center.lng, radiusKm }, // becomes ?lat=..&lng=..&radiusKm=..
      });
      if (requestId !== latestRequest.current) return; // a newer request exists: ignore this old answer
      setListings(data.listings);
      setLoading(false);
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }, [center, radiusKm]);

  useEffect(() => {
    load();
  }, [load]); // reload whenever the centre or radius changes

  // LIVE UPDATES: react to events pushed by the server.
  useEffect(() => {
    if (!socket || !center) return;

    function handleNew(listing) {
      // Only show it if it's inside MY search radius.
      const km = distanceKm(center.lat, center.lng, ...listingLatLng(listing));
      if (km > radiusKm) return;
      setListings((previous) =>
        previous.some((l) => l._id === listing._id) ? previous : [listing, ...previous] // avoid duplicates
      );
      setNotice(`New food nearby: ${listing.title}`);
    }

    function handleUpdated(listing) {
      // Claimed, completed or cancelled means it's no longer available to anyone: remove it.
      if (listing.status !== 'available') {
        setListings((previous) => previous.filter((l) => l._id !== listing._id));
      }
    }

    socket.on('listing:new', handleNew);
    socket.on('listing:updated', handleUpdated);
    // We may have missed events while disconnected, so re-fetch the truth after a reconnect.
    socket.io.on('reconnect', load);

    // CLEANUP: remove exactly the handlers we added, or events will be handled twice.
    return () => {
      socket.off('listing:new', handleNew);
      socket.off('listing:updated', handleUpdated);
      socket.io.off('reconnect', load);
    };
  }, [socket, center, radiusKm, load]);

  async function handleClaim(listing) {
    if (!window.confirm(`Claim "${listing.title}"? You're committing to collect it.`)) return;
    setClaimingId(listing._id);
    try {
      const { data } = await api.patch(`/listings/${listing._id}/claim`);
      // We won. Remove it from "available" and tell the user where to go.
      setListings((previous) => previous.filter((l) => l._id !== listing._id));
      setNotice(`Claimed "${data.listing.title}". Pickup: ${data.listing.pickupAddress}. Find it under "My claims".`);
    } catch (err) {
      setNotice(getErrorMessage(err));
      // 409 = someone else was faster, or it expired. It's gone either way: remove it.
      if (err.response?.status === 409) {
        setListings((previous) => previous.filter((l) => l._id !== listing._id));
      }
    } finally {
      setClaimingId(null); // re-enable the button whatever happened (never a frozen button)
    }
  }

  const usingDefault = center === DEFAULT_CENTER;

  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="text-2xl font-bold">Food near you</h1>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={locate} disabled={geoLoading} className="inline-flex min-h-11 items-center rounded bg-gray-100 px-3 py-2">
          {geoLoading ? 'Finding you...' : 'Use my location'}
        </button>
        <label className="text-sm">
          Radius{' '}
          <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="min-h-11 rounded border border-gray-300 p-1 text-base">
            {[2, 5, 10, 25, 50].map((km) => <option key={km} value={km}>{km} km</option>)}
          </select>
        </label>
        <span className="text-sm text-gray-600">Tip: click the map to search somewhere else.</span>
      </div>
      {geoError && (
        <p className="mt-2 text-sm text-red-700">
          {geoError} {usingDefault ? `Showing ${DEFAULT_CENTER.label}. ` : ''}You can still click the map to pick a place.
        </p>
      )}

      <Notice message={notice} onClose={() => setNotice('')} />

      {/* No centre yet: we are still asking the browser for a location. */}
      {!center ? (
        <div className="mt-4">
          <EmptyState title="Finding your location..." hint="Allow location access to see food near you." />
        </div>
      ) : (
        <>
          <div className="mt-4">
            <ListingMap center={center} radiusKm={radiusKm} listings={listings} onPick={setCenter} />
          </div>

          <div className="mt-4">
            {loading && <Loader text="Searching nearby..." />}
            {error && <ErrorMessage message={error} onRetry={load} />}
            {!loading && !error && listings.length === 0 && (
              <EmptyState title="No food available in this area right now"
                hint="Try a larger radius or another place. New listings will appear here." />
            )}

            <div className="grid gap-3">
              {listings.map((listing) => {
                const km = distanceKm(center.lat, center.lng, ...listingLatLng(listing)); // spread: lat, lng
                return (
                  <ListingCard key={listing._id} listing={listing}>
                    <span className="self-center text-sm text-gray-600">{formatDistance(km)} away</span>
                    <button type="button" onClick={() => handleClaim(listing)} disabled={claimingId === listing._id}
                      className="inline-flex min-h-11 items-center rounded bg-green-700 px-3 py-2 text-white disabled:opacity-50">
                      {claimingId === listing._id ? 'Claiming...' : 'Claim'}
                    </button>
                  </ListingCard>
                );
              })}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
