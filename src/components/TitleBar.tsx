import { Minus, Square, X } from "lucide-react";

export default function TitleBar() {
  return (
    <div className="drag h-9 flex items-center justify-between bg-bg-900 border-b border-bg-700 select-none">
      <div className="flex items-center gap-2 px-3">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-accent to-accent-dim flex items-center justify-center text-[10px] font-bold text-white">S</div>
        <span className="text-xs font-semibold text-muted">Slavic Launcher</span>
      </div>
      <div className="no-drag flex items-center h-full">
        <button onClick={window.slavic.win.minimize} className="h-9 w-11 flex items-center justify-center text-muted hover:bg-bg-700 hover:text-white transition">
          <Minus size={16} />
        </button>
        <button onClick={window.slavic.win.maximize} className="h-9 w-11 flex items-center justify-center text-muted hover:bg-bg-700 hover:text-white transition">
          <Square size={13} />
        </button>
        <button onClick={window.slavic.win.close} className="h-9 w-11 flex items-center justify-center text-muted hover:bg-err hover:text-white transition">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
