import { app, BrowserWindow, ipcMain, nativeTheme } from "electron";
import * as path from "path";
import { registerIpc } from "./ipc";
import { setMainWindow } from "./state";
import { setupAutoUpdater } from "./updater";
import { ensureDirs } from "./services/storage";

// Patch child_process to NEVER show a CMD window on Windows.
// MCLC uses spawn, exec, and execSync — all patched here.
const cp = require("child_process");

const origSpawn = cp.spawn;
cp.spawn = function (cmd: string, args: string[], opts: any) {
  const patched = { ...opts, windowsHide: true, windowsVerbatimArguments: false };
  if (cmd && typeof cmd === "string" && /java\.exe$/i.test(cmd)) {
    cmd = cmd.replace(/java\.exe$/i, "javaw.exe");
  }
  return origSpawn.call(this, cmd, args, patched);
};

const origExec = cp.exec;
cp.exec = function (cmd: string, opts: any, cb: any) {
  if (typeof opts === "function") { cb = opts; opts = {}; }
  return origExec.call(this, cmd, { ...opts, windowsHide: true }, cb);
};

const origExecSync = cp.execSync;
cp.execSync = function (cmd: string, opts: any) {
  return origExecSync.call(this, cmd, { ...opts, windowsHide: true, stdio: "pipe" });
};

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 940,
    minHeight: 640,
    frame: false,
    backgroundColor: "#0a0d12",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  setMainWindow(win);
  nativeTheme.themeSource = "dark";

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.on("closed", () => {
    win = null;
    setMainWindow(null);
  });

  // window controls (frameless)
  ipcMain.on("win:minimize", () => win?.minimize());
  ipcMain.on("win:maximize", () => {
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on("win:close", () => win?.close());
}

app.whenReady().then(() => {
  ensureDirs();
  registerIpc();
  createWindow();
  setupAutoUpdater();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
