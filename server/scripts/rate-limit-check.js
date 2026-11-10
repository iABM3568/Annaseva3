// Sends 25 wrong-password logins in a row and prints the status codes.
// Usage: node scripts/rate-limit-check.js
// Expected: twenty 401s, then 429s. (The failed attempts used up the budget.)
// WARNING: this locks YOUR IP out of login for 15 minutes. In development, restart the server to reset it.
// NEVER run it against the live site.
const BASE = process.env.API_URL || "http://localhost:5000/api";

const codes = [];
let lastBody;
for (let attempt = 1; attempt <= 25; attempt++) {
    const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "nobody@example.com", password: "wrong-password" }),
    });
    codes.push(res.status);
    lastBody = await res.json();
}
console.log(codes.join(" "));
console.log("last response body:", lastBody);
