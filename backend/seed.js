// Seed the Slavic Launcher backend collections into PocketBase via the Admin API.
// Run AFTER PocketBase is serving and you've created a superuser (see setup.bat).
//
// Usage:
//   PB_ADMIN_EMAIL=you@example.com PB_ADMIN_PASSWORD=secret node seed.js
//   (or edit the defaults below)

const BASE = process.env.PB_URL || "http://127.0.0.1:8090";
const EMAIL = process.env.PB_ADMIN_EMAIL || "admin@slavic.local";
const PASS = process.env.PB_ADMIN_PASSWORD || "changeme123";

async function auth() {
  // PocketBase 0.23+ uses the _superusers collection for admin auth.
  const res = await fetch(`${BASE}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: EMAIL, password: PASS }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Admin auth failed (${res.status}): ${t}\nCreate the superuser first via setup.bat or 'pocketbase superuser upsert <email> <password>'.`);
  }
  const j = await res.json();
  return j.token;
}

async function listCollections(token) {
  const res = await fetch(`${BASE}/api/collections`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function upsertCollection(token, name, schema, options = {}) {
  const existing = await listCollections(token);
  const found = (existing.items || []).find((c) => c.name === name);
  const body = { name, schema, ...options };
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  let res;
  if (found) {
    res = await fetch(`${BASE}/api/collections/${found.id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  } else {
    res = await fetch(`${BASE}/api/collections`, { method: "POST", headers, body: JSON.stringify(body) });
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Failed to upsert collection ${name} (${res.status}): ${t}`);
  }
  console.log(`  ✓ collection: ${name}`);
  return res.json();
}

const T = (type, opts = {}) => ({ type, options: opts });

async function main() {
  console.log(`Authenticating to ${BASE} as ${EMAIL}…`);
  const token = await auth();

  console.log("Creating collections…");
  await upsertCollection(token, "users", [
    { name: "username", ...T("text"), required: true, options: { max: 40 } },
    { name: "uuid", ...T("text"), required: true, options: { max: 64 } },
    { name: "discord_id", ...T("text"), options: { max: 32 } },
    { name: "avatar_url", ...T("text"), options: { max: 500 } },
  ]);

  await upsertCollection(token, "cosmetics", [
    { name: "name", ...T("text"), required: true, options: { max: 60 } },
    { name: "description", ...T("text"), options: { max: 500 } },
    { name: "type", ...T("text"), required: true, options: { max: 20 } },
    { name: "rarity", ...T("text"), options: { max: 20 } },
    { name: "image", ...T("file"), options: { maxSelect: 1, mimeTypes: ["image/png", "image/jpeg"] } },
    { name: "model_url", ...T("text"), options: { max: 500 } },
  ]);

  await upsertCollection(token, "user_cosmetics", [
    { name: "user", ...T("text"), required: true, options: { max: 64 } },
    { name: "cosmetic", ...T("relation"), required: true, options: { collection: "cosmetics", maxSelect: 1 } },
    { name: "equipped", ...T("bool") },
  ]);

  await upsertCollection(token, "redeem_codes", [
    { name: "code", ...T("text"), required: true, options: { max: 40 } },
    { name: "reward", ...T("text"), options: { max: 60 } },
    { name: "used", ...T("bool") },
    { name: "used_by", ...T("text"), options: { max: 64 } },
  ]);

  await upsertCollection(token, "news", [
    { name: "title", ...T("text"), required: true, options: { max: 120 } },
    { name: "body", ...T("text"), required: true },
    { name: "image", ...T("file"), options: { maxSelect: 1, mimeTypes: ["image/png", "image/jpeg"] } },
    { name: "date", ...T("date") },
  ]);

  await upsertCollection(token, "servers", [
    { name: "name", ...T("text"), required: true, options: { max: 60 } },
    { name: "ip", ...T("text"), required: true, options: { max: 120 } },
    { name: "description", ...T("text"), options: { max: 500 } },
    { name: "online", ...T("bool") },
    { name: "players", ...T("number") },
    { name: "maxPlayers", ...T("number") },
    { name: "icon", ...T("file"), options: { maxSelect: 1, mimeTypes: ["image/png", "image/jpeg"] } },
  ]);

  // make collection APIs public-readable (no auth) so the launcher can fetch them
  for (const name of ["news", "servers", "cosmetics", "redeem_codes"]) {
    const list = await listCollections(token);
    const c = list.items.find((x) => x.name === name);
    if (c) {
      await fetch(`${BASE}/api/collections/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ listRule: "", viewRule: "" }),
      });
      console.log(`  ✓ public read: ${name}`);
    }
  }

  console.log("\nDone. Backend ready at " + BASE);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
