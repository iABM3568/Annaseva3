import { getIO } from "./index.js";

// Turn a Mongoose document into a plain object (or pass plain objects through).
const toPlain = (listing) => (typeof listing.toObject === "function" ? listing.toObject() : listing);

// An id can be a plain id OR a populated user object ({ _id, name, ... }). Return the id string either way.
const idOf = (value) => (value ? String(value._id ?? value) : null);

// A new listing: tell every NGO.
export function emitListingNew(listing) {
    getIO()?.to("ngos").emit("listing:new", toPlain(listing)); // "?." = do nothing if sockets aren't running
}

// A listing changed (claimed, completed, cancelled).
export function emitListingUpdated(listing) {
    const io = getIO();
    if (!io) return;

    const plain = toPlain(listing);
    const donorId = idOf(plain.donor);
    const claimerId = idOf(plain.claimedBy);

    // Other NGOs only need to know "this listing changed", NOT who claimed it (data minimisation).
    // eslint-disable-next-line no-unused-vars
    const { claimedBy, ...publicVersion } = plain;
    let otherNgos = io.to("ngos");
    if (claimerId) otherNgos = otherNgos.except(`user:${claimerId}`); // skip the claimer; they get the full version below
    otherNgos.emit("listing:updated", publicVersion);

    // The donor and the NGO that claimed it get the full version.
    const privateRooms = [`user:${donorId}`];
    if (claimerId) privateRooms.push(`user:${claimerId}`);
    io.to(privateRooms).emit("listing:updated", plain);
}
