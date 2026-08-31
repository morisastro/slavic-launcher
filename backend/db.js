import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Gist-based persistent storage (survives Render redeploys)
const GIST_ID = process.env.GIST_ID || "82a0c6bac90f35b40a4d7da01055a363";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const GIST_FILENAME = "db.json";

// Fallback: local file (used in dev when no token)
const LOCAL_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const LOCAL_FILE = path.join(LOCAL_DIR, "db.json");

export let db = {
  news: [],
  servers: [],
  cosmetics: [],
  userCosmetics: [],
  redeemCodes: [],
  users: [],
};

const EMPTY_DB = {
  news: [],
  servers: [],
  cosmetics: [],
  userCosmetics: [],
  redeemCodes: [],
  users: [],
};

let useGist = !!GITHUB_TOKEN;

export async function initDb() {
  if (useGist) {
    try {
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      });
      if (!res.ok) {
        console.log(`[db] gist fetch failed (${res.status}), falling back to local`);
        useGist = false;
        return initLocal();
      }
      const json = await res.json();
      const content = json.files?.[GIST_FILENAME]?.content;
      if (content) {
        db = JSON.parse(content);
        console.log("[db] loaded from gist:", GIST_ID);
      } else {
        db = { ...EMPTY_DB };
        console.log("[db] gist empty, initialized fresh");
        await saveDb();
      }
    } catch (err) {
      console.log("[db] gist error, falling back to local:", err.message);
      useGist = false;
      initLocal();
    }
  } else {
    initLocal();
  }
}

function initLocal() {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
  if (fs.existsSync(LOCAL_FILE)) {
    db = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8"));
    console.log("[db] loaded from local file");
  } else {
    db = { ...EMPTY_DB };
    saveLocal();
    console.log("[db] fresh local database");
  }
}

function saveLocal() {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(db, null, 2), "utf8");
}

let saveTimer = null;
export function saveDb() {
  if (useGist) {
    // Debounce: batch rapid saves into one API call
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveToGist().catch(console.error), 500);
    // also save locally as backup
    try { saveLocal(); } catch {}
  } else {
    saveLocal();
  }
}

async function saveToGist() {
  const content = JSON.stringify(db, null, 2);
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content } },
    }),
  });
  if (res.ok) {
    console.log("[db] saved to gist");
  } else {
    console.error("[db] gist save failed:", res.status);
  }
}