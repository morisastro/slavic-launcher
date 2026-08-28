export interface Account {
  uuid: string;
  username: string;
  type: "offline" | "microsoft";
}
export interface InstalledVersion {
  id: string;
  type: "vanilla" | "fabric";
  gameVersion: string;
  loaderVersion?: string;
}
export interface LauncherSettings {
  minRam: number;
  maxRam: number;
  javaPath: string;
  backendUrl: string;
  discordRpc: boolean;
  keepLauncherOpen: boolean;
  windowWidth: number;
  windowHeight: number;
  fullscreen: boolean;
}

export interface AccountStore {
  accounts: Account[];
  active: Account | null;
  loading: boolean;
  init: () => Promise<void>;
  setActive: (uuid: string) => Promise<void>;
  addOffline: (name: string) => Promise<Account>;
  remove: (uuid: string) => Promise<void>;
  loginMicrosoft: () => Promise<void>;
}
export interface ProfileStore {
  manifest: { latest: { release: string; snapshot: string }; versions: { id: string; type: string; releaseTime: string }[] } | null;
  installed: InstalledVersion[];
  selectedId: string | null;
  loading: boolean;
  init: () => Promise<void>;
  select: (id: string) => void;
  install: (id: string, type: string, loaderVersion?: string) => Promise<void>;
  fabricLoaders: (gameVersion: string) => Promise<{ loaderVersion: string; stable: boolean }[]>;
}
export interface SettingsStore {
  settings: LauncherSettings | null;
  load: () => Promise<void>;
  update: (patch: Partial<LauncherSettings>) => Promise<LauncherSettings>;
}
export interface LaunchStore {
  state: "idle" | "launching" | "running" | "error";
  logs: string[];
  progress: number;
  start: (profileId: string) => Promise<void>;
  kill: () => Promise<void>;
}
export interface ModResult {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  icon_url?: string;
  downloads: number;
  categories: string[];
}
export interface InstalledMod {
  projectId: string;
  title: string;
  slug: string;
  filename: string;
  iconUrl?: string;
  versionId: string;
}
export interface ModsStore {
  results: ModResult[];
  installed: InstalledMod[];
  loading: boolean;
  search: (query: string) => Promise<void>;
  loadInstalled: (gameVersion: string) => Promise<void>;
  versions: (projectId: string, gameVersion: string, loader: string) => Promise<any[]>;
  install: (projectId: string, versionId: string, gameVersion: string) => Promise<void>;
  remove: (gameVersion: string, modId: string) => Promise<void>;
}
