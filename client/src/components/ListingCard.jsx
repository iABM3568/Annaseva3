import StatusBadge from './StatusBadge';
import { displayStatus, formatDateTime, timeLeft } from '../utils/format';

// "children" lets each page put its OWN buttons inside the card (Cancel for donors, Claim for NGOs).
export default function ListingCard({ listing, children }) {
  const status = displayStatus(listing);

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold break-words">{listing.title}</h3>
        <StatusBadge status={status} />
      </div>

      <p className="mt-1 text-sm text-gray-600">
        {listing.quantity} meals, {listing.foodType}
      </p>
      {listing.description && <p className="mt-1 text-sm break-words">{listing.description}</p>}

      <p className="mt-2 text-sm text-gray-600 break-words">Pickup: {listing.pickupAddress}</p>
      <p className="text-sm text-gray-600">
        Expires {formatDateTime(listing.expiresAt)} ({timeLeft(listing.expiresAt)})
      </p>

      {/* Optional extras: who claimed it */}
      {listing.claimedBy?.name && (
        <p className="mt-1 text-sm">Claimed by: {listing.claimedBy.organization || listing.claimedBy.name}</p>
      )}

      {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
    </article>
  );
}
