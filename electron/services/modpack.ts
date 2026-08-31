import * as fs from "fs";
import * as path from "path";
import { MINECRAFT_DIR, readJson, writeJson, DATA_DIR } from "./storage";

// The Slavic MOD jar is bundled with the launcher.
// In dev: read from mod/build/libs/. In prod: read from app resources.
function findSlavicJar(): string | null {
  const candidates = [
    path.join(__dirname, "..", "resources", "slavicmod.jar"),
    path.join(process.cwd(), "electron", "resources", "slavicmod.jar"),
    path.join(process.cwd(), "mod", "build", "libs", "slavicmod-1.0.0.jar"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

class ModpackService {
  // Install the Slavic MOD jar into the mods folder for a given game version.
  install(gameVersion: string): { ok: boolean; error?: string } {
    const jar = findSlavicJar();
    if (!jar) {
      return { ok: false, error: "Slavic MOD jar not found. Build it first: cd mod && gradlew.bat build" };
    }

    const modsDir = path.join(MINECRAFT_DIR, "mods", gameVersion);
    fs.mkdirSync(modsDir, { recursive: true });
    const dest = path.join(modsDir, "slavicmod.jar");
    fs.copyFileSync(jar, dest);

    this.setInstalled(gameVersion, true);
    return { ok: true };
  }

  isInstalled(gameVersion: string): boolean {
    const file = path.join(DATA_DIR, `modpack-${gameVersion}.json`);
    return readJson<boolean>(file, false);
  }

  setInstalled(gameVersion: string, installed: boolean) {
    const file = path.join(DATA_DIR, `modpack-${gameVersion}.json`);
    writeJson(file, installed);
  }

  // Also ensure the mod is installed when launching
  ensureInstalled(gameVersion: string) {
    if (!this.isInstalled(gameVersion)) {
      this.install(gameVersion);
    } else {
      // re-copy in case the jar was updated
      const jar = findSlavicJar();
      if (jar) {
        const dest = path.join(MINECRAFT_DIR, "mods", gameVersion, "slavicmod.jar");
        if (!fs.existsSync(dest) || fs.statSync(dest).size !== fs.statSync(jar).size) {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(jar, dest);
        }
      }
    }
  }
}

export const modpackService = new ModpackService();