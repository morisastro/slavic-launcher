import { useMemo, useState, useEffect } from "react";
import { Search, Loader2, Download, Check, Filter, Sparkles, Zap } from "lucide-react";
import { useProfiles, useModpack } from "../store";

export default function Versions() {
  const { manifest, installed, install, loading, fabricLoaders } = useProfiles();
  const modpack = useModpack();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "release" | "snapshot" | "old">("release");
  const [installing, setInstalling] = useState<{ id: string; type: string } | null>(null);
  const [fabricModal, setFabricModal] = useState<string | null>(null);
  const [loaders, setLoaders] = useState<{ loaderVersion: string; stable: boolean }[]>([]);
  const [modpackModal, setModpackModal] = useState<string | null>(null);
  const [modpackResults, setModpackResults] = useState<any[] | null>(null);
  const [modpackInstalling, setModpackInstalling] = useState(false);

  useEffect(() => { modpack.init(); }, [modpack]);
  useEffect(() => {
    for (const v of installed) {
      if (v.type === "fabric") modpack.check(v.gameVersion);
    }
  }, [installed, modpack]);

  const versions = useMemo(() => {
    if (!manifest) return [];
    return manifest.versions.filter((v) => {
      if (filter !== "all" && v.type !== filter) return false;
      if (query && !v.id.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [manifest, filter, query]);

  const isInstalled = (id: string, type: string) =>
    installed.some((v) => v.gameVersion === id && v.type === type);

  const handleInstall = async (id: string, type: string, loaderVersion?: string) => {
    setInstalling({ id, type });
    try {
      await install(id, type, loaderVersion);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setInstalling(null);
      setFabricModal(null);
    }
  };

  const openFabric = async (gameVersion: string) => {
    const l = await fabricLoaders(gameVersion);
    setLoaders(l);
    setFabricModal(gameVersion);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Versions</h1>
      <p className="text-muted text-sm mb-6">Install vanilla or Fabric. Mods require Fabric.</p>

      {/* search + filter */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search versions (e.g. 1.20.4)…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-800 border border-bg-700 outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-center gap-1 bg-bg-800 border border-bg-700 rounded-lg px-2">
          <Filter size={16} className="text-muted ml-1" />
          {(["release", "snapshot", "old", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${filter === f ? "bg-accent text-white" : "text-muted hover:text-white"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* installed list */}
      {installed.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted mb-2 uppercase tracking-wide">Installed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {installed.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-800 border border-accent/30">
                <div>
                  <div className="font-medium text-sm">{v.id}</div>
                  <div className="text-xs text-muted capitalize">{v.type} · {v.gameVersion}</div>
                </div>
                <Check className="text-ok" size={18} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* available */}
      <h2 className="text-sm font-semibold text-muted mb-2 uppercase tracking-wide">Available</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {versions.slice(0, 60).map((v) => {
          const van = isInstalled(v.id, "vanilla");
          const fab = isInstalled(v.id, "fabric");
          return (
            <div key={v.id} className="p-4 rounded-xl bg-bg-800 border border-bg-700 hover:border-accent/40 transition">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{v.id}</div>
                  <div className="text-xs text-muted capitalize">{v.type}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  disabled={van || !!installing}
                  onClick={() => handleInstall(v.id, "vanilla")}
                  className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  style={{ background: van ? "rgba(61,214,140,0.15)" : "rgba(91,140,255,0.15)", color: van ? "#3dd68c" : "#5b8cff" }}
                >
                  {installing?.id === v.id && installing.type === "vanilla" ? <Loader2 className="animate-spin" size={14} /> : van ? <Check size={14} /> : <Download size={14} />}
                  {van ? "Vanilla" : "Vanilla"}
                </button>
                <button
                  disabled={fab || !!installing}
                  onClick={() => openFabric(v.id)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  style={{ background: fab ? "rgba(61,214,140,0.15)" : "rgba(91,140,255,0.15)", color: fab ? "#3dd68c" : "#5b8cff" }}
                >
                  {fab ? <Check size={14} /> : <Download size={14} />}
                  Fabric
                </button>
              </div>
              {fab && (
                <button
                  onClick={() => setModpackModal(v.id)}
                  className="w-full mt-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  style={{
                    background: modpack.installed[v.id]
                      ? "rgba(61,214,140,0.15)"
                      : "linear-gradient(135deg, rgba(91,140,255,0.2), rgba(122,164,255,0.1))",
                    color: modpack.installed[v.id] ? "#3dd68c" : "#5b8cff",
                    border: "1px solid rgba(91,140,255,0.3)",
                  }}
                >
                  <Sparkles size={13} />
                  {modpack.installed[v.id] ? "Slavic Modpack ✓" : "Install Slavic Modpack"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {loading && <div className="mt-6 flex items-center gap-2 text-muted text-sm"><Loader2 className="animate-spin" size={16} /> Installing…</div>}

      {/* fabric loader modal */}
      {fabricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setFabricModal(null)}>
          <div className="w-96 max-h-[60vh] overflow-y-auto bg-bg-800 rounded-2xl border border-bg-700 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-1">Fabric loader for {fabricModal}</h3>
            <p className="text-xs text-muted mb-4">Pick a loader version.</p>
            {loaders.length === 0 && <div className="text-muted text-sm">No loaders found.</div>}
            {loaders.map((l) => (
              <button
                key={l.loaderVersion}
                onClick={() => handleInstall(fabricModal, "fabric", l.loaderVersion)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-bg-700 transition mb-1"
              >
                <span className="text-sm font-medium">{l.loaderVersion}</span>
                {l.stable && <span className="text-[10px] px-2 py-0.5 rounded bg-ok/20 text-ok">stable</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slavic Modpack modal */}
      {modpackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { if (!modpackInstalling) setModpackModal(null); }}>
          <div className="w-[28rem] max-h-[70vh] overflow-y-auto bg-bg-800 rounded-2xl border border-bg-700 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="text-accent" size={20} />
              <h3 className="font-bold text-lg">Slavic Modpack</h3>
            </div>
            <p className="text-xs text-muted mb-4">Lunar-like experience for {modpackModal}. {modpack.list.length} mods included.</p>

            {!modpackResults && (
              <>
                <div className="space-y-2 mb-4">
                  {modpack.list.map((m: any) => (
                    <div key={m.slug} className="flex items-start gap-3 p-2.5 rounded-lg bg-bg-900 border border-bg-700">
                      <div className="mt-0.5">
                        {m.category === "performance" ? <Zap size={15} className="text-warn" /> : m.category === "visual" ? <Sparkles size={15} className="text-accent" /> : <Check size={15} className="text-ok" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-2">
                          {m.title}
                          {m.required && <span className="text-[9px] px-1.5 py-0.5 rounded bg-warn/20 text-warn">required</span>}
                        </div>
                        <div className="text-xs text-muted">{m.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  disabled={modpackInstalling}
                  onClick={async () => {
                    setModpackInstalling(true);
                    const res = await modpack.install(modpackModal);
                    setModpackInstalling(false);
                    if (res?.ok) {
                      setModpackResults(res.results);
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-glow transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {modpackInstalling ? <><Loader2 className="animate-spin" size={18} /> Installing {modpack.list.length} mods…</> : <><Download size={18} /> Install Modpack</>}
                </button>
              </>
            )}

            {modpackResults && (
              <>
                <div className="space-y-2 mb-4">
                  {modpackResults.map((r) => (
                    <div key={r.slug} className="flex items-center justify-between p-2.5 rounded-lg bg-bg-900 border border-bg-700">
                      <div>
                        <div className="text-sm font-medium">{r.title}</div>
                        {r.error && <div className="text-xs text-err">{r.error}</div>}
                      </div>
                      {r.installed ? <Check size={16} className="text-ok" /> : <span className="text-xs text-err">✗</span>}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setModpackModal(null); setModpackResults(null); }}
                  className="w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-glow transition"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
