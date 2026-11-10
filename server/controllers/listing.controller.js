import Listing from "../models/Listing.js";
import { NEARBY_LIMIT, LIST_LIMIT } from "../constants/listing.js";
import { emitListingNew, emitListingUpdated } from "../sockets/emit.js";

// Reusable helper: claim/complete/cancel all return readable donor + claimer info
// (the donor's screen shows WHO claimed; the NGO's screen shows WHICH donor).
const withParties = (query) =>
    query.populate("donor", "name organization").populate("claimedBy", "name organization");

// DONOR: create a listing
export async function createListing(req, res) {
    const { latitude, longitude, ...fields } = req.valid; // "...fields" = everything else

    const listing = await Listing.create({
        ...fields, // safe: Zod already removed any unexpected fields (like "status")
        donor: req.user.id, // from the verified token, NEVER from the request body
        location: { type: "Point", coordinates: [longitude, latitude] }, // GeoJSON order!
    });
    await listing.populate("donor", "name organization"); // NGOs' screens need the donor's name
    emitListingNew(listing); // announce AFTER the database write succeeded

    res.status(201).json({ listing });
}

// DONOR: my listings, newest first (each includes the computed isExpired flag)
export async function getMyListings(req, res) {
    const listings = await Listing.find({ donor: req.user.id })
        .sort({ createdAt: -1 })
        .limit(LIST_LIMIT) // never return unlimited rows
        .populate("claimedBy", "name organization"); // swap the id for a small user object
    res.json({ count: listings.length, listings });
}

// NGO: available food near me, nearest first
export async function getNearby(req, res) {
    const { lat, lng, radiusKm } = req.valid;

    const listings = await Listing.find({
        status: "available",
        expiresAt: { $gt: new Date() }, // hides expired food, no cron job required
        location: {
            $near: {
                $geometry: { type: "Point", coordinates: [lng, lat] }, // longitude first!
                $maxDistance: radiusKm * 1000, // metres
            },
        },
    })
        .limit(NEARBY_LIMIT) // never return unlimited rows
        .populate("donor", "name organization")
        .lean(); // plain JS objects: faster, since we won't modify them
    // (No isExpired here: the query already guarantees every result is not expired.)

    res.json({ count: listings.length, listings });
}

// NGO: listings I have claimed (claiming itself arrives on Day 4)
export async function getMyClaims(req, res) {
    const listings = await Listing.find({ claimedBy: req.user.id })
        .sort({ claimedAt: -1 })
        .limit(LIST_LIMIT)
        .populate("donor", "name organization");
    res.json({ count: listings.length, listings });
}

// ---------------------------------------------------------------------------
// STATE CHANGES (Day 4). Legal transitions:
//   available -> claimed -> completed
//   available | claimed -> cancelled
// Each handler is ONE atomic findOneAndUpdate whose FILTER is the guard:
// if the listing isn't in an allowed state (or isn't yours), nothing matches.
// ---------------------------------------------------------------------------

// If a transition fails, work out WHY: does the listing exist at all?
// existsFilter limits what the caller is allowed to know about.
async function failTransition(res, existsFilter, conflictMessage) {
    const exists = await Listing.exists(existsFilter);
    if (!exists) return res.status(404).json({ message: "Listing not found" });
    return res.status(409).json({ message: conflictMessage });
}

// NGO: claim a listing. ATOMIC: the check and the change happen in ONE database operation.
export async function claimListing(req, res) {
    const { id } = req.params;

    const listing = await withParties(
        Listing.findOneAndUpdate(
            // CONDITION (the guard): only match if it is STILL available and NOT expired
            { _id: id, status: "available", expiresAt: { $gt: new Date() } },
            // CHANGE: applied only if the condition matched
            { status: "claimed", claimedBy: req.user.id, claimedAt: new Date() },
            // returnDocument: 'after' returns the document AFTER the update (the default is the version before).
            { returnDocument: "after" }
        )
    );

    // null means nothing matched: someone was faster, or it expired, or it doesn't exist.
    if (!listing) {
        return failTransition(res, { _id: id }, "This listing was already claimed or has expired");
    }

    emitListingUpdated(listing); // only after the atomic update really happened
    res.json({ listing });
}

// DONOR: mark a claimed listing as picked up. Only the owner, only from "claimed".
export async function completeListing(req, res) {
    const { id } = req.params;

    const listing = await withParties(
        Listing.findOneAndUpdate(
            { _id: id, donor: req.user.id, status: "claimed" }, // donor: req.user.id = ownership check (prevents IDOR)
            { status: "completed", completedAt: new Date() },
            { returnDocument: "after" }
        )
    );

    if (!listing) {
        // Look only among THIS donor's listings, so other people's listings stay invisible (404).
        return failTransition(res, { _id: id, donor: req.user.id }, "Only a claimed listing can be marked as picked up");
    }
    emitListingUpdated(listing);
    res.json({ listing });
}

// DONOR: cancel a listing that is still available or claimed.
export async function cancelListing(req, res) {
    const { id } = req.params;

    const listing = await withParties(
        Listing.findOneAndUpdate(
            { _id: id, donor: req.user.id, status: { $in: ["available", "claimed"] } },
            { status: "cancelled" },
            { returnDocument: "after" }
        )
    );

    if (!listing) {
        return failTransition(res, { _id: id, donor: req.user.id }, "This listing can no longer be cancelled");
    }
    emitListingUpdated(listing);
    res.json({ listing });
}
