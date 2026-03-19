// 1. Interfaces Crudas
export interface RawPlayerData {
  id: string;
  n: string;
  c: string;
  kda: string;
  i: string[];
}

export interface RawStatsPayload {
  t: number;
  g_d: number;
  d_t: number;
  b_t: number;
  w_p: number; // NUEVO: Probabilidad de victoria que llega de Go
  p_d: RawPlayerData[];
}

// 2. Interfaces de Dominio
export interface PlayerData {
  id: string;
  name: string;
  champion: string;
  kda: string;
  items: string[];
}

export interface GameStats {
  timestamp: number;
  goldDifference: number;
  dragonTimer: number;
  baronTimer: number;
  winProbability: number; // NUEVO: Para usar en React
  players: PlayerData[];
}

// 3. Función Traductora
export function decodePayload(rawMessage: string): GameStats | null {
  try {
    const parsed = JSON.parse(rawMessage) as RawStatsPayload;

    const cleanPlayers = parsed.p_d
      ? parsed.p_d.map((player) => ({
          id: player.id,
          name: player.n,
          champion: player.c,
          kda: player.kda,
          items: player.i,
        }))
      : [];

    return {
      timestamp: parsed.t,
      goldDifference: parsed.g_d,
      dragonTimer: parsed.d_t,
      baronTimer: parsed.b_t,
      winProbability: parsed.w_p, // Inyectamos el nuevo dato
      players: cleanPlayers,
    };
  } catch (error) {
    console.error("[DECODER] Error al parsear el payload:", error);
    return null;
  }
}
