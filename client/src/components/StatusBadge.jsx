// Lookup table: status -> Tailwind colour classes. Easier to read than a chain of if/else.
const STYLES = {
  available: 'bg-green-100 text-green-800',
  claimed: 'bg-amber-100 text-amber-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-200 text-gray-700',
  expired: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status] || STYLES.cancelled}`}>
      {status}
    </span>
  );
}
