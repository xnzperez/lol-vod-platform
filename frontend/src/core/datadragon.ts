// Definimos la versión actual de la API de Data Dragon
// (En producción, esto se obtendría dinámicamente, pero para el VOD usaremos una versión fija)
const D_DRAGON_VERSION = "14.6.1";
const BASE_URL = `https://ddragon.leagueoflegends.com/cdn/${D_DRAGON_VERSION}/img`;

// 1. DICCIONARIO DE OBJETOS (Mapper O(1))
// Como Riot usa IDs numéricos, creamos un mapa estático para traducir nuestros strings.
// Aquí agregamos los objetos que pusimos en nuestro timeline.json.
const itemDictionary: Record<string, string> = {
  Zhonya: "3157",
  Rabadon: "3089",
  VoidStaff: "3135",
  Stopwatch: "2420",
  Ludens: "6655",
  Shadowflame: "4645",
  Banshee: "3102",
};

/**
 * Retorna la URL oficial de la imagen cuadrada del Campeón.
 * @param championName Nombre del campeón (Ej. "Sylas")
 */
export const getChampionImageUrl = (championName: string): string => {
  // Algunos campeones tienen caracteres especiales en la API, pero para Sylas y Ahri el nombre directo funciona.
  return `${BASE_URL}/champion/${championName}.png`;
};

/**
 * Retorna la URL oficial de la imagen del Objeto.
 * Si el objeto no existe en nuestro diccionario, retorna una imagen vacía o un placeholder.
 * @param itemName Nombre del objeto en texto (Ej. "Zhonya")
 */
export const getItemImageUrl = (itemName: string): string | null => {
  const itemId = itemDictionary[itemName];

  if (!itemId) {
    console.warn(
      `[Data Dragon] Objeto '${itemName}' no encontrado en el diccionario.`,
    );
    return null;
  }

  return `${BASE_URL}/item/${itemId}.png`;
};
