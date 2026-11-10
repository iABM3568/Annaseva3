// pages/NotFound.jsx: shown for any URL no route matched
import { Link } from 'react-router';

export default function NotFound() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <Link to="/" className="mt-2 inline-block underline">Back to the home page</Link>
    </main>
  );
}
