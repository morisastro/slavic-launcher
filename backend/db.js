import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const EMPTY_DB = {
  news: [],
  servers: [],
  cosmetics: [],
  userCosmetics: [],
  redeemCodes: [],
  users: [],
};

export let db = { ...EMPTY_DB };

export function initDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    console.log("[db] loaded from", DB_FILE);
  } else {
    db = { ...EMPTY_DB };
    saveDb();
    console.log("[db] fresh database created");
  }
}

export function saveDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}