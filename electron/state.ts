import { BrowserWindow } from "electron";

let main: BrowserWindow | null = null;
export function setMainWindow(w: BrowserWindow | null) {
  main = w;
}
export function getMainWindow() {
  return main;
}
