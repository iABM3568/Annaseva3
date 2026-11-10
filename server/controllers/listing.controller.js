import Listing from "../models/Listing.js";
import { NEARBY_LIMIT, LIST_LIMIT } from "../constants/listing.js";

// DONOR: create a listing
export async function createListing(req, res) {
    const { latitude, longitude, ...fields } = req.valid; // "...fields" = everything else

    const listing = await Listing.create({
        ...fields, // safe: Zod already removed any unexpected fields (like "status")
        donor: req.user.id, // from the verified token, NEVER from the request body
        location: { type: "Point", coordinates: [longitude, latitude] }, // GeoJSON order!
    });

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
