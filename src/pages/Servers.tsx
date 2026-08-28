import { useEffect, useState } from "react";
import { Server as ServerIcon, Loader2, Copy } from "lucide-react";

interface ServerEntry {
  id: string;
  name: string;
  ip: string;
  description: string;
  online: boolean;
  players?: number;
  maxPlayers?: number;
  icon?: string;
}

export default function Servers() {
  const [servers, setServers] = useState<ServerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = (await window.slavic.invoke("backend:servers")) as ServerEntry[];
        setServers(res);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-1">Servers</h1>
      <p className="text-muted text-sm mb-6">Featured servers from the Slavic Launcher network.</p>

      {loading && <div className="flex items-center gap-2 text-muted"><Loader2 className="animate-spin" size={16} /> Loading…</div>}
      {!loading && servers.length === 0 && (
        <div className="p-8 rounded-xl bg-bg-800 border border-bg-700 text-center text-muted text-sm">
          No servers configured yet. Add servers in your PocketBase admin panel.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {servers.map((s) => (
          <div key={s.id} className="flex gap-4 p-4 rounded-xl bg-bg-800 border border-bg-700 hover:border-accent/40 transition">
            <div className="w-14 h-14 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {s.icon ? <img src={s.icon} className="w-full h-full object-cover" /> : <ServerIcon className="text-accent" size={26} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{s.name}</h3>
                <span className={`w-2 h-2 rounded-full ${s.online ? "bg-ok" : "bg-muted/40"}`} />
              </div>
              <p className="text-xs text-muted line-clamp-2 mt-0.5">{s.description}</p>
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={() => navigator.clipboard.writeText(s.ip)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition"
                >
                  <Copy size={12} /> {s.ip}
                </button>
                <span className="text-xs text-muted">{s.players ?? 0}/{s.maxPlayers ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
