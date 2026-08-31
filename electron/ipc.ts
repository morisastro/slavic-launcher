import { ipcMain } from "electron";
import { getMainWindow } from "./state";
import { authService } from "./services/auth";
import { launcherService } from "./services/launcher";
import { modrinthService } from "./services/modrinth";
import { modpackService } from "./services/modpack";
import { versionsService } from "./services/versions";
import { javaService } from "./services/java";
import { settingsService } from "./services/settings";

export function registerIpc() {
  const send = (channel: string, ...args: unknown[]) => {
    getMainWindow()?.webContents.send(channel, ...args);
  };

  // ---- window / system ----
  ipcMain.handle("app:version", () => process.env.npm_package_version ?? "0.1.0");

  // ---- accounts ----
  ipcMain.handle("auth:list", () => authService.list());
  ipcMain.handle("auth:get-active", () => authService.getActive());
  ipcMain.handle("auth:set-active", (_e, uuid: string) => authService.setActive(uuid));
  ipcMain.handle("auth:add-offline", (_e, name: string) => authService.addOffline(name));
  ipcMain.handle("auth:remove", (_e, uuid: string) => authService.remove(uuid));
  ipcMain.handle("auth:login-microsoft", async () => {
    const acc = await authService.loginMicrosoft();
    return acc;
  });

  // ---- versions ----
  ipcMain.handle("versions:manifest", () => versionsService.getManifest());
  ipcMain.handle("versions:install", (_e, id: string, type: string, loaderVersion?: string) =>
    versionsService.install(id, type, loaderVersion),
  );
  ipcMain.handle("versions:installed", () => versionsService.installed());
  ipcMain.handle("versions:fabric-loaders", (_e, gameVersion: string) =>
    versionsService.fabricLoaders(gameVersion),
  );

  // ---- launching ----
  ipcMain.handle("launch:start", async (_e, profileId: string) => {
    try {
      await launcherService.launch(profileId, (evt) => send("launch:event", evt));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
  ipcMain.handle("launch:kill", () => launcherService.kill());

  // ---- modrinth ----
  ipcMain.handle("modrinth:search", (_e, query: string, limit: number) =>
    modrinthService.search(query, limit),
  );
  ipcMain.handle("modrinth:versions", (_e, projectId: string, gameVersion: string, loader: string) =>
    modrinthService.versions(projectId, gameVersion, loader),
  );
  ipcMain.handle("modrinth:install", (_e, projectId: string, versionId: string, gameVersion: string) =>
    modrinthService.install(projectId, versionId, gameVersion),
  );
  ipcMain.handle("modrinth:installed", (_e, gameVersion: string) =>
    modrinthService.installed(gameVersion),
  );
  ipcMain.handle("modrinth:remove", (_e, gameVersion: string, modId: string) =>
    modrinthService.remove(gameVersion, modId),
  );

  // ---- modpack (Slavic Lunar-like bundle) ----
  ipcMain.handle("modpack:list", () => modpackService.list());
  ipcMain.handle("modpack:is-installed", (_e, gameVersion: string) =>
    modpackService.isInstalled(gameVersion),
  );
  ipcMain.handle("modpack:install", async (_e, gameVersion: string) => {
    try {
      const results = await modpackService.installAll(gameVersion);
      return { ok: true, results };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });

  // ---- java ----
  ipcMain.handle("java:detect", () => javaService.detect());
  ipcMain.handle("java:install", (_e, major: number) => javaService.install(major));

  // ---- settings ----
  ipcMain.handle("settings:get", () => settingsService.get());
  ipcMain.handle("settings:set", (_e, patch: Record<string, unknown>) => settingsService.set(patch));

  // ---- backend ----
  ipcMain.handle("backend:news", async () => settingsService.fetchNews());
  ipcMain.handle("backend:servers", async () => settingsService.fetchServers());
  ipcMain.handle("backend:redeem", (_e, code: string, userUuid: string) =>
    settingsService.redeemCode(code, userUuid),
  );
}
