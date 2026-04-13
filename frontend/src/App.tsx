import { useState } from "react";
import { VideoPlayer } from "./features/player/VideoPlayer";
import { PlayerPanel } from "./features/player/PlayerPanel";
import { WinProbabilityBar } from "./features/player/WinProbabilityBar";
import { DragonTimer } from "./features/player/DragonTimer";
import { Toaster } from "sileo";

// 1. Importamos nuestro nuevo Custom Hook
import { useGameStats } from "./features/player/useGameStats";

function App() {
  // 2. Extraemos toda la lógica pesada en una sola línea elegante
  const { stats, updateServerTime } = useGameStats(
    "ws://localhost:8080/ws/stats",
  );

  // Estado global de reproducción
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVideoTimeUpdate = (currentTime: number) => {
    updateServerTime(currentTime);
  };

  const formatGold = (gold: number) => (Math.abs(gold) / 1000).toFixed(1) + "k";

  return (
    <div className="w-full h-screen flex justify-center items-center bg-zinc-900">
      <div className="relative w-[1280px] h-[720px] bg-black border border-[#30363d] shadow-2xl shadow-black/80 overflow-hidden">
        {/* --- CAPA 1: REPRODUCTOR DE VIDEO --- */}
        <div className="absolute inset-0 z-10">
          <VideoPlayer
            url="http://localhost:8080/vod/partida-t1-geng.m3u8"
            onTimeUpdate={handleVideoTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </div>

        {/* --- CAPA 2: OVERLAY DE ESTADÍSTICAS GLOBALES --- */}
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div className="absolute top-5 left-5 flex flex-col gap-3">
            {/* Caja de Oro */}
            <div className="bg-[#0d1117]/85 border border-[#30363d]/80 px-5 py-3 rounded backdrop-blur-sm text-lg font-semibold uppercase tracking-wider text-gray-300">
              Dif. de Oro:
              <span
                className={`ml-3 text-2xl font-extrabold ${stats?.goldDifference && stats.goldDifference > 0 ? "text-blue-500" : stats?.goldDifference && stats.goldDifference < 0 ? "text-red-500" : "text-gray-300"}`}
              >
                {stats
                  ? `${stats.goldDifference > 0 ? "+" : ""}${formatGold(stats.goldDifference)}`
                  : "Conectando..."}
              </span>
            </div>

            {/* 3. NUEVO: Componente de Interpolación del Dragón */}
            <DragonTimer
              serverTimer={stats?.dragonTimer}
              isPlaying={isPlaying}
            />
          </div>

          <div className="absolute top-5 left-1/2 -translate-x-1/2">
            {stats && stats.winProbability !== undefined && (
              <WinProbabilityBar blueWinProb={stats.winProbability} />
            )}
          </div>
        </div>

        {/* --- CAPA 3: PANELES INTERACTIVOS (Jugadores) --- */}
        <div className="absolute inset-0 z-50 pointer-events-none">
          <PlayerPanel players={stats?.players || []} />
        </div>

        {/* --- CAPA 4: MOTOR DE NOTIFICACIONES --- */}
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}

export default App;
