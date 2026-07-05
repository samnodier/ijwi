/**
 * End-to-end backend smoke test.
 *
 * Exercises every endpoint (auth, reports CRUD, media upload, ownership rules,
 * validation, emergency numbers, dashboard) against a running server, then
 * cleans up any rows it created in the database.
 *
 * Usage: start the API (npm run dev), then: node scripts/smoke-test.mjs
 * Optional env: API_URL (default http://localhost:3000)
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const BASE = process.env.API_URL ?? "http://localhost:3000";
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1x1 PNG for media-upload tests.
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

let pass = 0;
let fail = 0;
const failures = [];

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  \u2713 ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  \u2717 ${name}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}

async function req(method, path, opts = {}) {
  const { token, json, form } = opts;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }

  let res;
  let lastErr;
  for (let i = 0; i < 5; i++) {
    try {
      res = await fetch(`${BASE}${path}`, { method, headers, body });
      break;
    } catch (e) {
      lastErr = e;
      await sleep(500 * (i + 1));
    }
  }
  if (!res) throw lastErr;

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

const created = { userIds: new Set(), postIds: new Set() };

async function main() {
  console.log(`\nRunning backend smoke test against ${BASE}\n`);

  // ---- System ----
  console.log("System");
  {
    const r = await req("GET", "/health");
    check("GET /health -> 200", r.status === 200 && r.data?.status === "ok");
  }
  {
    const r = await req("GET", "/nope");
    check("unknown route -> 404", r.status === 404);
  }

  // ---- Auth: validation ----
  console.log("\nAuth validation");
  {
    const r = await req("POST", "/auth/register", { json: { email: "a@b.com" } });
    check("register missing fields -> 400", r.status === 400);
  }
  {
    const r = await req("POST", "/auth/register", {
      json: { name: "X", email: "bad-email", password: "password123" },
    });
    check("register invalid email -> 400", r.status === 400);
  }
  {
    const r = await req("POST", "/auth/register", {
      json: { name: "X", email: `x_${Date.now()}@ex.com`, password: "short" },
    });
    check("register short password -> 400", r.status === 400);
  }

  // ---- Auth: happy path ----
  console.log("\nAuth");
  const email1 = `u1_${Date.now()}@ex.com`;
  const email2 = `u2_${Date.now()}@ex.com`;
  const pw = "password123";
  let token1;
  let token2;
  let userId1;
  {
    const r = await req("POST", "/auth/register", {
      json: { name: "User One", email: email1, password: pw },
    });
    token1 = r.data?.token;
    userId1 = r.data?.user?.id;
    if (userId1) created.userIds.add(userId1);
    check(
      "register -> 201 + token + user",
      r.status === 201 && !!token1 && r.data?.user?.email === email1,
    );
  }
  {
    const r = await req("POST", "/auth/register", {
      json: { name: "User One", email: email1, password: pw },
    });
    check("duplicate register -> 409", r.status === 409);
  }
  {
    const r = await req("POST", "/auth/register", {
      json: { name: "User Two", email: email2, password: pw },
    });
    token2 = r.data?.token;
    if (r.data?.user?.id) created.userIds.add(r.data.user.id);
    check("register 2nd user -> 201", r.status === 201 && !!token2);
  }
  {
    const r = await req("POST", "/auth/login", {
      json: { email: email1, password: pw },
    });
    check("login correct -> 200 + token", r.status === 200 && !!r.data?.token);
  }
  {
    const r = await req("POST", "/auth/login", {
      json: { email: email1, password: "wrongpass" },
    });
    check("login wrong password -> 401", r.status === 401);
  }
  {
    const r = await req("GET", "/auth/me", { token: token1 });
    check("me with token -> 200", r.status === 200 && r.data?.id === userId1);
  }
  {
    const r = await req("GET", "/auth/me");
    check("me without token -> 401", r.status === 401);
  }
  {
    const r = await req("GET", "/auth/me", { token: "garbage.token.here" });
    check("me with bad token -> 401", r.status === 401);
  }
  {
    const r = await req("POST", "/auth/google", { json: { idToken: "x" } });
    check(
      "google without config -> 503 (or 401 if configured)",
      r.status === 503 || r.status === 401,
    );
  }

  // ---- Reports: validation & create ----
  console.log("\nReports create + validation");
  {
    const r = await req("POST", "/reports", { form: makeForm({}) });
    check("create missing fields -> 400", r.status === 400);
  }
  let anonId;
  {
    const r = await req("POST", "/reports", {
      form: makeForm({ description: "Anon report", category: "water" }),
    });
    anonId = r.data?.id;
    if (anonId) created.postIds.add(anonId);
    check(
      "create anonymous -> 201, author null",
      r.status === 201 && r.data?.author === null,
    );
  }
  let postId;
  {
    const form = makeForm({ description: "User report", category: "roads" });
    form.append("media", pngBlob(), "pixel.png");
    const r = await req("POST", "/reports", { token: token1, form });
    postId = r.data?.id;
    if (postId) created.postIds.add(postId);
    const media = r.data?.media ?? [];
    check("create as user -> 201", r.status === 201);
    check(
      "created report linked to author",
      r.data?.author?.id === userId1,
      JSON.stringify(r.data?.author),
    );
    check(
      "media uploaded to Cloudinary",
      media.length === 1 && /res\.cloudinary\.com/.test(media[0]?.url ?? ""),
      JSON.stringify(media),
    );
  }

  // ---- Reports: read ----
  console.log("\nReports read");
  {
    const r = await req("GET", "/reports");
    check("list -> 200 array", r.status === 200 && Array.isArray(r.data));
  }
  {
    const r = await req("GET", `/reports/${postId}`);
    check("get by id -> 200", r.status === 200 && r.data?.id === postId);
  }
  {
    const r = await req("GET", "/reports/00000000-0000-0000-0000-000000000000");
    check("get non-existent -> 404", r.status === 404);
  }
  {
    const r = await req("GET", "/reports/mine", { token: token1 });
    check(
      "mine -> 200, only my reports",
      r.status === 200 &&
        Array.isArray(r.data) &&
        r.data.every((p) => p.author?.id === userId1),
    );
  }
  {
    const r = await req("GET", "/reports/mine");
    check("mine without token -> 401", r.status === 401);
  }

  // ---- Reports: update / status / ownership ----
  console.log("\nReports update + ownership");
  {
    const r = await req("PATCH", `/reports/${postId}`, {
      token: token1,
      json: { title: "Edited", description: "Updated desc" },
    });
    check(
      "owner edit -> 200",
      r.status === 200 &&
        r.data?.title === "Edited" &&
        r.data?.description === "Updated desc",
    );
  }
  {
    const r = await req("PATCH", `/reports/${postId}`, {
      token: token2,
      json: { description: "hax" },
    });
    check("non-owner edit -> 403", r.status === 403);
  }
  {
    const r = await req("PATCH", `/reports/${postId}`, {
      json: { description: "hax" },
    });
    check("edit without token -> 401", r.status === 401);
  }
  {
    const r = await req("PATCH", "/reports/00000000-0000-0000-0000-000000000000", {
      token: token1,
      json: { description: "x" },
    });
    check("edit non-existent -> 404", r.status === 404);
  }
  {
    const r = await req("PATCH", `/reports/${postId}/status`, {
      json: { status: "in_progress" },
    });
    check("status update valid -> 200", r.status === 200 && r.data?.status === "in_progress");
  }
  {
    const r = await req("PATCH", `/reports/${postId}/status`, {
      json: { status: "banana" },
    });
    check("status update invalid -> 400", r.status === 400);
  }

  // ---- Reports: delete / ownership ----
  console.log("\nReports delete + ownership");
  {
    const r = await req("DELETE", `/reports/${postId}`, { token: token2 });
    check("non-owner delete -> 403", r.status === 403);
  }
  {
    const r = await req("DELETE", `/reports/${postId}`);
    check("delete without token -> 401", r.status === 401);
  }
  {
    const r = await req("DELETE", `/reports/${postId}`, { token: token1 });
    check("owner delete -> 204", r.status === 204);
    if (r.status === 204) created.postIds.delete(postId);
  }
  {
    const r = await req("GET", `/reports/${postId}`);
    check("get deleted -> 404", r.status === 404);
  }

  // ---- Emergency numbers ----
  console.log("\nEmergency numbers");
  {
    const r = await req("GET", "/emergency-numbers");
    check(
      "list -> 200 non-empty array",
      r.status === 200 && Array.isArray(r.data) && r.data.length > 0,
    );
  }

  // ---- Dashboard ----
  console.log("\nDashboard");
  {
    const r = await req("GET", "/dashboard/summary");
    check(
      "summary -> 200 with shape",
      r.status === 200 &&
        typeof r.data?.total === "number" &&
        typeof r.data?.byStatus === "object" &&
        Array.isArray(r.data?.recent),
    );
  }

  // ---- Docs ----
  console.log("\nDocs");
  {
    const r = await req("GET", "/docs.json");
    check("docs.json -> 200 openapi", r.status === 200 && !!r.data?.openapi);
  }
}

function makeForm(fields) {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return form;
}
function pngBlob() {
  return new Blob([Buffer.from(PNG_B64, "base64")], { type: "image/png" });
}

async function cleanup() {
  if (!sql) return;
  console.log("\nCleaning up test data...");
  async function run(fn, tries = 12) {
    let e;
    for (let i = 0; i < tries; i++) {
      try {
        return await fn();
      } catch (err) {
        e = err;
        await sleep(700 * (i + 1));
      }
    }
    throw e;
  }
  for (const id of created.postIds) {
    await run(() => sql`DELETE FROM posts WHERE id = ${id}`);
  }
  for (const id of created.userIds) {
    await run(() => sql`DELETE FROM users WHERE id = ${id}`);
  }
  console.log(
    `  removed ${created.postIds.size} posts, ${created.userIds.size} users`,
  );
}

main()
  .catch((err) => {
    console.error("\nTest run crashed:", err);
    fail++;
  })
  .finally(async () => {
    try {
      await cleanup();
    } catch (e) {
      console.error("  cleanup failed:", e?.message ?? e);
    }
    console.log(`\n================ RESULT ================`);
    console.log(`  PASS: ${pass}   FAIL: ${fail}`);
    if (failures.length) console.log(`  Failed: ${failures.join(", ")}`);
    console.log(`========================================\n`);
    process.exit(fail === 0 ? 0 : 1);
  });
