const BACKEND = process.env.BACKEND_URL || "http://127.0.0.1:8090";
const ADMIN_KEY = process.env.ADMIN_KEY || "slavic-admin-secret";

async function saveCode(code, reward) {
  const res = await fetch(`${BACKEND}/api/admin/codes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
    body: JSON.stringify({ code, reward: reward || "Mystery Cosmetic" }),
  });
  if (!res.ok) throw new Error(`Failed to save code: ${res.status}`);
  return res.json();
}