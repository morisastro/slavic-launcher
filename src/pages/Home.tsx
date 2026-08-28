import { useState } from "react";
import { Play, Square, Loader2, ChevronDown } from "lucide-react";
import { useAccounts, useProfiles, useLaunch } from "../store";

export default function Home() {
  const { active } = useAccounts();
  const { installed, selectedId, select } = useProfiles();
  const launch = useLaunch();
  const [pickerOpen, setPickerOpen] = useState(false);

  const selected = installed.find((v) => v.id === selectedId) ?? installed[0] ?? null;
  const canLaunch = !!active && !!selected && launch.state !== "running" && launch.state !== "launching";

  return (
    <div className="relative h-full flex flex-col">
      {/* hero banner */}
      <div className="relative h-64 bg-gradient-to-br from-accent-dim/40 via-bg-800 to-bg-850 flex items-end p-8">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #5b8cff 0, transparent 40%)" }} />
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight">Slavic Launcher</h1>
          <p className="text-muted mt-1">Built for speed. Mods, Fabric, cosmetics — all in one place.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl glass rounded-2xl border border-bg-700 p-8">
          {/* profile picker */}
          <div className="relative mb-6 no-drag">
            <button
              onClick={() => setPickerOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-bg-800 border border-bg-700 hover:border-accent/50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-ok" />
                <div className="text-left">
                  <div className="text-sm font-semibold">{selected?.id ?? "No version"}</div>
                  <div className="text-xs text-muted">{selected ? `${selected.type} · ${selected.gameVersion}` : "Select a version"}</div>
                </div>
              </div>
              <ChevronDown size={18} className="text-muted" />
            </button>
            {pickerOpen && (
              <div className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto rounded-xl bg-bg-800 border border-bg-700 shadow-xl">
                {installed.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted">No versions installed. Go to Versions tab.</div>
                ) : (
                  installed.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { select(v.id); setPickerOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-bg-700 transition text-left"
                    >
                      <div>
                        <div className="text-sm font-medium">{v.id}</div>
                        <div className="text-xs text-muted">{v.type} · {v.gameVersion}</div>
                      </div>
                      {v.id === selectedId && <span className="text-accent text-xs">●</span>}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* account chip */}
          <div className="flex items-center justify-between mb-6 px-1">
            <div className="text-xs text-muted">Playing as</div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-xs font-bold text-accent">
                {active?.username?.[0]?.toUpperCase() ?? "?"}
              </div>
              <span className="text-sm font-medium">{active?.username ?? "No account"}</span>
              {active?.type === "microsoft" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-ok/20 text-ok">MS</span>}
            </div>
          </div>

          {/* launch button */}
          <button
            disabled={!canLaunch && launch.state !== "running"}
            onClick={() => (launch.state === "running" ? launch.kill() : launch.start(selected!.id))}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition ${
              launch.state === "running"
                ? "bg-err/20 text-err hover:bg-err/30"
                : canLaunch
                ? "bg-accent text-white hover:bg-accent-glow shadow-glow"
                : "bg-bg-700 text-muted cursor-not-allowed"
            }`}
          >
            {launch.state === "launching" ? (
              <><Loader2 className="animate-spin" size={22} /> Preparing… {(launch.progress * 100).toFixed(0)}%</>
            ) : launch.state === "running" ? (
              <><Square size={20} /> Stop Minecraft</>
            ) : (
              <><Play size={22} /> Launch Game</>
            )}
          </button>

          {!active && <p className="mt-4 text-center text-xs text-warn">Add an account in the Accounts tab to launch.</p>}
          {!selected && <p className="mt-2 text-center text-xs text-warn">Install a version in the Versions tab to launch.</p>}
        </div>
      </div>

      {/* live log */}
      {launch.logs.length > 0 && (
        <div className="h-44 mx-8 mb-8 rounded-xl bg-bg-900 border border-bg-700 p-3 overflow-y-auto font-mono text-[11px] text-muted">
          {launch.logs.map((l, i) => (
            <div key={i} className={l.startsWith("[ERROR]") ? "text-err" : ""}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
