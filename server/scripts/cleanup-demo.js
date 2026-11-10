// Removes the demo accounts and everything they own or claimed.
// Usage: node scripts/cleanup-demo.js [--force]
// Run it after a demo on any database other than your *_dev one (--force is required there).
// Production: node --env-file=.env.production scripts/cleanup-demo.js --force
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Listing from "../models/Listing.js";

const DEMO_EMAILS = ["donor.demo@example.com", "ngo.demo@example.com"];
const FORCE = process.argv.includes("--force");

await mongoose.connect(process.env.MONGO_URI);
const dbName = mongoose.connection.name;
console.log(`Connected to database: ${dbName}`);

// Same safety net as seed.js: make the person confirm they mean a non-dev database.
if (!dbName.endsWith("_dev") && !FORCE) {
    console.error("This is not a *_dev database. Re-run with --force if you really mean it.");
    process.exit(1);
}

// Find the demo users first, so we know which listings belong to them.
const demoUsers = await User.find({ email: { $in: DEMO_EMAILS } }).select("_id");
const demoIds = demoUsers.map((user) => user._id);

// Delete listings they posted OR claimed, then the users themselves.
const listings = await Listing.deleteMany({ $or: [{ donor: { $in: demoIds } }, { claimedBy: { $in: demoIds } }] });
const users = await User.deleteMany({ _id: { $in: demoIds } });

console.log(`Deleted ${listings.deletedCount} listings and ${users.deletedCount} demo users.`);
await mongoose.disconnect();
