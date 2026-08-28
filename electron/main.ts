import { app, BrowserWindow, ipcMain, nativeTheme } from "electron";
import * as path from "path";
import { registerIpc } from "./ipc";
import { setMainWindow } from "./state";
import { setupAutoUpdater } from "./updater";

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
