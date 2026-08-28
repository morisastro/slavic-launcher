import { Client } from "minecraft-launcher-core";
import { MINECRAFT_DIR } from "./storage";
import { authService } from "./auth";
import { versionsService } from "./versions";
import { javaService } from "./java";
import { settingsService } from "./settings";

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

    const settings = settingsService.get();
    const javaPath = settings.javaPath || (await javaService.detectFor(profile.gameVersion));
    if (!javaPath) throw new Error("No Java installation found. Install Java in Settings.");

    const versionId = profile.type === "fabric" ? `fabric-${profile.gameVersion}` : profile.gameVersion;

    client.on("data", (log: string) => emit({ type: "log", message: log.trim() }));
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
