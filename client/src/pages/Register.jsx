import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

// The two roles the server accepts. The VALUES must be exactly 'donor' / 'ngo' (Zod rejects anything else).
const ROLES = [
  { value: 'donor', label: "I'm a donor (I have surplus food)" },
  { value: 'ngo', label: "I'm an NGO (I collect food)" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'donor', organization: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Same single handler as Login: works for text inputs AND radio buttons (both have name + value).
  function handleChange(e) {
    setForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Send organization only when filled in: an empty string is "nothing", so leave the key out.
      const { organization, ...rest } = form;
      const payload = organization.trim() ? { ...rest, organization: organization.trim() } : rest;

      const user = await register(payload);
      navigate(user.role === 'donor' ? '/donor' : '/ngo', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err)); // e.g. "password: Password must be at least 8 characters"
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold">Create an account</h1>

      {error && <p role="alert" className="mt-3 rounded bg-red-50 p-2 text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">I am joining as</legend>
          {ROLES.map((r) => (
            <label key={r.value} className="flex items-center gap-2 rounded border border-gray-300 p-2">
              <input type="radio" name="role" value={r.value}
                checked={form.role === r.value} onChange={handleChange} />
              <span>{r.label}</span>
            </label>
          ))}
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium">Your name</span>
          <input name="name" type="text" required minLength={2} maxLength={80} autoComplete="name"
            value={form.name} onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Organisation <span className="text-gray-500">(optional)</span></span>
          <input name="organization" type="text" maxLength={120} autoComplete="organization"
            value={form.organization} onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email"
            value={form.email} onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password <span className="text-gray-500">(at least 8 characters)</span></span>
          {/* No minLength here on purpose: the SERVER's validation message is what we want to show (test #5). */}
          <input name="password" type="password" required autoComplete="new-password"
            value={form.password} onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2" />
        </label>
        <button type="submit" disabled={submitting}
          className="min-h-11 w-full rounded bg-green-700 p-2 font-medium text-white disabled:opacity-50">
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account? <Link to="/login" className="text-green-700 underline">Log in</Link>
      </p>
    </main>
  );
}
