import { useState } from "react";
import { VideoPlayer } from "./features/player/VideoPlayer";
import { WinProbabilityBar } from "./features/player/WinProbabilityBar";
import { useGameStats } from "./features/player/useGameStats";

export default function App() {
  const [view, setView] = useState<"vod" | "auth">("vod");

  // 1. Instanciamos el hook con la URL de tu WebSocket en Go
  const { stats, updateServerTime } = useGameStats(
    "ws://localhost:8080/ws/stats",
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-6">
          <span className="font-bold tracking-tight text-white">
            Lol Vod Platform
          </span>
          <nav className="flex gap-4 text-sm font-medium">
            <button
              onClick={() => setView("vod")}
              className={view === "vod" ? "text-white" : "text-slate-400"}
            >
              VOD
            </button>
            <button
              onClick={() => setView("auth")}
              className={view === "auth" ? "text-white" : "text-slate-400"}
            >
              Auth
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6">
        {view === "vod" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black ring-1 ring-slate-800 shadow-2xl relative">
                {/* 2. Pasamos la función interceptora al reproductor */}
                <VideoPlayer
                  url="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                  onTimeUpdate={updateServerTime}
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mt-4 flex flex-col items-center">
                {/* 3. Renderizamos la barra si hay datos del WS */}
                {stats ? (
                  <WinProbabilityBar blueWinProb={stats.winProbability * 100} />
                ) : (
                  <span className="text-sm text-slate-500">
                    Sincronizando telemetría...
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-5 h-[600px] overflow-y-auto">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Match Stats
              </h2>
              <div className="text-sm text-slate-400">
                {/* 4. Debug visual: Vemos el JSON exacto en el panel derecho */}
                {stats ? (
                  <pre className="whitespace-pre-wrap font-mono text-xs text-green-400">
                    {JSON.stringify(stats, null, 2)}
                  </pre>
                ) : (
                  <p>Esperando telemetría del backend en Go...</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-800/50 rounded-xl text-center">
            Registro oculto temporalmente.
          </div>
        )}
      </main>
    </div>
  );
}
