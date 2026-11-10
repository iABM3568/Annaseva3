// Run with: npm test
// Starts the real Express app on a random free port and sends it real HTTP requests.
// None of these requests touch the database, so no MongoDB is needed.
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import app from "../app.js"; // possible only because app.js does NOT call listen() (that lives in server.js)

describe("API (no database needed)", () => {
    let server;
    let base; // e.g. http://localhost:51234

    before(async () => {
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, resolve)); // port 0 = "pick any free port"
        base = `http://localhost:${server.address().port}`;
    });

    after(() => server.close()); // always shut the server down, or the test run never ends

    it('GET /api/health answers 200 with status "ok"', async () => {
        const res = await fetch(`${base}/api/health`);
        assert.equal(res.status, 200);
        assert.equal((await res.json()).status, "ok");
    });

    it("sends security headers (helmet)", async () => {
        const res = await fetch(`${base}/api/health`);
        assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    });

    it("answers an unknown route with a JSON 404", async () => {
        const res = await fetch(`${base}/api/nope`);
        assert.equal(res.status, 404);
        assert.match((await res.json()).message, /not found/i);
    });

    it("answers malformed JSON with 400, not 500", async () => {
        const res = await fetch(`${base}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{ this is not json",
        });
        assert.equal(res.status, 400);
    });

    it("rejects a protected route without a token (401)", async () => {
        const res = await fetch(`${base}/api/listings/mine`);
        assert.equal(res.status, 401);
    });

    it("rejects an oversized body (413)", async () => {
        const res = await fetch(`${base}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "a@b.co", password: "x".repeat(20000) }),
        });
        assert.equal(res.status, 413);
    });
});
