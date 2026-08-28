import { db, saveDb } from "./db.js";

export function seedDb() {
  let changed = false;

  if (db.news.length === 0) {
    db.news.push({
      id: 1,
      title: "Welcome to Slavic Launcher!",
      body: "Join our Discord for giveaways and redeem codes. Fabric + mods supported.",
      date: "2026-08-28",
    });
    changed = true;
    console.log("[seed] news added");
  }

  if (db.servers.length === 0) {
    db.servers.push({
      id: 1,
      name: "Slavic Network",
      ip: "play.slavic.gg",
      description: "Survival + SkyBlock. Use Slavic Launcher for cosmetics.",
      online: true,
      players: 0,
      maxPlayers: 500,
    });
    changed = true;
    console.log("[seed] server added");
  }

  if (db.redeemCodes.length === 0) {
    db.redeemCodes.push({ id: 1, code: "WELCOME10", reward: "Starter Cape", used: false, usedBy: "" });
    changed = true;
    console.log("[seed] redeem code added");
  }

  if (db.cosmetics.length === 0) {
    db.cosmetics.push({
      id: 1,
      name: "Starter Cape",
      description: "A free cape for new players.",
      type: "cape",
      rarity: "common",
    });
    changed = true;
    console.log("[seed] cosmetic added");
  }

  if (changed) saveDb();
}