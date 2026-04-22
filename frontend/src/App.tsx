import { useState, useRef } from "react";
import { VideoPlayer } from "./features/player/VideoPlayer";
import { PlayerPanel } from "./features/player/PlayerPanel";
import { WinProbabilityBar } from "./features/player/WinProbabilityBar";
import { DragonTimer } from "./features/player/DragonTimer";
import { Toaster } from "sileo";

import { useGameStats } from "./features/player/useGameStats";
import { useSmartUI } from "./features/player/useSmartUI";

function App() {
  const { stats, updateServerTime } = useGameStats(
    "ws://localhost:8080/ws/stats",
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const isUIVisible = useSmartUI(isPlaying);

  const handleVideoTimeUpdate = (currentTime: number) => {
    updateServerTime(currentTime);
  };

  const toggleFullScreen = async () => {
    if (!document.fullscreenElement) {
      if (playerContainerRef.current?.requestFullscreen) {
        await playerContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    }
  };

  const formatGold = (gold: number) => (Math.abs(gold) / 1000).toFixed(1) + "k";

  const fadeClass = `absolute inset-0 z-40 transition-opacity duration-700 ease-in-out ${
    isUIVisible ? "opacity-100" : "opacity-0"
  }`;

  return (
    // Fondo de la app
    <div className="w-full min-h-screen flex justify-center items-center bg-zinc-950">
      {/* CORRECCIÓN 1 (Fullscreen): Quitamos el max-w-[1280px]. 
        Ahora el contenedor intenta ocupar el 100% del ancho y alto disponible, 
        manteniendo el aspect-video (16:9) para que no se deforme.
      */}
      <div
        ref={playerContainerRef}
        className="relative w-full aspect-video bg-black border border-[#30363d] shadow-2xl shadow-black/80 overflow-hidden group max-h-screen"
      >
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
        <div className={`${fadeClass} pointer-events-none`}>
          {/* CORRECCIÓN 2 (Responsivo): Agrupamos Oro y Dragón. 
            En móviles se ven más pequeños (scale-75) y se reubican para no estorbar. 
          */}
          <div className="absolute top-2 left-2 md:top-5 md:left-5 flex flex-col gap-2 origin-top-left scale-75 md:scale-100">
            <div className="bg-white/10 border border-white/20 px-3 md:px-5 py-2 md:py-3 rounded-xl backdrop-blur-md shadow-lg text-xs md:text-sm font-bold uppercase tracking-wider text-gray-100 flex items-center justify-between min-w-[150px] md:min-w-[200px]">
              Dif. Oro
              <span
                className={`ml-3 md:ml-4 text-xl md:text-2xl font-black drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] ${stats?.goldDifference && stats.goldDifference > 0 ? "text-blue-400" : stats?.goldDifference && stats.goldDifference < 0 ? "text-red-400" : "text-gray-200"}`}
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

          {/* CORRECCIÓN 3 (Responsivo): Win Probability.
            Escalado al 75% en móviles y movido un poco hacia abajo para que el Oro no lo tape.
          */}
          <div className="absolute top-16 md:top-24 left-1/2 -translate-x-1/2 origin-top scale-75 md:scale-100 w-full max-w-[90%] md:max-w-none flex justify-center">
            {stats && stats.winProbability !== undefined && (
              <WinProbabilityBar blueWinProb={stats.winProbability} />
            )}
          </div>
        </div>

        {/* --- CAPA 3: PANELES INTERACTIVOS (Jugadores) --- */}
        <div
          className={`absolute inset-0 z-50 pointer-events-none transition-opacity duration-700 ease-in-out ${isUIVisible ? "opacity-100" : "opacity-0"}`}
        >
          {/* Envolvemos el PlayerPanel para poder escalarlo en móviles */}
          <div className="absolute right-2 md:right-4 top-[15%] md:top-1/4 origin-right scale-75 md:scale-100">
            <PlayerPanel players={stats?.players || []} />
          </div>
        </div>

        {/* --- CAPA 4: NOTIFICACIONES --- */}
        <div className="scale-75 md:scale-100 origin-bottom-right absolute bottom-0 right-0 z-50">
          <Toaster position="bottom-right" />
        </div>

        {/* --- CAPA 5: FULLSCREEN BUTTON --- */}
        <div
          className={`absolute bottom-4 right-4 md:bottom-6 md:right-6 z-[60] transition-opacity duration-300 pointer-events-auto ${isUIVisible ? "opacity-100" : "opacity-0"}`}
        >
          <button
            onClick={toggleFullScreen}
            className="p-1.5 md:p-2 bg-black/50 hover:bg-white/20 border border-white/20 rounded-lg backdrop-blur-md text-white transition-all shadow-lg cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              className="md:w-5 md:h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
