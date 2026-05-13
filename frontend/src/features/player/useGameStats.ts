import { useState, useEffect, useRef } from "react";
import { VODWebSocketClient } from "../../core/websocket";
import type { PlayerData } from "../../core/decoder"; // NUEVO: Importamos el tipado de los jugadores

// NUEVO CONTRATO: Refleja el struct ProcessedFrame de Go + la data de los jugadores
export interface MatchFrameData {
  minute: number;
  blueTeamGold: number;
  redTeamGold: number;
  goldDifference: number;
  winProbability: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[] | null;
  players?: PlayerData[]; // NUEVO: Agregado para que TypeScript lo reconozca y permita pasarlo al PlayerPanel
}

export const useGameStats = (wsUrl: string) => {
  const [stats, setStats] = useState<MatchFrameData | null>(null);
  const wsClientRef = useRef<VODWebSocketClient | null>(null);
  const lastSentTimeRef = useRef<number>(-1);

  // 1. Efecto de Conexión WebSocket
  useEffect(() => {
    wsClientRef.current = new VODWebSocketClient(wsUrl);

    wsClientRef.current.subscribe((newStats: MatchFrameData) => {
      console.log("[HOOK DEBUG] Datos recibidos del cliente WS:", newStats);
      setStats(newStats);
    });

    wsClientRef.current.connect();

    return () => {
      // Buena práctica: desconectar al desmontar para evitar memory leaks
      if (wsClientRef.current) {
        // wsClientRef.current.disconnect();
      }
    };
  }, [wsUrl]);

  // 2. Función para enviar el tiempo actual al backend
  const updateServerTime = (currentTime: number) => {
    if (!wsClientRef.current) return;

    const currentSecond = Math.floor(currentTime);

    // Throttling: 1 petición por segundo
    if (currentSecond !== lastSentTimeRef.current) {
      wsClientRef.current.sendMessage({ time: currentSecond });
      lastSentTimeRef.current = currentSecond;
    }
  };

  return { stats, updateServerTime };
};
