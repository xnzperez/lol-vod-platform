import { useState, useEffect, useRef } from "react";
import { sileo } from "sileo";
import { VODWebSocketClient } from "../../core/websocket";
import type { PlayerData } from "../../core/decoder";

export interface MatchFrameData {
  minute: number;
  blueTeamGold: number;
  redTeamGold: number;
  goldDifference: number;
  winProbability: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: any[] | null;
  players?: PlayerData[];
}

export const useGameStats = (wsUrl: string) => {
  const [stats, setStats] = useState<MatchFrameData | null>(null);
  const wsClientRef = useRef<VODWebSocketClient | null>(null);
  const lastSentTimeRef = useRef<number>(-1);

  useEffect(() => {
    wsClientRef.current = new VODWebSocketClient(wsUrl);

    wsClientRef.current.subscribe((newStats: MatchFrameData) => {
      setStats((prevStats) => {
        // Estabilidad de Estado: Evitar re-renderizar si los datos clave son idénticos
        if (
          prevStats &&
          prevStats.minute === newStats.minute &&
          prevStats.blueTeamGold === newStats.blueTeamGold &&
          prevStats.redTeamGold === newStats.redTeamGold &&
          prevStats.goldDifference === newStats.goldDifference &&
          prevStats.winProbability === newStats.winProbability
        ) {
          return prevStats;
        }
        return newStats;
      });
    });

    wsClientRef.current.onError((err: string) => {
      sileo.error({ title: "¡SE PERDIÓ LA CONEXIÓN CON EL SERVIDOR!" });
    });

    wsClientRef.current.connect();

    return () => {
      // Cleanup para evitar memory leaks (asumiendo que se implemente close() en el futuro o si se requiere)
      if (wsClientRef.current) {
        // wsClientRef.current.disconnect();
      }
    };
  }, [wsUrl]);

  const updateServerTime = (currentTime: number) => {
    if (!wsClientRef.current) return;

    // Throttling: solo enviamos cuando cambia el segundo entero
    const currentSecond = Math.floor(currentTime);

    if (currentSecond !== lastSentTimeRef.current) {
      wsClientRef.current.sendMessage({ time: currentSecond });
      lastSentTimeRef.current = currentSecond;
    }
  };

  return { stats, updateServerTime };
};
