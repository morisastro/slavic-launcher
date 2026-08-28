import * as fs from "fs";
import * as path from "path";
import { MINECRAFT_DIR, readJson, writeJson, DATA_DIR } from "./storage";
import { installVersion } from "./installVersion";

const FABRIC_META = "https://meta.fabricmc.net/v2";
const MANIFEST = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

export interface InstalledVersion {
  id: string;
  type: "vanilla" | "fabric";
  gameVersion: string;
  loaderVersion?: string;
}

class VersionsService {
  async getManifest(): Promise<{
    latest: { release: string; snapshot: string };
    versions: { id: string; type: string; releaseTime: string }[];
  }> {
    const file = path.join(DATA_DIR, "version-manifest.json");
    const cached = readJson<any>(file, null) as Awaited<ReturnType<typeof this.getManifest>> | null;
    if (cached) return cached;
    const res = await fetch(MANIFEST);
    const json = (await res.json()) as any;
    writeJson(file, json);
    return json;
  }

  async install(id: string, type: string, loaderVersion?: string): Promise<InstalledVersion> {
    if (type === "vanilla") {
      await installVersion(id, MINECRAFT_DIR);
    } else if (type === "fabric") {
      // ensure vanilla client json is present (fabric profile references the client jar)
      await installVersion(id, MINECRAFT_DIR);
      const lv = loaderVersion ?? (await this.fabricLoaders(id))[0].loaderVersion;
      await this.installFabric(id, lv);
      const rec: InstalledVersion = { id: `fabric-${id}`, type: "fabric", gameVersion: id, loaderVersion: lv };
      this.saveInstalled(rec);
      return rec;
    } else {
      throw new Error(`Unknown version type: ${type}`);
    }
    const rec: InstalledVersion = { id, type: "vanilla", gameVersion: id };
    this.saveInstalled(rec);
    return rec;
  }

  private async installFabric(gameVersion: string, loaderVersion: string) {
    const url = `${FABRIC_META}/versions/loader/${gameVersion}/${loaderVersion}/profile/json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Fabric profile not found for ${gameVersion}/${loaderVersion}`);
    const profile = (await res.json()) as any;
    const versionId = `fabric-${gameVersion}`;
    profile.id = versionId;

    // Merge vanilla profile data into fabric profile (libraries, downloads, assets)
    const vanillaPath = path.join(MINECRAFT_DIR, "versions", gameVersion, `${gameVersion}.json`);
    if (fs.existsSync(vanillaPath)) {
      const vanilla = JSON.parse(fs.readFileSync(vanillaPath, "utf8"));
      // copy client jar download info
      if (!profile.downloads?.client) {
        profile.downloads = { ...(vanilla.downloads || {}) };
      }
      profile.assetIndex = vanilla.assetIndex;
      profile.assets = vanilla.assets;
      // merge libraries: vanilla first, then fabric (fabric libs override by name)
      const vanillaLibs = vanilla.libraries || [];
      const fabricLibs = profile.libraries || [];
      const fabricLibNames = new Set(fabricLibs.map((l: any) => l.name));
      profile.libraries = [...vanillaLibs.filter((l: any) => !fabricLibNames.has(l.name)), ...fabricLibs];
      // copy other fields fabric needs
      if (vanilla.mainClass && !profile.mainClass) profile.mainClass = vanilla.mainClass;
      profile.type = vanilla.type || "release";
      profile.minecraftArguments = vanilla.minecraftArguments;
      profile.arguments = vanilla.arguments || { game: [], jvm: [] };
    }

    const dir = path.join(MINECRAFT_DIR, "versions", versionId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${versionId}.json`), JSON.stringify(profile, null, 2));
  }

  async fabricLoaders(gameVersion: string): Promise<{ loaderVersion: string; stable: boolean }[]> {
    const res = await fetch(`${FABRIC_META}/versions/loader/${gameVersion}`);
    if (!res.ok) throw new Error("Failed to fetch Fabric loaders");
    const data = (await res.json()) as { loader: { version: string; stable: boolean } }[];
    return data.slice(0, 10).map((d) => ({ loaderVersion: d.loader.version, stable: d.loader.stable }));
  }

  installed(): InstalledVersion[] {
    return readJson<InstalledVersion[]>(path.join(DATA_DIR, "installed-versions.json"), []);
  }
  private saveInstalled(rec: InstalledVersion) {
    const file = path.join(DATA_DIR, "installed-versions.json");
    const list = readJson<InstalledVersion[]>(file, []);
    const idx = list.findIndex((v) => v.gameVersion === rec.gameVersion && v.type === rec.type);
    if (idx >= 0) list[idx] = rec;
    else list.push(rec);
    writeJson(file, list);
  }
}

export const versionsService = new VersionsService();
