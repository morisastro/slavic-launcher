import * as fs from "fs";
import * as path from "path";
import { MINECRAFT_DIR, readJson, writeJson, DATA_DIR } from "./storage";

const API = "https://api.modrinth.com/v2";

export interface ModResult {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  icon_url?: string;
  downloads: number;
  categories: string[];
}

export interface ModVersion {
  id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  files: { filename: string; url: string; primary: boolean }[];
}

interface InstalledMod {
  projectId: string;
  title: string;
  slug: string;
  filename: string;
  iconUrl?: string;
  versionId: string;
}

class ModrinthService {
  async search(query: string, limit = 24): Promise<ModResult[]> {
    const facets = [["project_type:mod"]];
    const url = `${API}/search?limit=${limit}&query=${encodeURIComponent(query)}&facets=${encodeURIComponent(JSON.stringify(facets))}`;
    const res = await fetch(url, { headers: { "User-Agent": "slavic-launcher/0.1" } });
    if (!res.ok) throw new Error("Modrinth search failed");
    const json: any = await res.json();
    return json.hits.map((h: any) => ({
      project_id: h.project_id,
      slug: h.slug,
      title: h.title,
      description: h.description,
      icon_url: h.icon_url,
      downloads: h.downloads,
      categories: h.categories,
    }));
  }

  async versions(projectId: string, gameVersion: string, loader: string): Promise<ModVersion[]> {
    const url = `${API}/project/${projectId}/version?game_versions=["${gameVersion}"]&loaders=["${loader}"]`;
    const res = await fetch(url, { headers: { "User-Agent": "slavic-launcher/0.1" } });
    if (!res.ok) return [];
    return (await res.json()) as ModVersion[];
  }

  async install(projectId: string, versionId: string, gameVersion: string): Promise<InstalledMod> {
    const verRes = await fetch(`${API}/version/${versionId}`, { headers: { "User-Agent": "slavic-launcher/0.1" } });
    const ver = (await verRes.json()) as ModVersion;
    const file = ver.files.find((f) => f.primary) ?? ver.files[0];
    if (!file) throw new Error("No file to download");
    const projRes = await fetch(`${API}/project/${projectId}`, { headers: { "User-Agent": "slavic-launcher/0.1" } });
    const proj = (await projRes.json()) as { title: string; slug: string; icon_url?: string };

    const modsDir = path.join(MINECRAFT_DIR, "mods", gameVersion);
    fs.mkdirSync(modsDir, { recursive: true });
    const dest = path.join(modsDir, file.filename);
    const dl = await fetch(file.url, { headers: { "User-Agent": "slavic-launcher/0.1" } });
    fs.writeFileSync(dest, Buffer.from(await dl.arrayBuffer()));

    const inst: InstalledMod = { projectId, title: proj.title, slug: proj.slug, filename: file.filename, iconUrl: proj.icon_url, versionId };
    this.saveInstalled(gameVersion, inst);
    return inst;
  }

  installed(gameVersion: string): InstalledMod[] {
    const file = path.join(DATA_DIR, `mods-${gameVersion}.json`);
    return readJson<InstalledMod[]>(file, []);
  }
  private saveInstalled(gameVersion: string, mod: InstalledMod) {
    const file = path.join(DATA_DIR, `mods-${gameVersion}.json`);
    const list = readJson<InstalledMod[]>(file, []);
    const idx = list.findIndex((m) => m.projectId === mod.projectId);
    if (idx >= 0) list[idx] = mod;
    else list.push(mod);
    writeJson(file, list);
  }
  remove(gameVersion: string, modId: string) {
    const list = this.installed(gameVersion);
    const mod = list.find((m) => m.projectId === modId);
    if (mod) {
      const p = path.join(MINECRAFT_DIR, "mods", gameVersion, mod.filename);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    const next = list.filter((m) => m.projectId !== modId);
    writeJson(path.join(DATA_DIR, `mods-${gameVersion}.json`), next);
  }
}

export const modrinthService = new ModrinthService();
