import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Controlled inputs: React state is the single source of truth for what's typed.
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // One handler for every input: the input's "name" attribute picks which field to update.
  function handleChange(e) {
    setForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser's default full-page form submit
    setError('');
    setSubmitting(true); // disables the button so a double-click can't send two requests
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'donor' ? '/donor' : '/ngo', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold">Log in</h1>

      {/* role="alert" makes screen readers announce the error */}
      {error && <p role="alert" className="mt-3 rounded bg-red-50 p-2 text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email"
            value={form.email} onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input name="password" type="password" required autoComplete="current-password"
            value={form.password} onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 p-2" />
        </label>
        <button type="submit" disabled={submitting}
          className="min-h-11 w-full rounded bg-green-700 p-2 font-medium text-white disabled:opacity-50">
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        New here? <Link to="/register" className="text-green-700 underline">Create an account</Link>
      </p>
    </main>
  );
}
