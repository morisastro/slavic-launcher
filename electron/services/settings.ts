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

const BACKEND_URL = "https://slavic-launcher-backend.onrender.com";
const FILE = path.join(DATA_DIR, "settings.json");
const DEFAULTS: LauncherSettings = {
  minRam: 1024,
  maxRam: 4096,
  javaPath: "",
  backendUrl: BACKEND_URL,
  discordRpc: true,
  keepLauncherOpen: false,
  windowWidth: 854,
  windowHeight: 480,
  fullscreen: false,
};

class SettingsService {
  get(): LauncherSettings {
    return { ...DEFAULTS, ...readJson<Partial<LauncherSettings>>(FILE, {}), backendUrl: BACKEND_URL };
  }
  set(patch: Partial<LauncherSettings>) {
    // never allow backendUrl to be changed
    const { backendUrl, ...safePatch } = patch;
    void backendUrl;
    const next = { ...this.get(), ...safePatch, backendUrl: BACKEND_URL };
    writeJson(FILE, next);
    return next;
  }

  // ---- backend (Express) ----
  async fetchNews(): Promise<{ id: string; title: string; body: string; image?: string; date: string }[]> {
    const base = this.get().backendUrl;
    try {
      const res = await fetch(`${base}/api/news`);
      if (!res.ok) return [];
      const json: any = await res.json();
      return (json.items ?? []).map((i: any) => ({ id: String(i.id), title: i.title, body: i.body, date: i.date }));
    } catch {
      return [];
    }
  }

  async fetchServers(): Promise<{ id: string; name: string; ip: string; description: string; online: boolean; players?: number; maxPlayers?: number; icon?: string }[]> {
    const base = this.get().backendUrl;
    try {
      const res = await fetch(`${base}/api/servers`);
      if (!res.ok) return [];
      const json: any = await res.json();
      return (json.items ?? []).map((i: any) => ({ id: String(i.id), name: i.name, ip: i.ip, description: i.description, online: !!i.online, players: i.players, maxPlayers: i.maxPlayers }));
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
