// Empty state: tell the user what is missing AND what to do next.
export default function EmptyState({ title, hint, children }) {
  return (
    <div className="mt-4 rounded border border-dashed border-gray-300 p-8 text-center text-gray-600">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm">{hint}</p>}
      {children}
    </div>
  );
}
