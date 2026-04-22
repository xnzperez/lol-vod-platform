import { useState, useEffect, useRef } from "react";
import { VODWebSocketClient } from "../../core/websocket";
import type { GameStats, PlayerData } from "../../core/decoder";
import { sileo } from "sileo";

export const useGameStats = (wsUrl: string) => {
  const [stats, setStats] = useState<GameStats | null>(null);
  const wsClientRef = useRef<VODWebSocketClient | null>(null);
  const prevPlayersRef = useRef<PlayerData[]>([]);

  // NUEVO: Control para no saturar al servidor con peticiones redundantes
  const lastSentTimeRef = useRef<number>(-1);

  // 1. Efecto de Conexión WebSocket
  useEffect(() => {
    wsClientRef.current = new VODWebSocketClient(wsUrl);

    wsClientRef.current.subscribe((newStats) => {
      setStats(newStats);
    });

    wsClientRef.current.connect();

    return () => {
      // wsClientRef.current?.disconnect();
    };
  }, [wsUrl]);

  // 2. Efecto del Observador de Inventario (Notificaciones)
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

  // 3. Función para enviar el tiempo actual al backend (Refactorizada)
  const updateServerTime = (currentTime: number) => {
    if (!wsClientRef.current) return;

    // Convertimos el float del video (ej. 45.123) a un entero estricto (45)
    const currentSecond = Math.floor(currentTime);

    // Solo enviamos el payload a Go si el segundo ha cambiado.
    // Esto reduce el tráfico de red de ~60 peticiones/seg a solo 1 petición/seg.
    if (currentSecond !== lastSentTimeRef.current) {
      wsClientRef.current.sendMessage({ time: currentSecond });
      lastSentTimeRef.current = currentSecond;
    }
  };

  return { stats, updateServerTime };
};
