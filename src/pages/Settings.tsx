import { useEffect, useState } from "react";
import { useSettings } from "../store";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { settings, load, update } = useSettings();
  const [javaInstalls, setJavaInstalls] = useState<{ path: string; major: number; version: string }[]>([]);
  const [installingJava, setInstallingJava] = useState<number | null>(null);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    window.slavic.invoke("java:detect").then((r) => setJavaInstalls(r as any));
  }, []);

  if (!settings) return <div className="p-8 text-muted">Loading settings…</div>;

  const installJava = async (major: number) => {
    setInstallingJava(major);
    try {
      await window.slavic.invoke("java:install", major);
      const r = (await window.slavic.invoke("java:detect")) as any[];
      setJavaInstalls(r);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setInstallingJava(null);
    }
  };

  const totalRam = (navigator as any).deviceMemory ? (navigator as any).deviceMemory * 1024 : 8192;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Memory */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Memory</h2>
        <div className="space-y-4 p-4 rounded-xl bg-bg-800 border border-bg-700">
          <div>
            <label className="text-sm flex justify-between mb-1">
              <span>Max RAM</span>
              <span className="text-accent font-medium">{settings.maxRam} MB</span>
            </label>
            <input type="range" min={1024} max={Math.min(16384, totalRam)} step={512}
              value={settings.maxRam}
              onChange={(e) => update({ maxRam: parseInt(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>
        </div>
      </section>

      {/* Java */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Java</h2>
        <div className="p-4 rounded-xl bg-bg-800 border border-bg-700">
          <select
            value={settings.javaPath}
            onChange={(e) => update({ javaPath: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg bg-bg-900 border border-bg-700 outline-none focus:border-accent text-sm mb-3"
          >
            <option value="">Auto-detect</option>
            {javaInstalls.map((j) => <option key={j.path} value={j.path}>{j.version} (Java {j.major}) — {j.path}</option>)}
          </select>
          <div className="flex gap-2 flex-wrap">
            {[8, 17, 21].map((m) => (
              <button key={m} onClick={() => installJava(m)} disabled={installingJava === m}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-700 hover:bg-bg-600 transition flex items-center gap-1.5 disabled:opacity-50">
                {installingJava === m && <Loader2 className="animate-spin" size={12} />}
                Install Java {m}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Game Window */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Game Window</h2>
        <div className="p-4 rounded-xl bg-bg-800 border border-bg-700 space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>Fullscreen</span>
            <input type="checkbox" checked={settings.fullscreen} onChange={(e) => update({ fullscreen: e.target.checked })} className="accent-accent w-4 h-4" />
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted">Width</label>
              <input type="number" value={settings.windowWidth} onChange={(e) => update({ windowWidth: parseInt(e.target.value) || 854 })}
                className="w-full px-3 py-2 rounded-lg bg-bg-900 border border-bg-700 outline-none focus:border-accent text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted">Height</label>
              <input type="number" value={settings.windowHeight} onChange={(e) => update({ windowHeight: parseInt(e.target.value) || 480 })}
                className="w-full px-3 py-2 rounded-lg bg-bg-900 border border-bg-700 outline-none focus:border-accent text-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Launcher */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Launcher</h2>
        <div className="p-4 rounded-xl bg-bg-800 border border-bg-700 space-y-3">
          <label className="flex items-center justify-between text-sm">
            <span>Keep launcher open after game starts</span>
            <input type="checkbox" checked={settings.keepLauncherOpen} onChange={(e) => update({ keepLauncherOpen: e.target.checked })} className="accent-accent w-4 h-4" />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span>Discord Rich Presence</span>
            <input type="checkbox" checked={settings.discordRpc} onChange={(e) => update({ discordRpc: e.target.checked })} className="accent-accent w-4 h-4" />
          </label>
          <div>
            <label className="text-xs text-muted">Backend URL</label>
            <input value={settings.backendUrl} onChange={(e) => update({ backendUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-bg-900 border border-bg-700 outline-none focus:border-accent text-sm" />
          </div>
        </div>
      </section>
    </div>
  );
}
