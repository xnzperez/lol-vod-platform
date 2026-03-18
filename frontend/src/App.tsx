import { useEffect, useState, useRef } from "react";
import { VODWebSocketClient } from "./core/websocket";
// Añadimos PlayerData a la importación
import type { GameStats, PlayerData } from "./core/decoder";
import { VideoPlayer } from "./features/player/VideoPlayer";
import { PlayerPanel } from "./features/player/PlayerPanel";
import { sileo, Toaster } from "sileo";

function App() {
  const [stats, setStats] = useState<GameStats | null>(null);

  // 1. REFERENCIAS
  const wsClientRef = useRef<VODWebSocketClient | null>(null);
  const prevPlayersRef = useRef<PlayerData[]>([]);

  // 2. EFECTO DE RED (El que se había borrado accidentalmente)
  // Este se encarga de conectar el WebSocket al cargar la página
  useEffect(() => {
    const wsUrl = "ws://localhost:8080/ws/stats";
    wsClientRef.current = new VODWebSocketClient(wsUrl);

    wsClientRef.current.subscribe((newStats) => {
      setStats(newStats);
    });

    wsClientRef.current.connect();

    // Cleanup opcional al desmontar
    return () => {
      // wsClientRef.current?.disconnect();
    };
  }, []); // El array vacío significa: "Ejecuta esto SOLO una vez al inicio"

  // 3. EFECTO DE NOTIFICACIONES (El que creamos hoy)
  // Este "observa" los cambios en el inventario cada vez que llegan nuevos datos
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
            fill: "#0d1117", // Fondo oscuro que combina con nuestro Overlay
            styles: {
              title: "text-gray-300!",
              description: "text-amber-400! font-bold!", // Texto dorado para resaltar el objeto
            },
          });

          console.log(`[ALERTA] ${currentPlayer.name} compró ${newItem}`);
        }
      }
    });

    prevPlayersRef.current = stats.players;
  }, [stats]); // Este array significa: "Ejecuta esto cada vez que 'stats' cambie"

  // 4. EMISOR DE TIEMPO
  const handleVideoTimeUpdate = (currentTime: number) => {
    if (wsClientRef.current) {
      wsClientRef.current.sendMessage({ time: currentTime });
    }
  };

  const formatGold = (gold: number) => (Math.abs(gold) / 1000).toFixed(1) + "k";

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="relative w-[1280px] h-[720px] bg-black border border-[#30363d] shadow-2xl shadow-black/80 overflow-hidden">
        {/* Capa de Video */}
        <div className="absolute inset-0 z-10">
          <VideoPlayer
            url="http://localhost:8080/vod/partida-t1-geng.m3u8"
            onTimeUpdate={handleVideoTimeUpdate}
          />
        </div>

        {/* Capa de Estadísticas Globales */}
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

        {/* Capa de Jugadores (Interactiva) */}
        {/* Usamos z-50 pero con pointer-events-auto en el componente hijo */}
        <div className="absolute inset-0 z-50 pointer-events-none">
          <PlayerPanel players={stats?.players || []} />
        </div>
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
}

export default App;
