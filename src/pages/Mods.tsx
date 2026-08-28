import { useEffect, useState } from "react";
import { Search, Loader2, Download, Trash2, Package } from "lucide-react";
import { useMods, useProfiles } from "../store";

export default function Mods() {
  const { results, installed, loading, search, loadInstalled, versions, install, remove } = useMods();
  const profiles = useProfiles((s) => s.installed);
  const [query, setQuery] = useState("");
  const [gameVersion, setGameVersion] = useState("");
  const [activeProject, setActiveProject] = useState<{ id: string; title: string } | null>(null);
  const [modVersions, setModVersions] = useState<any[]>([]);
  const [loadingVer, setLoadingVer] = useState(false);

  const fabricVersions = profiles.filter((p) => p.type === "fabric");
  useEffect(() => {
    if (!gameVersion && fabricVersions[0]) setGameVersion(fabricVersions[0].gameVersion);
  }, [fabricVersions, gameVersion]);

  useEffect(() => {
    if (gameVersion) loadInstalled(gameVersion);
  }, [gameVersion, loadInstalled]);

  const doSearch = () => search(query || "");

  const openVersions = async (projectId: string, title: string) => {
    setActiveProject({ id: projectId, title });
    setLoadingVer(true);
    try {
      const v = await versions(projectId, gameVersion, "fabric");
      setModVersions(v);
    } finally {
      setLoadingVer(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Mods</h1>
      <p className="text-muted text-sm mb-6">Browse and install mods from Modrinth. Requires a Fabric version.</p>

      {/* version selector */}
      <div className="flex gap-3 mb-4">
        <select
          value={gameVersion}
          onChange={(e) => setGameVersion(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-bg-800 border border-bg-700 outline-none focus:border-accent text-sm"
        >
          {fabricVersions.length === 0 && <option>No Fabric version installed</option>}
          {fabricVersions.map((v) => <option key={v.id} value={v.gameVersion}>{v.gameVersion}</option>)}
        </select>
      </div>

      {/* installed mods */}
      {installed.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted mb-2 uppercase tracking-wide">Installed ({installed.length})</h2>
          <div className="space-y-2">
            {installed.map((m) => (
              <div key={m.projectId} className="flex items-center justify-between p-3 rounded-xl bg-bg-800 border border-bg-700">
                <div className="flex items-center gap-3">
                  {m.iconUrl ? <img src={m.iconUrl} className="w-9 h-9 rounded" /> : <div className="w-9 h-9 rounded bg-accent/20 flex items-center justify-center"><Package size={18} className="text-accent" /></div>}
                  <div>
                    <div className="text-sm font-medium">{m.title}</div>
                    <div className="text-xs text-muted">{m.filename}</div>
                  </div>
                </div>
                <button onClick={() => remove(gameVersion, m.projectId)} className="p-2 rounded-lg text-muted hover:bg-err/20 hover:text-err transition">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Search mods (e.g. Sodium, Lithium)…"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-bg-800 border border-bg-700 outline-none focus:border-accent"
        />
      </div>

      {loading && <div className="flex items-center gap-2 text-muted"><Loader2 className="animate-spin" size={16} /> Searching…</div>}

      {/* results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.map((m) => (
          <div key={m.project_id} className="p-4 rounded-xl bg-bg-800 border border-bg-700 hover:border-accent/40 transition flex gap-3">
            {m.icon_url ? <img src={m.icon_url} className="w-12 h-12 rounded-lg flex-shrink-0" /> : <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0"><Package size={22} className="text-accent" /></div>}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{m.title}</div>
              <div className="text-xs text-muted line-clamp-2">{m.description}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-muted">{(m.downloads / 1000).toFixed(0)}k downloads</span>
              </div>
              <button
                disabled={!gameVersion}
                onClick={() => openVersions(m.project_id, m.title)}
                className="mt-2 w-full py-1.5 rounded-lg text-xs font-medium bg-accent/15 text-accent hover:bg-accent/25 transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Download size={13} /> Install
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* version picker modal */}
      {activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setActiveProject(null)}>
          <div className="w-[28rem] max-h-[60vh] overflow-y-auto bg-bg-800 rounded-2xl border border-bg-700 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-1">{activeProject.title}</h3>
            <p className="text-xs text-muted mb-4">Pick a version for {gameVersion} · Fabric</p>
            {loadingVer && <div className="flex items-center gap-2 text-muted"><Loader2 className="animate-spin" size={16} /> Loading…</div>}
            {!loadingVer && modVersions.length === 0 && <div className="text-muted text-sm">No compatible versions.</div>}
            {modVersions.map((v) => (
              <button
                key={v.id}
                onClick={async () => { await install(activeProject.id, v.id, gameVersion); setActiveProject(null); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-bg-700 transition mb-1"
              >
                <div className="text-left">
                  <div className="text-sm font-medium">{v.version_number}</div>
                  <div className="text-xs text-muted">{v.name}</div>
                </div>
                <Download size={16} className="text-accent" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
