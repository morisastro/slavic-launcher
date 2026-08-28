import { useState } from "react";
import { UserPlus, Trash2, Loader2, Plus } from "lucide-react";
import { useAccounts } from "../store";

export default function Accounts() {
  const { accounts, active, addOffline, remove, loginMicrosoft, setActive, loading } = useAccounts();
  const [name, setName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">Accounts</h1>
      <p className="text-muted text-sm mb-6">Microsoft (official) and offline accounts.</p>

      <div className="space-y-3 mb-6">
        {accounts.length === 0 && <div className="text-muted text-sm py-8 text-center">No accounts yet.</div>}
        {accounts.map((a) => (
          <div key={a.uuid} className={`flex items-center justify-between p-4 rounded-xl border transition ${active?.uuid === a.uuid ? "border-accent bg-accent/10" : "border-bg-700 bg-bg-800"}`}>
            <button className="flex items-center gap-3 flex-1 text-left" onClick={() => setActive(a.uuid)}>
              <div className="w-10 h-10 rounded-full bg-accent/30 flex items-center justify-center font-bold text-accent">
                {a.username[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{a.username}</div>
                <div className="text-xs text-muted">{a.type === "microsoft" ? "Microsoft Account" : "Offline"} · {a.uuid.slice(0, 8)}</div>
              </div>
            </button>
            <button onClick={() => remove(a.uuid)} className="p-2 rounded-lg text-muted hover:bg-err/20 hover:text-err transition">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={loginMicrosoft}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-glow transition flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
        Login with Microsoft
      </button>

      <button onClick={() => setShowAdd((o) => !o)} className="w-full mt-3 py-3 rounded-xl bg-bg-800 border border-bg-700 text-gray-200 font-semibold hover:border-accent/50 transition flex items-center justify-center gap-2">
        <Plus size={18} /> Add offline account
      </button>
      {showAdd && (
        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Username"
            className="flex-1 px-4 py-2.5 rounded-lg bg-bg-800 border border-bg-700 outline-none focus:border-accent"
          />
          <button
            onClick={async () => { if (name.trim()) { await addOffline(name.trim()); setName(""); setShowAdd(false); } }}
            className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-glow"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
