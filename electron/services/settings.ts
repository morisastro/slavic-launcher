import * as fs from "fs";
import * as path from "path";
import { MINECRAFT_DIR, readJson, writeJson, DATA_DIR } from "./storage";

export interface LauncherSettings {
  minRam: number;
  maxRam: number;
  javaPath: string;
  backendUrl: string;
  discordRpc: boolean;
  keepLauncherOpen: boolean;
  windowWidth: number;
  windowHeight: number;
  fullscreen: boolean;
}

const FILE = path.join(DATA_DIR, "settings.json");
const DEFAULTS: LauncherSettings = {
  minRam: 1024,
  maxRam: 4096,
  javaPath: "",
  backendUrl: "https://slavic-launcher-backend.onrender.com",
  discordRpc: true,
  keepLauncherOpen: false,
  windowWidth: 854,
  windowHeight: 480,
  fullscreen: false,
};

class SettingsService {
  get(): LauncherSettings {
    return { ...DEFAULTS, ...readJson<Partial<LauncherSettings>>(FILE, {}) };
  }
  set(patch: Partial<LauncherSettings>) {
    const next = { ...this.get(), ...patch };
    writeJson(FILE, next);
    return next;
  }

  // ---- backend (PocketBase) ----
  async fetchNews(): Promise<{ id: string; title: string; body: string; image?: string; date: string }[]> {
    const base = this.get().backendUrl;
    try {
      const res = await fetch(`${base}/api/collections/news/records?sort=-date`);
      if (!res.ok) return [];
      const json: any = await res.json();
      return (json.items ?? []).map((i: any) => ({ id: i.id, title: i.title, body: i.body, image: i.image ? `${base}/api/files/news/${i.id}/${i.image}` : undefined, date: i.date }));
    } catch {
      return [];
    }
  }

  async fetchServers(): Promise<{ id: string; name: string; ip: string; description: string; online: boolean; players?: number; maxPlayers?: number; icon?: string }[]> {
    const base = this.get().backendUrl;
    try {
      const res = await fetch(`${base}/api/collections/servers/records`);
      if (!res.ok) return [];
      const json: any = await res.json();
      return (json.items ?? []).map((i: any) => ({ id: i.id, name: i.name, ip: i.ip, description: i.description, online: i.online ?? false, players: i.players, maxPlayers: i.maxPlayers, icon: i.icon ? `${base}/api/files/servers/${i.id}/${i.icon}` : undefined }));
    } catch {
      return [];
    }
  }

  async redeemCode(code: string, userUuid: string): Promise<{ ok: boolean; message: string }> {
    const base = this.get().backendUrl;
    try {
      const res = await fetch(`${base}/api/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, user: userUuid }),
      });
      const json: any = await res.json();
      return { ok: json.ok ?? false, message: json.message ?? "Unknown error" };
    } catch {
      return { ok: false, message: "Backend unavailable" };
    }
  }
}

export const settingsService = new SettingsService();
