// Error state: say what went wrong AND offer a way out (retry).
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div role="alert" className="rounded bg-red-50 p-3 text-red-700">
      <p>{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-2 underline">Try again</button>}
    </div>
  );
}
