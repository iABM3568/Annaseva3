// Shows how an index changes the way MongoDB answers a query.
// Run `node scripts/seed.js 15` first. Usage: node scripts/explain-lab.js
import "dotenv/config";
import mongoose from "mongoose";
import Listing from "../models/Listing.js";
import User from "../models/User.js";

await mongoose.connect(process.env.MONGO_URI);
if (!mongoose.connection.name.endsWith("_dev")) {
    console.error("This lab only runs on a *_dev database.");
    process.exit(1);
}

const donor = await User.findOne({ email: "donor.demo@example.com" });
if (!donor) {
    console.error("Demo donor not found. Run `node scripts/seed.js 15` first.");
    process.exit(1);
}

// 1) Add 20,000 "noise" listings from random other donors, so the index has something to skip.
const NOISE = 20000;
const template = {
    title: "__noise__",
    foodType: "veg",
    quantity: 1,
    pickupAddress: "noise address",
    preparedAt: new Date(),
    expiresAt: new Date(Date.now() + 3600 * 1000),
    location: { type: "Point", coordinates: [73.85, 18.52] },
};
await Listing.insertMany(Array.from({ length: NOISE }, () => ({ ...template, donor: new mongoose.Types.ObjectId() })));
console.log(`Inserted ${NOISE} noise listings.`);

// 2) Ask MongoDB to EXPLAIN how it answers "all listings of this donor".
async function report(label) {
    const raw = await Listing.find({ donor: donor._id }).explain("executionStats");
    const result = Array.isArray(raw) ? raw[0] : raw; // some versions wrap it in an array
    const stats = result.executionStats;
    const usedIndex = JSON.stringify(result.queryPlanner.winningPlan).includes("IXSCAN");

    console.log(`\n${label}`);
    console.log(`  plan:               ${usedIndex ? "IXSCAN (used the index)" : "COLLSCAN (read everything)"}`);
    console.log(`  documents examined: ${stats.totalDocsExamined}`);
    console.log(`  documents returned: ${stats.nReturned}`);
    console.log(`  time (ms):          ${stats.executionTimeMillis}`);
}

// try/finally: even if something fails midway, the index is restored and the noise removed.
try {
    await report("WITH the donor index");

    await Listing.collection.dropIndex("donor_1_createdAt_-1"); // remove the index temporarily
    await report("WITHOUT the donor index");
} finally {
    await Listing.syncIndexes(); // put the index back
    await Listing.deleteMany({ title: "__noise__" }); // clean up the noise
    console.log("\nCleaned up and restored the index.");
    await mongoose.disconnect();
}
