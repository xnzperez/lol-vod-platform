// 1. Interfaz de Entrada (Lo que llega del Servidor)
// Esto mapea exactamente la ofuscación de la Fase 1.
export interface RawStatsPayload {
  t: number; // Timestamp
  g_d: number; // Gold Difference
  d_t: number; // Dragon Timer
  b_t: number; // Baron Timer
}

// 2. Interfaz de Dominio (Lo que usará nuestro Frontend)
// Nombres limpios, escalables y autodescriptivos para las buenas prácticas.
export interface GameStats {
  timestamp: number;
  goldDifference: number;
  dragonTimer: number;
  baronTimer: number;
}

/**
 * Toma el string crudo del WebSocket, lo parsea y lo traduce al modelo de dominio.
 * Si alguien en la Fase 2 intenta entender el código ofuscado, tendrá que buscar
 * esta función exacta en los Source Maps del navegador.
 */
export function decodePayload(rawMessage: string): GameStats | null {
  try {
    // Parseamos el string de texto a nuestro objeto crudo tipado
    const parsed = JSON.parse(rawMessage) as RawStatsPayload;

    // Mapeamos y retornamos el objeto limpio
    return {
      timestamp: parsed.t,
      goldDifference: parsed.g_d,
      dragonTimer: parsed.d_t,
      baronTimer: parsed.b_t,
    };
  } catch (error) {
    console.error("[DECODER] Error al parsear el payload del servidor:", error);
    return null;
  }
}
