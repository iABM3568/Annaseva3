import { z } from "zod";
import {
    FOOD_TYPES,
    TITLE_MIN,
    TITLE_MAX,
    DESCRIPTION_MAX,
    ADDRESS_MAX,
    QUANTITY_MIN,
    QUANTITY_MAX,
    MAX_HOURS_AHEAD,
    CLOCK_SKEW_MINUTES,
} from "../constants/listing.js";

// z.coerce.number() converts "12" (text from the URL or a form) into the number 12.
// TRAP: it also turns an EMPTY string "" into 0, and z.coerce.date() turns null into
// 1 January 1970. So a blank form field would quietly pass validation and a listing
// could be saved at latitude 0, longitude 0 (the ocean off Africa).
// This helper turns blank values into "missing" FIRST, so Zod rejects them properly.
const blankIsMissing = (value) => (value === "" || value === null ? undefined : value);

export const createListingSchema = z
    .object({
        title: z.string({ error: "Title is required" }).trim().min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters`).max(TITLE_MAX),
        description: z.string().trim().max(DESCRIPTION_MAX).optional(),
        foodType: z.enum(FOOD_TYPES),
        quantity: z.coerce.number().int().min(QUANTITY_MIN).max(QUANTITY_MAX),
        preparedAt: z.preprocess(blankIsMissing, z.coerce.date()),
        expiresAt: z.preprocess(blankIsMissing, z.coerce.date()),
        pickupAddress: z.string().trim().min(5, "Please give a fuller address").max(ADDRESS_MAX),
        // The API accepts friendly lat/lng. The SERVER builds the GeoJSON in the right order.
        latitude: z.preprocess(blankIsMissing, z.coerce.number().min(-90).max(90)),
        longitude: z.preprocess(blankIsMissing, z.coerce.number().min(-180).max(180)),
    })
    // All time checks use the SERVER clock (Date.now()), never a time sent by the client.
    .refine((d) => d.preparedAt.getTime() <= Date.now() + CLOCK_SKEW_MINUTES * 60 * 1000, {
        message: "Preparation time cannot be in the future",
        path: ["preparedAt"],
    })
    .refine((d) => d.expiresAt > new Date(), {
        message: "Expiry time must be in the future",
        path: ["expiresAt"],
    })
    .refine((d) => d.expiresAt > d.preparedAt, {
        message: "Expiry must be after the preparation time",
        path: ["expiresAt"],
    })
    .refine((d) => d.expiresAt.getTime() - Date.now() <= MAX_HOURS_AHEAD * 3600 * 1000, {
        message: `Food can be listed for at most ${MAX_HOURS_AHEAD} hours`,
        path: ["expiresAt"],
    });

// For GET /api/listings/nearby?lat=18.52&lng=73.85&radiusKm=5
export const nearbySchema = z.object({
    lat: z.preprocess(blankIsMissing, z.coerce.number().min(-90).max(90)),
    lng: z.preprocess(blankIsMissing, z.coerce.number().min(-180).max(180)),
    radiusKm: z.preprocess(blankIsMissing, z.coerce.number().min(0.5).max(50).default(10)),
});
