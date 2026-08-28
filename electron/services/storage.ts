import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

export const DATA_DIR = path.join(app.getPath("userData"), "data");
export const MINECRAFT_DIR = path.join(app.getPath("home"), ".slavicmc");

export function ensureDirs() {
  for (const d of [DATA_DIR, MINECRAFT_DIR, path.join(MINECRAFT_DIR, "versions"), path.join(MINECRAFT_DIR, "mods"), path.join(MINECRAFT_DIR, "libraries"), path.join(MINECRAFT_DIR, "assets")]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }
}

export function readJson<T>(file: string, fallback: T): T {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}
