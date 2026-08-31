import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { db, initDb, saveDb } from "./db.js";
import { seedDb } from "./seed.js";

const app = express();
const PORT = process.env.PORT || 8090;
const ADMIN_KEY = process.env.ADMIN_KEY || "slavic-admin-secret";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Redirect /download to the latest portable .exe on GitHub Releases
const DOWNLOAD_URL = process.env.DOWNLOAD_URL || "https://github.com/morisastro/slavic-launcher/releases/latest";
app.get("/download", (req, res) => res.redirect(DOWNLOAD_URL));
app.get("/api/download", (req, res) => res.redirect(DOWNLOAD_URL));

initDb();
seedDb();
app.listen(PORT, () => {
  console.log(`Slavic Launcher backend running on port ${PORT}`);
});

// ---- public routes ----

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", code: 200, message: "API is healthy." });
});

app.get("/api/news", (req, res) => {
  res.json({ items: db.news });
});

app.get("/api/servers", (req, res) => {
  res.json({ items: db.servers });
});

app.get("/api/cosmetics", (req, res) => {
  res.json({ items: db.cosmetics });
});

// POST /api/redeem — body: { code, user }
app.post("/api/redeem", (req, res) => {
  const { code, user } = req.body;
  if (!code || !user) {
    return res.status(400).json({ ok: false, message: "code and user are required" });
  }

  const record = db.redeemCodes.find((c) => c.code === code);
  if (!record) {
    return res.status(404).json({ ok: false, message: "Invalid code" });
  }

  // Check usage limits: infinite (maxUses <= 0) or count < maxUses
  const usedCount = db.userCosmetics.filter((uc) => uc.code === code).length;
  if (record.maxUses > 0 && usedCount >= record.maxUses) {
    return res.status(409).json({ ok: false, message: "Code has reached its usage limit" });
  }

  // Check if this specific user already used this code
  if (db.userCosmetics.some((uc) => uc.code === code && uc.user === user)) {
    return res.status(409).json({ ok: false, message: "You already redeemed this code" });
  }

  const reward = record.reward || "Mystery Cosmetic";

  let cosmeticAssigned = false;
  const cosmetic = db.cosmetics.find((c) => c.name === reward);
  if (cosmetic) {
    db.userCosmetics.push({ id: Date.now(), user, cosmeticId: cosmetic.id, equipped: false, code });
    cosmeticAssigned = true;
  }

  saveDb();
  const remaining = record.maxUses > 0 ? record.maxUses - usedCount - 1 : -1;
  res.json({
    ok: true,
    message: `Unlocked: ${reward}`,
    reward,
    cosmeticAssigned,
    remaining: remaining === -1 ? "∞" : remaining,
  });
});

// GET /api/user-cosmetics/:uuid
app.get("/api/user-cosmetics/:uuid", (req, res) => {
  const { uuid } = req.params;
  const items = db.userCosmetics
    .filter((uc) => uc.user === uuid)
    .map((uc) => {
      const cosmetic = db.cosmetics.find((c) => c.id === uc.cosmeticId);
      return {
        id: uc.id,
        cosmetic: cosmetic?.name || "",
        type: cosmetic?.type || "",
        rarity: cosmetic?.rarity || "",
        equipped: uc.equipped,
      };
    });
  res.json({ items });
});

// ---- admin routes ----
app.use("/api/admin", (req, res, next) => {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ ok: false, message: "Unauthorized" });
  }
  next();
});

// News
app.post("/api/admin/news", (req, res) => {
  const { title, body, date } = req.body;
  if (!title || !body) return res.status(400).json({ ok: false, message: "title and body required" });
  const item = { id: Date.now(), title, body, date: date || new Date().toISOString().slice(0, 10) };
  db.news.push(item);
  saveDb();
  res.json({ ok: true, id: item.id });
});

app.delete("/api/admin/news/:id", (req, res) => {
  db.news = db.news.filter((n) => String(n.id) !== req.params.id);
  saveDb();
  res.json({ ok: true });
});

// Servers
app.post("/api/admin/servers", (req, res) => {
  const { name, ip, description, online, players, maxPlayers } = req.body;
  if (!name || !ip) return res.status(400).json({ ok: false, message: "name and ip required" });
  const item = { id: Date.now(), name, ip, description: description || "", online: !!online, players: players || 0, maxPlayers: maxPlayers || 0 };
  db.servers.push(item);
  saveDb();
  res.json({ ok: true, id: item.id });
});

app.delete("/api/admin/servers/:id", (req, res) => {
  db.servers = db.servers.filter((s) => String(s.id) !== req.params.id);
  saveDb();
  res.json({ ok: true });
});

// Cosmetics
app.post("/api/admin/cosmetics", (req, res) => {
  const { name, description, type, rarity } = req.body;
  if (!name || !type) return res.status(400).json({ ok: false, message: "name and type required" });
  const item = { id: Date.now(), name, description: description || "", type, rarity: rarity || "common" };
  db.cosmetics.push(item);
  saveDb();
  res.json({ ok: true, id: item.id });
});

// Redeem codes
app.post("/api/admin/codes", (req, res) => {
  const { code, reward, maxUses } = req.body;
  if (!code) return res.status(400).json({ ok: false, message: "code required" });
  if (db.redeemCodes.find((c) => c.code === code)) return res.status(409).json({ ok: false, message: "code already exists" });
  const item = {
    id: Date.now(),
    code,
    reward: reward || "Mystery Cosmetic",
    maxUses: maxUses === undefined ? 1 : parseInt(maxUses) || 0, // 0 = infinite
  };
  db.redeemCodes.push(item);
  saveDb();
  res.json({ ok: true, id: item.id });
});

app.get("/api/admin/codes", (req, res) => {
  res.json({ items: db.redeemCodes });
});

// Users
app.get("/api/admin/users", (req, res) => {
  res.json({ items: db.users });
});