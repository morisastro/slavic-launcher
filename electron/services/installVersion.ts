import * as fs from "fs";
import * as path from "path";
import { MINECRAFT_DIR } from "./storage";

const MANIFEST = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

// Write the version JSON for `versionId` into versions/<versionId>/<versionId>.json.
// MCLC's Client.launch() downloads the client jar, libraries, assets and natives from this JSON.
export async function installVersion(versionId: string, rootDir: string = MINECRAFT_DIR): Promise<void> {
  // fetch manifest to find the version json url
  const res = await fetch(MANIFEST);
  const manifest = (await res.json()) as { versions: { id: string; url: string }[] };
  const entry = manifest.versions.find((v) => v.id === versionId);
  if (!entry) throw new Error(`Version ${versionId} not found in manifest`);

  const jsonRes = await fetch(entry.url);
  const json = await jsonRes.json();
  const dir = path.join(rootDir, "versions", versionId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${versionId}.json`), JSON.stringify(json, null, 2));
}
