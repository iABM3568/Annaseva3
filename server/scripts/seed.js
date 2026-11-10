// Fills your DEV database with demo users and listings.
// Usage: node scripts/seed.js [count] [--force]
import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Listing from "../models/Listing.js";

const CENTER = { lat: 18.5204, lng: 73.8567 }; // example city centre (Pune). CHANGE THIS to your own city
const MAX_KM = 8; // spread listings inside a circle of about 8 km around the centre
const COUNT = Number(process.argv.find((a) => /^\d+$/.test(a))) || 15;
const FORCE = process.argv.includes("--force");
// For a PUBLIC (production) database, pass a strong password instead (Day 10): DEMO_PASSWORD="..." node scripts/seed.js 12 --force
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "Demo@12345";

const DEMO_USERS = [
    { name: "Demo Donor", email: "donor.demo@example.com", role: "donor", organization: "Spice Garden Restaurant" },
    { name: "Demo NGO", email: "ngo.demo@example.com", role: "ngo", organization: "Helping Hands Trust" },
];

const FOOD = [
    { title: "Vegetable biryani", foodType: "veg" },
    { title: "Dal and rice", foodType: "veg" },
    { title: "Chapati and sabzi", foodType: "veg" },
    { title: "Chicken curry and rice", foodType: "non-veg" },
    { title: "Sandwich platter", foodType: "veg" },
    { title: "Fresh fruit salad", foodType: "vegan" },
    { title: "Mixed buffet leftovers", foodType: "mixed" },
];

const pick = (array) => array[Math.floor(Math.random() * array.length)];

// Random GeoJSON point inside a CIRCLE of maxKm around a centre.
// Math.sqrt spreads the points evenly over the circle's area (without it they bunch up near the centre).
// 1 degree of latitude is about 111 km; a degree of longitude is shorter the further you are from the equator.
function randomPointNear(center, maxKm) {
    const distanceKm = maxKm * Math.sqrt(Math.random());
    const angle = Math.random() * 2 * Math.PI;
    const dLat = (distanceKm * Math.sin(angle)) / 111;
    const dLng = (distanceKm * Math.cos(angle)) / (111 * Math.cos((center.lat * Math.PI) / 180));
    return [center.lng + dLng, center.lat + dLat]; // [LONGITUDE, latitude]
}

await mongoose.connect(process.env.MONGO_URI);
const dbName = mongoose.connection.name;
console.log(`Connected to database: ${dbName}`);

// Safety net: refuse to touch a database that doesn't look like a dev one.
if (!dbName.endsWith("_dev") && !FORCE) {
    console.error("Refusing to seed a non-dev database. Re-run with --force if you really mean it.");
    process.exit(1);
}

// Find or create the demo users. User.create runs the password-hashing hook.
const users = {};
for (const u of DEMO_USERS) {
    users[u.role] = (await User.findOne({ email: u.email })) || (await User.create({ ...u, password: DEMO_PASSWORD }));
}

// Remove this demo donor's old listings so the script can be re-run safely.
await Listing.deleteMany({ donor: users.donor._id });

const now = Date.now();
const listings = Array.from({ length: COUNT }, () => ({
    ...pick(FOOD),
    description: "Freshly prepared today. Please bring your own containers.",
    quantity: 5 + Math.floor(Math.random() * 60),
    preparedAt: new Date(now - 30 * 60 * 1000), // made 30 minutes ago
    expiresAt: new Date(now + (1 + Math.random() * 5) * 3600 * 1000), // expires in 1 to 6 hours
    pickupAddress: "Demo address: replace with a real one",
    location: { type: "Point", coordinates: randomPointNear(CENTER, MAX_KM) },
    donor: users.donor._id,
}));

await Listing.insertMany(listings); // one batch insert is far faster than COUNT separate inserts
console.log(`Inserted ${COUNT} listings.`);
console.log(`Demo logins -> donor.demo@example.com / ngo.demo@example.com  (password: ${DEMO_PASSWORD})`);

await mongoose.disconnect();
