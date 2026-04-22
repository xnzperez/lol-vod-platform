import { useState } from "react";
import { VideoPlayer } from "./features/player/VideoPlayer";
import { PlayerPanel } from "./features/player/PlayerPanel";
import { WinProbabilityBar } from "./features/player/WinProbabilityBar";
import { DragonTimer } from "./features/player/DragonTimer";
import { Toaster } from "sileo";

// Importamos nuestros Custom Hooks
import { useGameStats } from "./features/player/useGameStats";
import { useSmartUI } from "./features/player/useSmartUI"; // NUEVO

function App() {
  const { stats, updateServerTime } = useGameStats(
    "ws://localhost:8080/ws/stats",
  );

  const [isPlaying, setIsPlaying] = useState(false);

  // Instanciamos nuestra lógica inteligente
  const isUIVisible = useSmartUI(isPlaying);

  const handleVideoTimeUpdate = (currentTime: number) => {
    updateServerTime(currentTime);
  };

  const formatGold = (gold: number) => (Math.abs(gold) / 1000).toFixed(1) + "k";

  // Clase dinámica para el efecto de desvanecimiento
  const fadeClass = `absolute inset-0 z-40 transition-opacity duration-700 ease-in-out ${
    isUIVisible ? "opacity-100" : "opacity-0"
  }`;

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
        {/* Usamos nuestra clase dinámica 'fadeClass' y mantenemos el pointer-events-none */}
        <div className={`${fadeClass} pointer-events-none`}>
          <div className="absolute top-5 left-5 flex flex-col gap-3">
            {/* Caja de Oro - Estilo Glassmorphism */}
            <div className="bg-white/10 border border-white/20 px-5 py-3 rounded-2xl backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] text-sm font-bold uppercase tracking-wider text-gray-100 drop-shadow-md flex items-center justify-between min-w-[200px]">
              Dif. Oro
              <span
                className={`ml-4 text-2xl font-black drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] ${stats?.goldDifference && stats.goldDifference > 0 ? "text-blue-400" : stats?.goldDifference && stats.goldDifference < 0 ? "text-red-400" : "text-gray-200"}`}
              >
                {stats
                  ? `${stats.goldDifference > 0 ? "+" : ""}${formatGold(stats.goldDifference)}`
                  : "..."}
              </span>
            </div>

            <DragonTimer
              serverTimer={stats?.dragonTimer}
              isPlaying={isPlaying}
            />
          </div>

          <div className="absolute top-24 left-1/2 -translate-x-1/2">
            {stats && stats.winProbability !== undefined && (
              <WinProbabilityBar blueWinProb={stats.winProbability} />
            )}
          </div>
        </div>

        {/* --- CAPA 3: PANELES INTERACTIVOS (Jugadores) --- */}
        <div
          className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-700 ease-in-out ${isUIVisible ? "opacity-100" : "opacity-0"}`}
        >
          <PlayerPanel players={stats?.players || []} />
        </div>

        {/* --- CAPA 4: MOTOR DE NOTIFICACIONES --- */}
        {/* Las notificaciones las dejamos visibles para una compra clave*/}
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}

export default App;
