// Diccionario de Ítems (Extraído de Riot Data Dragon para tu partida de prueba)
export const ITEM_MAP: Record<number, string> = {
  1001: "Botas de Velocidad",
  1018: "Capa de Agilidad",
  1028: "Cristal de Rubí",
  1037: "Pico",
  1038: "Espadón",
  1042: "Daga",
  1052: "Tomo Amplificador",
  1058: "Vara Innecesariamente Grande",
  2503: "Cinturón del Gigante",
  3111: "Botas de Mercurio",
  3802: "Capítulo Perdido",
  6631: "Chupasangre",
  6655: "Tempestad de Luden",
};

// Mock temporal para los participantes (1-5 Equipo Azul, 6-10 Equipo Rojo)
// Nota Técnica: En un entorno de producción, este mapeo debería venir de
// la base de datos basándose en el draft inicial de la partida.
export const CHAMPION_MAP: Record<number, string> = {
  // Equipo Azul
  1: "Gwen (TOP)",
  2: "Lee Sin (JGL)",
  3: "Ahri (MID)",
  4: "Jinx (ADC)",
  5: "Nautilus (SUP)",
  // Equipo Rojo
  6: "Aatrox (TOP)",
  7: "Viego (JGL)",
  8: "Sylas (MID)",
  9: "Aphelios (ADC)",
  10: "Thresh (SUP)",
};

// Funciones utilitarias exportables
export const getGameItem = (id?: number): string => {
  if (!id) return "-";
  return ITEM_MAP[id] || `Ítem [${id}]`;
};

export const getParticipantName = (id?: number): string => {
  if (!id) return "-";
  return CHAMPION_MAP[id] || `Jugador ${id}`;
};
