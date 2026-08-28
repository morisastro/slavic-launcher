import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export let db = {
  news: [],
  servers: [],
  cosmetics: [],
  userCosmetics: [],
  redeemCodes: [],
  users: [],
};

export function initDb() {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    db = JSON.parse(raw);
    console.log("[db] loaded from", DB_FILE);
  } else {
    console.log("[db] fresh database");
  }
}

export function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}