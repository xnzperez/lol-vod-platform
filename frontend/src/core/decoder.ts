// 1. Interfaces Crudas (Lo que llega ofuscado del backend)
export interface RawPlayerData {
  id: string;
  n: string; // Nombre
  c: string; // Campeón
  kda: string;
  i: string[]; // Ítems
}

export interface RawStatsPayload {
  t: number;
  g_d: number;
  d_t: number;
  b_t: number;
  p_d: RawPlayerData[]; // Arreglo de jugadores crudo
}

// 2. Interfaces de Dominio (Lo que usa React)
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
  players: PlayerData[];
}

// 3. Función Traductora
export function decodePayload(rawMessage: string): GameStats | null {
  try {
    const parsed = JSON.parse(rawMessage) as RawStatsPayload;

    // Mapeamos el arreglo de jugadores para limpiar sus claves
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
      players: cleanPlayers,
    };
  } catch (error) {
    console.error("[DECODER] Error al parsear el payload:", error);
    return null;
  }
}
