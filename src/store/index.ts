import { create } from "zustand";
import { AccountStore, ProfileStore, SettingsStore, LaunchStore, ModsStore } from "./types";

export const useAccounts = create<AccountStore>((set, get) => ({
  accounts: [],
  active: null,
  loading: false,
  init: async () => {
    const accounts = (await window.slavic.invoke("auth:list")) as Awaited<ReturnType<typeof window.slavic.invoke>>;
    const active = (await window.slavic.invoke("auth:get-active")) as Awaited<ReturnType<typeof window.slavic.invoke>>;
    set({ accounts: accounts as any, active: active as any });
  },
  setActive: async (uuid) => {
    await window.slavic.invoke("auth:set-active", uuid);
    set({ active: get().accounts.find((a) => a.uuid === uuid) ?? null });
  },
  addOffline: async (name) => {
    const acc = await window.slavic.invoke("auth:add-offline", name);
    await get().init();
    return acc as any;
  },
  remove: async (uuid) => {
    await window.slavic.invoke("auth:remove", uuid);
    await get().init();
  },
  loginMicrosoft: async () => {
    set({ loading: true });
    try {
      await window.slavic.invoke("auth:login-microsoft");
      await get().init();
    } finally {
      set({ loading: false });
    }
  },
}));

export const useProfiles = create<ProfileStore>((set, get) => ({
  manifest: null,
  installed: [],
  selectedId: null,
  loading: false,
  init: async () => {
    const manifest = (await window.slavic.invoke("versions:manifest")) as any;
    const installed = (await window.slavic.invoke("versions:installed")) as any[];
    set({ manifest, installed, selectedId: installed[0]?.id ?? null });
  },
  select: (id) => set({ selectedId: id }),
  install: async (id, type, loaderVersion?) => {
    set({ loading: true });
    try {
      await window.slavic.invoke("versions:install", id, type, loaderVersion);
      await get().init();
    } finally {
      set({ loading: false });
    }
  },
  fabricLoaders: async (gameVersion) => {
    return (await window.slavic.invoke("versions:fabric-loaders", gameVersion)) as { loaderVersion: string; stable: boolean }[];
  },
}));

export const useSettings = create<SettingsStore>((set, get) => ({
  settings: null,
  load: async () => {
    const settings = (await window.slavic.invoke("settings:get")) as any;
    set({ settings });
  },
  update: async (patch) => {
    const settings = await window.slavic.invoke("settings:set", patch);
    set({ settings: settings as any });
    return settings as any;
  },
}));

export const useLaunch = create<LaunchStore>((set, get) => ({
  state: "idle",
  logs: [],
  progress: 0,
  start: async (profileId) => {
    set({ state: "launching", logs: [], progress: 0 });
    window.slavic.on("launch:event", (evt: any) => {
      if (evt.type === "progress") set({ progress: evt.progress });
      else if (evt.type === "log") set({ logs: [...get().logs, evt.message].slice(-500) });
      else if (evt.type === "started") set({ state: "running", progress: 1 });
      else if (evt.type === "error") set({ state: "error", logs: [...get().logs, `[ERROR] ${evt.message}`] });
      else if (evt.type === "done" || evt.type === "closed") set({ state: "idle" });
    });
    const res = (await window.slavic.invoke("launch:start", profileId)) as { ok: boolean; error?: string };
    if (!res.ok) set({ state: "error", logs: [...get().logs, `[ERROR] ${res.error}`] });
  },
  kill: async () => {
    await window.slavic.invoke("launch:kill");
    set({ state: "idle" });
  },
}));

export const useMods = create<ModsStore>((set, get) => ({
  results: [],
  installed: [],
  loading: false,
  search: async (query) => {
    set({ loading: true });
    try {
      const results = (await window.slavic.invoke("modrinth:search", query, 30)) as any[];
      set({ results });
    } finally {
      set({ loading: false });
    }
  },
  loadInstalled: async (gameVersion) => {
    const installed = (await window.slavic.invoke("modrinth:installed", gameVersion)) as any[];
    set({ installed });
  },
  versions: async (projectId, gameVersion, loader) => {
    return (await window.slavic.invoke("modrinth:versions", projectId, gameVersion, loader)) as any[];
  },
  install: async (projectId, versionId, gameVersion) => {
    await window.slavic.invoke("modrinth:install", projectId, versionId, gameVersion);
    await get().loadInstalled(gameVersion);
  },
  remove: async (gameVersion, modId) => {
    await window.slavic.invoke("modrinth:remove", gameVersion, modId);
    await get().loadInstalled(gameVersion);
  },
}));

export const useModpack = create<any>((set, get) => ({
  list: [],
  installed: {},
  loading: false,
  init: async () => {
    const list = (await window.slavic.invoke("modpack:list")) as any[];
    set({ list });
  },
  check: async (gameVersion: string) => {
    const installed = (await window.slavic.invoke("modpack:is-installed", gameVersion)) as boolean;
    set((s: any) => ({ installed: { ...s.installed, [gameVersion]: installed } }));
  },
  install: async (gameVersion: string) => {
    set({ loading: true });
    try {
      const res = (await window.slavic.invoke("modpack:install", gameVersion)) as any;
      if (res.ok) {
        set((s: any) => ({ installed: { ...s.installed, [gameVersion]: true } }));
      }
      return res;
    } finally {
      set({ loading: false });
    }
  },
}));
