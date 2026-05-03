import { Routes, Route, Navigate } from "react-router-dom";
import { WatchView } from "./pages/WatchView";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-bold tracking-tight text-white uppercase text-xs tracking-[0.2em]">
              Lol Vod Platform
            </span>
          </div>
        </div>
      </header>

      <Routes>
        {/* Redirigimos la raíz a nuestra partida de prueba por defecto */}
        <Route
          path="/"
          element={<Navigate to="/watch/LA1_1654100537" replace />}
        />

        {/* Ruta dinámica para cualquier match_id */}
        <Route path="/watch/:matchId" element={<WatchView />} />

        {/* Placeholder para autenticación */}
        <Route
          path="/auth"
          element={<div className="p-10 text-center">Auth View (Pending)</div>}
        />
      </Routes>
    </div>
  );
}
