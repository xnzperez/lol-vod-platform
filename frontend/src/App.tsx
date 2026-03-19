import { useEffect, useState, useRef } from "react";
import { VODWebSocketClient } from "./core/websocket";
import type { GameStats, PlayerData } from "./core/decoder";
import { VideoPlayer } from "./features/player/VideoPlayer";
import { PlayerPanel } from "./features/player/PlayerPanel";
import { WinProbabilityBar } from "./features/player/WinProbabilityBar";
import { sileo, Toaster } from "sileo";

function App() {
  const [stats, setStats] = useState<GameStats | null>(null);

  // Referencias para evitar re-renders innecesarios
  const wsClientRef = useRef<VODWebSocketClient | null>(null);
  const prevPlayersRef = useRef<PlayerData[]>([]);

  // Efecto 1: Conexión WebSocket al iniciar
  useEffect(() => {
    const wsUrl = "ws://localhost:8080/ws/stats";
    wsClientRef.current = new VODWebSocketClient(wsUrl);

    wsClientRef.current.subscribe((newStats) => {
      setStats(newStats);
    });

    wsClientRef.current.connect();

    return () => {
      // Cleanup opcional
    };
  }, []);

  // Efecto 2: Motor de Notificaciones Reactivas (Observador de Inventario)
  useEffect(() => {
    if (!stats?.players) return;

    stats.players.forEach((currentPlayer) => {
      const prevPlayer = prevPlayersRef.current.find(
        (p) => p.id === currentPlayer.id,
      );

      if (prevPlayer) {
        if (currentPlayer.items.length > prevPlayer.items.length) {
          const newItem = currentPlayer.items[currentPlayer.items.length - 1];

          sileo.info({
            title: "Actualización de Inventario",
            description: `¡${currentPlayer.name} ha comprado ${newItem}!`,
            fill: "#0d1117",
            styles: {
              title: "text-gray-300!",
              description: "text-amber-400! font-bold!",
            },
          });

          console.log(`[ALERTA] ${currentPlayer.name} compró ${newItem}`);
        }
      }
    });

    prevPlayersRef.current = stats.players;
  }, [stats]);

  // Sincronización de tiempo del video con el servidor
  const handleVideoTimeUpdate = (currentTime: number) => {
    if (wsClientRef.current) {
      wsClientRef.current.sendMessage({ time: currentTime });
    }
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
          />
        </div>

        {/* --- CAPA 2: OVERLAY DE ESTADÍSTICAS GLOBALES --- */}
        {/* pointer-events-none permite que el mouse pase a través para pausar/reproducir el video */}
        <div className="absolute inset-0 z-40 pointer-events-none">
          {/* Superior Izquierda: Cajas de Oro y Dragón */}
          <div className="absolute top-5 left-5 flex flex-col gap-3">
            <div className="bg-[#0d1117]/85 border border-[#30363d]/80 px-5 py-3 rounded backdrop-blur-sm text-lg font-semibold uppercase tracking-wider text-gray-300">
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

            <div className="bg-[#0d1117]/85 border border-[#30363d]/80 px-5 py-3 rounded backdrop-blur-sm text-lg font-semibold uppercase tracking-wider text-gray-300">
              Dragón en:
              <span className="ml-3 text-2xl font-extrabold text-amber-500">
                {stats ? `${stats.dragonTimer}s` : "--"}
              </span>
            </div>
          </div>

          {/* Superior Centro: Motor Analítico de Probabilidad de Victoria */}
          {/* -translate-x-1/2 lo centra perfectamente sin importar su ancho */}
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
