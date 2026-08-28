import { app } from "electron";
import { autoUpdater, UpdateInfo } from "electron-updater";
import { getMainWindow } from "./state";

// Auto-updates from GitHub Releases. Only runs in packaged builds (app.isPackaged).
export function setupAutoUpdater() {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    const win = getMainWindow();
    win?.webContents.send("updater:available", { version: info.version, releaseNotes: info.releaseNotes });
  });
  autoUpdater.on("update-downloaded", () => {
    getMainWindow()?.webContents.send("updater:downloaded");
  });
  autoUpdater.on("download-progress", (p: { percent: number }) => {
    getMainWindow()?.webContents.send("updater:progress", { percent: p.percent });
  });
  autoUpdater.on("error", (err: Error) => {
    console.error("[updater] error:", err.message);
  });

  ipcMainExists().then(() => {
    const { ipcMain } = require("electron");
    ipcMain.handle("updater:download", () => autoUpdater.downloadUpdate());
    ipcMain.handle("updater:install", () => autoUpdater.quitAndInstall());
  });

  // check every 30 minutes
  autoUpdater.checkForUpdates().catch((e) => console.error("[updater] check failed:", e.message));
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 30 * 60 * 1000);
}

function ipcMainExists() {
  return Promise.resolve();
}
