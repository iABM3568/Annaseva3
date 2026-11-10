// Single source of truth for listing rules. The Mongoose model AND the Zod validator
// import these, so the two can never drift apart (e.g. adding "jain" in one place only).
export const FOOD_TYPES = ["veg", "non-veg", "vegan", "mixed"];
export const LISTING_STATUSES = ["available", "claimed", "completed", "cancelled"]; // "expired" is computed, never stored

export const TITLE_MIN = 3;
export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;
export const ADDRESS_MAX = 200;
export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 10000;

export const MAX_HOURS_AHEAD = 24; // food-safety rule: nothing is offered for more than a day
export const CLOCK_SKEW_MINUTES = 5; // tolerance for a donor's device clock being slightly ahead

export const NEARBY_LIMIT = 50; // max rows for the NGO search
export const LIST_LIMIT = 100; // max rows for "my listings" / "my claims"
