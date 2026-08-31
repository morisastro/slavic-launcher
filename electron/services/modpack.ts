import * as fs from "fs";
import * as path from "path";
import { MINECRAFT_DIR, readJson, writeJson, DATA_DIR } from "./storage";
import { modrinthService } from "./modrinth";

const API = "https://api.modrinth.com/v2";

// Slavic Modpack — curated Lunar-like mods (by slug)
export interface ModpackEntry {
  slug: string;
  category: "performance" | "visual" | "hud" | "cosmetic" | "utility";
  title: string;
  description: string;
  required: boolean;
}

export const SLAVIC_MODPACK: ModpackEntry[] = [
  // Performance
  { slug: "sodium", category: "performance", title: "Sodium", description: "Massive FPS boost. Modern rendering engine.", required: true },
  { slug: "lithium", category: "performance", title: "Lithium", description: "Server-side optimization. Smoother gameplay.", required: true },
  { slug: "fabric-api", category: "performance", title: "Fabric API", description: "Required by most Fabric mods.", required: true },
  { slug: "entityculling", category: "performance", title: "Entity Culling", description: "Skip rendering hidden entities.", required: false },
  // Visual
  { slug: "iris", category: "visual", title: "Iris Shaders", description: "Shader support (OptiFine replacement).", required: true },
  { slug: "reeses-sodium-options", category: "visual", title: "Reese's Sodium Options", description: "Better video settings menu.", required: false },
  // HUD
  { slug: "modmenu", category: "hud", title: "Mod Menu", description: "In-game mod list.", required: true },
  { slug: "zoomify", category: "utility", title: "Zoomify", description: "Smooth zoom (C key).", required: false },
];

export interface ModpackInstallResult {
  slug: string;
  title: string;
  installed: boolean;
  error?: string;
}

class ModpackService {
  // Get project IDs for all modpack mods by searching Modrinth
  async getProjectIds(): Promise<Record<string, string>> {
    const ids: Record<string, string> = {};
    for (const entry of SLAVIC_MODPACK) {
      try {
        const res = await fetch(`${API}/project/${entry.slug}`, {
          headers: { "User-Agent": "slavic-launcher/0.1" },
        });
        if (res.ok) {
          const proj = (await res.json()) as { id: string };
          ids[entry.slug] = proj.id;
        }
      } catch {}
    }
    return ids;
  }

  // Install the full Slavic Modpack for a given game version
  async installAll(gameVersion: string): Promise<ModpackInstallResult[]> {
    const projectIds = await this.getProjectIds();
    const results: ModpackInstallResult[] = [];

    for (const entry of SLAVIC_MODPACK) {
      const projectId = projectIds[entry.slug];
      if (!projectId) {
        results.push({ slug: entry.slug, title: entry.title, installed: false, error: "Project not found" });
        continue;
      }

      try {
        // Find latest version for this game version + fabric
        const versions = await modrinthService.versions(projectId, gameVersion, "fabric");
        if (versions.length === 0) {
          results.push({ slug: entry.slug, title: entry.title, installed: false, error: "No compatible version" });
          continue;
        }
        // Sort by date (newest first) — Modrinth returns newest first usually
        const latest = versions[0];
        await modrinthService.install(projectId, latest.id, gameVersion);
        results.push({ slug: entry.slug, title: entry.title, installed: true });
      } catch (err) {
        results.push({ slug: entry.slug, title: entry.title, installed: false, error: (err as Error).message });
      }
    }

    // Mark modpack as installed for this version
    this.setInstalled(gameVersion, true);
    return results;
  }

  isInstalled(gameVersion: string): boolean {
    const file = path.join(DATA_DIR, `modpack-${gameVersion}.json`);
    return readJson<boolean>(file, false);
  }

  setInstalled(gameVersion: string, installed: boolean) {
    const file = path.join(DATA_DIR, `modpack-${gameVersion}.json`);
    writeJson(file, installed);
  }

  list(): ModpackEntry[] {
    return SLAVIC_MODPACK;
  }
}

export const modpackService = new ModpackService();
