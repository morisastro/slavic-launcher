import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execSync } from "child_process";
import { MINECRAFT_DIR, readJson, writeJson, DATA_DIR } from "./storage";

export interface JavaInstall {
  path: string;
  major: number;
  version: string;
}

class JavaService {
  detect(): JavaInstall[] {
    const found: JavaInstall[] = [];
    const seen = new Set<string>();
    const candidates: string[] = [];

    // Program Files
    const programFiles = process.env["ProgramFiles"] ?? "C:\\Program Files";
    const javaRoot = path.join(programFiles, "Java");
    if (fs.existsSync(javaRoot)) candidates.push(javaRoot);

    const programFiles86 = process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";
    const javaRoot86 = path.join(programFiles86, "Java");
    if (fs.existsSync(javaRoot86)) candidates.push(javaRoot86);

    // Adoptium
    const adoptium = path.join(programFiles, "Eclipse Adoptium");
    if (fs.existsSync(adoptium)) candidates.push(adoptium);

    // local launcher java dir
    candidates.push(path.join(MINECRAFT_DIR, "java"));

    for (const root of candidates) {
      if (!fs.existsSync(root)) continue;
      for (const dir of fs.readdirSync(root)) {
        const exe = path.join(root, dir, "bin", "javaw.exe");
        if (fs.existsSync(exe) && !seen.has(exe)) {
          seen.add(exe);
          const major = this.parseMajor(dir);
          found.push({ path: exe, major, version: dir });
        }
      }
    }
    return found;
  }

  private parseMajor(dir: string): number {
    const m = dir.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  async detectFor(gameVersion: string): Promise<string | null> {
    const major = await this.requiredMajorFromManifest(gameVersion);
    if (major <= 0) return null;
    const installs = this.detect();
    // prefer the highest java that meets the requirement
    const match = installs.filter((i) => i.major >= major).sort((a, b) => b.major - a.major)[0];
    if (match) return match.path;
    const record = this.installedList();
    const dl = record.filter((i) => i.major >= major).sort((a, b) => b.major - a.major)[0];
    return dl?.path ?? null;
  }

  requiredMajor(gameVersion: string): number {
    if (/^1\.(8|9|10|11|12|13|14|15|16)/.test(gameVersion)) return 8;
    if (/^1\.17/.test(gameVersion)) return 16;
    if (/^1\.1[89]/.test(gameVersion) || /^1\.20\.[0-4]/.test(gameVersion)) return 17;
    if (/^1\.2[01]/.test(gameVersion)) return 21;
    return 21;
  }

  async requiredMajorFromManifest(gameVersion: string): Promise<number> {
    // Read the installed version JSON to get the exact required javaVersion.majorVersion
    try {
      const fs = await import("fs");
      const path = await import("path");
      const { MINECRAFT_DIR } = await import("./storage");
      // try fabric variant first, then vanilla
      for (const id of [`fabric-${gameVersion}`, gameVersion]) {
        const jsonPath = path.join(MINECRAFT_DIR, "versions", id, `${id}.json`);
        if (fs.existsSync(jsonPath)) {
          const vj = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
          if (vj.javaVersion?.majorVersion) return vj.javaVersion.majorVersion;
        }
      }
    } catch {}
    return this.requiredMajor(gameVersion);
  }

  installedList(): JavaInstall[] {
    return readJson<JavaInstall[]>(path.join(DATA_DIR, "java-installs.json"), []);
  }

  javaMajorFromPath(javaPath: string): number {
    // try installed list first
    const inst = this.installedList().find((i) => i.path === javaPath);
    if (inst) return inst.major;
    // try detected
    const det = this.detect().find((i) => i.path === javaPath);
    if (det) return det.major;
    // try to parse from path
    const m = javaPath.match(/jre?[-_]?(\d+)/i) || javaPath.match(/jdk[-_]?(\d+)/i) || javaPath.match(/(\d+)/g);
    if (m) return parseInt(m[1] || m[0], 10);
    return 0;
  }
  private saveInstalled(list: JavaInstall[]) {
    writeJson(path.join(DATA_DIR, "java-installs.json"), list);
  }

  async install(major: number): Promise<JavaInstall> {
    // Use the simple /binary/latest/ endpoint (Adoptium). JRE builds were deprecated
    // for newer versions, so we download the JDK (which includes javaw.exe).
    const url = `https://api.adoptium.net/v3/binary/latest/${major}/ga/windows/x64/jdk/hotspot/normal/eclipse`;

    const destDir = path.join(MINECRAFT_DIR, "java", `jdk-${major}`);
    fs.mkdirSync(destDir, { recursive: true });
    const zipPath = path.join(destDir, "java.zip");

    const dl = await fetch(url);
    if (!dl.ok) throw new Error(`Adoptium returned ${dl.status} for Java ${major}`);
    const ab = await dl.arrayBuffer();
    fs.writeFileSync(zipPath, Buffer.from(ab));

    // Extract via tar (Windows 10+ has tar built-in)
    execSync(`tar -xf "${zipPath}" -C "${destDir}"`, { stdio: "inherit" });
    fs.unlinkSync(zipPath);

    // find javaw.exe
    const javaw = this.findExe(destDir, "javaw.exe");
    if (!javaw) throw new Error("Extraction succeeded but javaw.exe not found");
    const inst: JavaInstall = { path: javaw, major, version: `jdk-${major}` };
    const list = this.installedList();
    list.push(inst);
    this.saveInstalled(list);
    return inst;
  }

  private findExe(root: string, name: string): string | null {
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.name.toLowerCase() === name.toLowerCase()) return full;
      }
    }
    return null;
  }
}

export const javaService = new JavaService();
