// Fires 20 claim requests at the SAME moment and prints how many won.
// Usage: node scripts/race-test.js <listingId> <ngoToken>
const [listingId, token] = process.argv.slice(2);
const BASE = process.env.API_URL || "http://localhost:5000/api";

if (!listingId || !token) {
    console.error("Usage: node scripts/race-test.js <listingId> <ngoToken>");
    process.exit(1);
}

// Build 20 requests WITHOUT waiting for each: they all start together.
// (A for-loop with `await` inside would send them one after another and hide the bug.)
const requests = Array.from({ length: 20 }, () =>
    fetch(`${BASE}/listings/${listingId}/claim`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
    })
);

// Promise.all waits until all 20 have finished.
const responses = await Promise.all(requests);
const statuses = responses.map((r) => r.status);

// Count how many of each status code appeared, e.g. { '200': 1, '409': 19 }
const summary = statuses.reduce((counts, s) => ({ ...counts, [s]: (counts[s] || 0) + 1 }), {});

console.log("Statuses:", statuses.join(" "));
console.log("Summary: ", summary);
console.log(summary[200] === 1 ? "PASS: exactly one winner" : "FAIL: expected exactly one 200");
