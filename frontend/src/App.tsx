import { useEffect, useState, useRef } from "react";
import { VODWebSocketClient } from "./core/websocket";
import type { GameStats } from "./core/decoder";
import { VideoPlayer } from "./features/player/VideoPlayer";

function App() {
  const [stats, setStats] = useState<GameStats | null>(null);

  // Usamos useRef para mantener la conexión WebSocket sin causar re-renderizados
  const wsClientRef = useRef<VODWebSocketClient | null>(null);

  useEffect(() => {
    const wsUrl = "ws://localhost:8080/ws/stats";
    wsClientRef.current = new VODWebSocketClient(wsUrl);

    wsClientRef.current.subscribe((newStats) => {
      setStats(newStats);
    });

    wsClientRef.current.connect();

    return () => {
      // Limpieza en caso de desmontaje
    };
  }, []);

  // Esta función es llamada por el VideoPlayer varias veces por segundo
  const handleVideoTimeUpdate = (currentTime: number) => {
    if (wsClientRef.current) {
      // Le enviamos al backend el segundo exacto en el que va el reproductor
      wsClientRef.current.sendMessage({ time: currentTime });
    }
  };

  const formatGold = (gold: number) => (Math.abs(gold) / 1000).toFixed(1) + "k";

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="relative w-[1280px] h-[720px] bg-black border border-[#30363d] shadow-2xl shadow-black/80 overflow-hidden">
        <div className="absolute inset-0 z-10">
          {/* Pasamos el callback al componente del video */}
          <VideoPlayer
            url="http://localhost:8080/vod/partida-t1-geng.m3u8"
            onTimeUpdate={handleVideoTimeUpdate}
          />
        </div>

        <div className="absolute top-5 left-5 z-50 flex flex-col gap-3 pointer-events-none">
          <div className="bg-[#0d1117]/85 border border-[#30363d]/80 px-5 py-3 rounded backdrop-blur-sm text-lg font-semibold uppercase tracking-wider">
            Dif. de Oro:
            <span
              className={`ml-3 text-2xl font-extrabold ${
                stats?.goldDifference && stats.goldDifference > 0
                  ? "text-blue-500"
                  : stats?.goldDifference && stats.goldDifference < 0
                    ? "text-red-500"
                    : "text-gray-300"
              }`}
            >
              {stats
                ? `${stats.goldDifference > 0 ? "+" : ""}${formatGold(stats.goldDifference)}`
                : "Conectando..."}
            </span>
          </div>

          <div className="bg-[#0d1117]/85 border border-[#30363d]/80 px-5 py-3 rounded backdrop-blur-sm text-lg font-semibold uppercase tracking-wider">
            Dragón en:
            <span className="ml-3 text-2xl font-extrabold text-amber-500">
              {stats ? `${stats.dragonTimer}s` : "--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
