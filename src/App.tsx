import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAccounts, useProfiles, useSettings } from "./store";
import Sidebar from "./components/Sidebar";
import TitleBar from "./components/TitleBar";
import Home from "./pages/Home";
import Accounts from "./pages/Accounts";
import Versions from "./pages/Versions";
import Mods from "./pages/Mods";
import Servers from "./pages/Servers";
import Settings from "./pages/Settings";
import Shop from "./pages/Shop";

export default function App() {
  const initAccounts = useAccounts((s) => s.init);
  const initProfiles = useProfiles((s) => s.init);
  const loadSettings = useSettings((s) => s.load);

  useEffect(() => {
    initAccounts();
    initProfiles();
    loadSettings();
  }, [initAccounts, initProfiles, loadSettings]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bg-850">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/versions" element={<Versions />} />
            <Route path="/mods" element={<Mods />} />
            <Route path="/servers" element={<Servers />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
