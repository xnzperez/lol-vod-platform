import { useEffect, useState } from "react";
import { VODWebSocketClient } from "./core/websocket";
// Importamos GameStats como un tipo explícito
import type { GameStats } from "./core/decoder";

function App() {
  // Estado inicial de las estadísticas
  const [stats, setStats] = useState<GameStats | null>(null);

  // useEffect: Maneja el ciclo de vida de la conexión WebSocket
  useEffect(() => {
    const wsUrl = "ws://localhost:8080/ws/stats";
    const wsClient = new VODWebSocketClient(wsUrl);

    // Cuando llega un mensaje del servidor, actualizamos el estado de React
    wsClient.subscribe((newStats) => {
      setStats(newStats);
    });

    wsClient.connect();

    // Cleanup: En React estricto, es vital cerrar la conexión si el componente se desmonta
    return () => {
      // wsClient.disconnect(); // (Implementaremos este método luego en la clase WebSocket si es necesario)
    };
  }, []); // El array vacío [] asegura que esto solo se ejecute una vez al cargar la página

  // Lógica de formateo de oro
  const formatGold = (gold: number) => (Math.abs(gold) / 1000).toFixed(1) + "k";

  return (
    // Contenedor principal que centra todo en la pantalla
    <div className="w-full h-screen flex justify-center items-center">
      {/* Contenedor VOD (1280x720) con posición relativa para el Overlay */}
      <div className="relative w-[1280px] h-[720px] bg-black border border-[#30363d] shadow-2xl shadow-black/80 overflow-hidden">
        {/* Capa 1: Reproductor de Video (Placeholder) */}
        <div className="absolute inset-0 flex justify-center items-center text-gray-600 text-2xl font-bold">
          [ Área reservada para el reproductor HLS ]
        </div>

        {/* Capa 2: Overlay de Estadísticas (z-index 50) pointer-events-none deja hacer clic a través de él */}
        <div className="absolute top-5 left-5 z-50 flex flex-col gap-3 pointer-events-none">
          {/* Caja de Diferencia de Oro */}
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
                ? `${stats.goldDifference > 0 ? "+" : "-"}${formatGold(stats.goldDifference)}`
                : "Conectando..."}
            </span>
          </div>

          {/* Caja del Dragón */}
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
