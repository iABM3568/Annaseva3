import { useState, useCallback } from 'react';

// A custom hook: reusable "get the user's location" logic with loading and error state.
export default function useGeolocation() {
  const [coords, setCoords] = useState(null); // { lat, lng } once we have it
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // useCallback keeps the same function between renders (so it's safe in dependency arrays).
  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location.');
      return;
    }
    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // success callback
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoading(false);
      },
      (err) => {
        // failure callback (denied, timeout...)
        setError(err.code === 1 ? 'Location permission was denied.' : 'Could not get your location.');
        setLoading(false);
      },
      { timeout: 10000 } // give up after 10 seconds
    );
  }, []);

  return { coords, error, loading, locate };
}
