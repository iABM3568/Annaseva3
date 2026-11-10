import mongoose from "mongoose";
import {
    FOOD_TYPES,
    LISTING_STATUSES,
    TITLE_MIN,
    TITLE_MAX,
    DESCRIPTION_MAX,
    ADDRESS_MAX,
    QUANTITY_MIN,
    QUANTITY_MAX,
} from "../constants/listing.js";

const listingSchema = new mongoose.Schema(
    {
        title: { type: String, required: [true, "Title is required"], trim: true, minlength: TITLE_MIN, maxlength: TITLE_MAX },
        description: { type: String, trim: true, maxlength: DESCRIPTION_MAX },
        foodType: { type: String, enum: FOOD_TYPES, required: true },
        quantity: { type: Number, required: true, min: QUANTITY_MIN, max: QUANTITY_MAX }, // number of meals / portions

        preparedAt: { type: Date, required: true }, // food-safety context: when was it made?
        expiresAt: { type: Date, required: true }, // after this time the listing is not offered
        pickupAddress: { type: String, required: true, trim: true, maxlength: ADDRESS_MAX },

        // GeoJSON Point: [LONGITUDE, latitude]  <-- longitude FIRST
        location: {
            type: { type: String, enum: ["Point"], default: "Point" },
            coordinates: {
                type: [Number],
                required: true,
                validate: {
                    validator: (c) =>
                        Array.isArray(c) &&
                        c.length === 2 &&
                        c[0] >= -180 &&
                        c[0] <= 180 && // longitude range
                        c[1] >= -90 &&
                        c[1] <= 90, // latitude range
                    message: "coordinates must be [longitude, latitude] within valid ranges",
                },
            },
        },

        // A reference to a document in the users collection. populate() can swap it for the real user.
        donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

        status: {
            type: String,
            enum: LISTING_STATUSES, // "expired" is computed, not stored
            default: "available",
        },
        claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        claimedAt: Date,
        completedAt: Date,
    },
    {
        timestamps: true,
        // Include virtuals (like isExpired below) when a document is sent as JSON.
        toJSON: { virtuals: true },
    }
);

// A VIRTUAL is a computed field: not stored in MongoDB, calculated each time it's read.
// "Expired" is derived from expiresAt + the server clock, so it can never go stale.
// Note: .lean() results skip virtuals, so controllers using lean() compute it themselves.
listingSchema.virtual("isExpired").get(function () {
    return this.expiresAt <= new Date();
});

// INDEXES: shortcuts the database keeps up to date. Each speeds up reads and slightly slows writes.
listingSchema.index({ location: "2dsphere" }); // required for $near ("find nearby")
listingSchema.index({ donor: 1, createdAt: -1 }); // "my listings, newest first"
listingSchema.index({ claimedBy: 1, claimedAt: -1 }); // "my claims, newest first"

export default mongoose.model("Listing", listingSchema);
