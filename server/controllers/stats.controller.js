import Listing from "../models/Listing.js";

// Public "impact" numbers for the landing page. No personal data: only totals.
export async function getStats(req, res) {
    // AGGREGATION PIPELINE: a list of stages; each stage passes its result to the next.
    // Think of a spreadsheet pivot table.
    const [row] = await Listing.aggregate([
        { $match: { status: "completed" } }, // stage 1: keep only listings that were picked up
        {
            $group: {
                // stage 2: squash all those rows into ONE row
                _id: null, //   (null = "one single group")
                mealsRescued: { $sum: "$quantity" }, //   add up the quantity field of every row
                pickups: { $sum: 1 }, //   add 1 per row = count the rows
            },
        },
    ]);

    // If nothing matched, the pipeline returns an EMPTY array, so `row` is undefined.
    // "?." and "??" turn that into zeros instead of crashing.
    res.json({ mealsRescued: row?.mealsRescued ?? 0, pickups: row?.pickups ?? 0 });
}
