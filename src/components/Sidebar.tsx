import { NavLink } from "react-router-dom";
import { Home, User, Box, Package, Server, ShoppingBag, Settings as SettingsIcon } from "lucide-react";

const items = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/accounts", icon: User, label: "Accounts" },
  { to: "/versions", icon: Box, label: "Versions" },
  { to: "/mods", icon: Package, label: "Mods" },
  { to: "/servers", icon: Server, label: "Servers" },
  { to: "/shop", icon: ShoppingBag, label: "Rewards" },
  { to: "/settings", icon: SettingsIcon, label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-bg-900 border-r border-bg-700 flex flex-col py-4 px-3 gap-1">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/"}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              isActive ? "bg-accent/15 text-accent shadow-glow" : "text-muted hover:bg-bg-800 hover:text-gray-200"
            }`
          }
        >
          <it.icon size={18} />
          {it.label}
        </NavLink>
      ))}
      <div className="mt-auto px-3 py-2 text-[10px] text-muted/60">v0.1.0 · Alpha</div>
    </aside>
  );
}
