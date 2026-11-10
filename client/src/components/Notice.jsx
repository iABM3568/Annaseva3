// A short message that screen readers announce. The parent decides when to clear it.
export default function Notice({ message, onClose }) {
  if (!message) return null;
  return (
    <div role="status" className="mt-3 mb-3 flex items-center justify-between rounded bg-blue-50 p-2 text-blue-800">
      <span>{message}</span>
      {onClose && <button type="button" onClick={onClose} aria-label="Dismiss" className="px-2">x</button>}
    </div>
  );
}
