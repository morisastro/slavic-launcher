import { useState } from "react";
import { Gift, Loader2, Check, AlertCircle } from "lucide-react";
import { useAccounts } from "../store";

export default function Shop() {
  const { active } = useAccounts();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const redeem = async () => {
    if (!code.trim() || !active) return;
    setBusy(true);
    try {
      const res = (await window.slavic.invoke("backend:redeem", code.trim(), active.uuid)) as { ok: boolean; message: string };
      setStatus(res);
      if (res.ok) setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2"><Gift className="text-accent" /> Rewards</h1>
      <p className="text-muted text-sm mb-6">Redeem codes for cosmetics. Earn codes via Discord events & giveaways.</p>

      <div className="p-5 rounded-xl bg-bg-800 border border-bg-700 mb-6">
        <h3 className="font-semibold mb-2">How to earn codes</h3>
        <ul className="text-sm text-muted space-y-1 list-disc list-inside">
          <li>Join our Discord and participate in giveaways</li>
          <li>Win community events & tournaments</li>
          <li>Help test new launcher features (beta tester)</li>
          <li>Refer friends to the Discord server</li>
        </ul>
      </div>

      <div className="p-5 rounded-xl bg-gradient-to-br from-accent/15 to-bg-800 border border-accent/30">
        <label className="text-sm font-semibold mb-2 block">Redeem a code</label>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code…"
            className="flex-1 px-4 py-2.5 rounded-lg bg-bg-900 border border-bg-700 outline-none focus:border-accent"
          />
          <button
            disabled={busy || !code.trim() || !active}
            onClick={redeem}
            className="px-5 py-2.5 rounded-lg bg-accent text-white font-semibold hover:bg-accent-glow transition disabled:opacity-50"
          >
            {busy ? <Loader2 className="animate-spin" size={18} /> : "Redeem"}
          </button>
        </div>
        {!active && <p className="mt-2 text-xs text-warn">Sign in first to redeem codes.</p>}
        {status && (
          <div className={`mt-3 flex items-center gap-2 text-sm ${status.ok ? "text-ok" : "text-err"}`}>
            {status.ok ? <Check size={16} /> : <AlertCircle size={16} />}
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
