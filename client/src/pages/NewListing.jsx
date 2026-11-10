import { useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../services/api';
import useGeolocation from '../hooks/useGeolocation';
import { getErrorMessage } from '../utils/errors';
import { toLocalInputValue } from '../utils/format';

// Build default form values: prepared now, expires in 3 hours.
function makeInitialForm() {
  const now = new Date();
  return {
    title: '',
    description: '',
    foodType: 'veg',
    quantity: 10,
    preparedAt: toLocalInputValue(now),
    expiresAt: toLocalInputValue(new Date(now.getTime() + 3 * 60 * 60 * 1000)),
    pickupAddress: '',
  };
}

const FOOD_TYPES = [
  { value: 'veg', label: 'Vegetarian' },
  { value: 'non-veg', label: 'Non-vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'mixed', label: 'Mixed' },
];

const inputClass = 'mt-1 min-h-11 w-full rounded border border-gray-300 p-2';

export default function NewListing() {
  const navigate = useNavigate();
  const { coords, error: geoError, loading: geoLoading, locate } = useGeolocation();
  const [form, setForm] = useState(makeInitialForm); // function form = computed once
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // True after a submit attempt without a location. The hint hides itself as soon as a location arrives.
  const [needsLocation, setNeedsLocation] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!coords) {
      setNeedsLocation(true); // shown next to the location button until a location arrives
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/listings', {
        title: form.title,
        description: form.description || undefined, // omit when empty
        foodType: form.foodType,
        quantity: Number(form.quantity), // inputs always give text; convert
        // datetime-local has no time zone: new Date() reads it as LOCAL time, toISOString() gives UTC
        preparedAt: new Date(form.preparedAt).toISOString(),
        expiresAt: new Date(form.expiresAt).toISOString(),
        pickupAddress: form.pickupAddress,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      navigate('/donor');
    } catch (err) {
      setError(getErrorMessage(err)); // shows the server's validation messages
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="text-2xl font-bold">Post surplus food</h1>
      {error && <p role="alert" className="mt-3 rounded bg-red-50 p-2 text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">What is it?</span>
          <input name="title" required minLength={3} maxLength={100} value={form.title} onChange={handleChange}
            placeholder="e.g. Vegetable biryani" className={inputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Description <span className="text-gray-500">(optional)</span></span>
          <textarea name="description" rows={3} maxLength={500} value={form.description} onChange={handleChange}
            placeholder="e.g. Serves about 20. Please bring containers." className={inputClass} />
        </label>

        {/* Two fields side by side on wider screens, stacked on phones */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Food type</span>
            <select name="foodType" value={form.foodType} onChange={handleChange} className={inputClass}>
              {FOOD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Quantity (meals)</span>
            <input name="quantity" type="number" required min={1} max={10000} step={1} inputMode="numeric"
              value={form.quantity} onChange={handleChange} className={inputClass} />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Prepared at</span>
            <input name="preparedAt" type="datetime-local" required value={form.preparedAt} onChange={handleChange}
              className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Good until <span className="text-gray-500">(max 24 h)</span></span>
            {/* No "min" on purpose: the SERVER is the judge of valid times, and its message is shown. */}
            <input name="expiresAt" type="datetime-local" required value={form.expiresAt} onChange={handleChange}
              className={inputClass} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Pickup address</span>
          <input name="pickupAddress" required minLength={5} maxLength={200} autoComplete="street-address"
            value={form.pickupAddress} onChange={handleChange} placeholder="e.g. 12 MG Road, near the bus stop"
            className={inputClass} />
        </label>

        <div className="rounded border border-gray-200 p-3">
          {/* type="button": otherwise clicking it would SUBMIT the form */}
          <button type="button" onClick={locate} disabled={geoLoading} className="inline-flex min-h-11 items-center rounded bg-gray-100 px-3 py-2">
            {geoLoading ? 'Finding you...' : coords ? 'Update my location' : 'Use my current location'}
          </button>
          {coords && <p className="mt-2 text-sm text-green-700">Location saved ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</p>}
          {geoError && <p className="mt-2 text-sm text-red-700">{geoError}</p>}
          {needsLocation && !coords && (
            <p role="alert" className="mt-2 text-sm text-red-700">Please share your pickup location first.</p>
          )}
        </div>

        <button type="submit" disabled={submitting} className="min-h-11 w-full rounded bg-green-700 p-2 font-medium text-white disabled:opacity-50">
          {submitting ? 'Posting...' : 'Post listing'}
        </button>
      </form>
    </main>
  );
}
