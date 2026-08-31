import { Client } from "minecraft-launcher-core";
import { MINECRAFT_DIR } from "./storage";
import { authService } from "./auth";
import { versionsService } from "./versions";
import { javaService } from "./java";
import { settingsService } from "./settings";
import { modpackService } from "./modpack";

export interface LaunchEvent {
  type: "progress" | "log" | "error" | "started" | "closed" | "done";
  message?: string;
  progress?: number;
}

const client = new Client();

class LauncherService {
  async launch(profileId: string, emit: (e: LaunchEvent) => void): Promise<void> {
    const account = authService.getActive();
    if (!account) throw new Error("No active account. Add an account first.");
    const profile = versionsService.installed().find((v) => v.id === profileId);
    if (!profile) throw new Error(`Version ${profileId} not installed`);

    // Auto-install Slavic MOD for Fabric versions
    if (profile.type === "fabric") {
      modpackService.ensureInstalled(profile.gameVersion);
    }

    const settings = settingsService.get();
    let javaPath = settings.javaPath || (await javaService.detectFor(profile.gameVersion));

    // Auto-download Java if none found or if the found one is too old
    const requiredMajor = await javaService.requiredMajorFromManifest(profile.gameVersion);
    if (!javaPath || (requiredMajor > 0 && javaService.javaMajorFromPath(javaPath) < requiredMajor)) {
      const majorToInstall = requiredMajor > 0 ? requiredMajor : 21;
      emit({ type: "progress", message: `Downloading Java ${majorToInstall}…`, progress: 0.1 });
      try {
        const inst = await javaService.install(majorToInstall);
        javaPath = inst.path;
        emit({ type: "log", message: `[slavic] Java ${majorToInstall} installed at ${inst.path}` });
      } catch (err) {
        throw new Error(`Failed to auto-install Java ${majorToInstall}: ${(err as Error).message}. Install it manually in Settings.`);
      }
    }

    const versionId = profile.type === "fabric" ? `fabric-${profile.gameVersion}` : profile.gameVersion;

    client.on("data", (log: string) => {
      emit({ type: "log", message: log.trim() });
      if (log.includes("UnsupportedClassVersionError")) {
        emit({ type: "error", message: "Wrong Java version. Install a newer Java in Settings (Java 21 or 25)." });
      }
    });
    client.on("debug", (log: string) => emit({ type: "log", message: `[debug] ${log.trim()}` }));
    client.on("progress", (p: { type: string; task: number; total: number }) => {
      const frac = p.total ? p.task / p.total : 0;
      emit({ type: "progress", message: `${p.type} ${p.task}/${p.total}`, progress: 0.3 + frac * 0.6 });
    });
    client.on("close", () => emit({ type: "done", message: "Minecraft closed" }));

    emit({ type: "progress", message: "Preparing launch…", progress: 0.3 });

    const opts: Parameters<Client["launch"]>[0] = {
      authorization: (account.mclcAuth ?? {
        access_token: "offline",
        client_token: account.uuid,
        uuid: account.uuid,
        name: account.username,
        user_properties: "{}",
        meta: { type: "mojang" as const },
      }) as any,
      root: MINECRAFT_DIR,
      version: { number: versionId, type: "release" as const, custom: versionId },
      javaPath,
      memory: { max: `${settings.maxRam}M`, min: `${settings.minRam}M` },
      window: {
        width: settings.windowWidth,
        height: settings.windowHeight,
        fullscreen: settings.fullscreen,
      },
      customArgs: ["-Dslavic.launcher=true"],
    };

    await client.launch(opts);
    emit({ type: "started", message: "Minecraft started", progress: 1 });
  }

  kill() {
    // For MVP: relies on the game window being closed by the user.
  }
}

export const launcherService = new LauncherService();
