import { useState, useEffect, useRef } from "react";
import { VODWebSocketClient } from "../../core/websocket";
import type { GameStats, PlayerData } from "../../core/decoder";
import { sileo } from "sileo";

export const useGameStats = (wsUrl: string) => {
  const [stats, setStats] = useState<GameStats | null>(null);
  const wsClientRef = useRef<VODWebSocketClient | null>(null);
  const prevPlayersRef = useRef<PlayerData[]>([]);

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

  // 3. Función para enviar el tiempo actual al backend
  const updateServerTime = (currentTime: number) => {
    if (wsClientRef.current) {
      wsClientRef.current.sendMessage({ time: currentTime });
    }
  };

  return { stats, updateServerTime };
};
