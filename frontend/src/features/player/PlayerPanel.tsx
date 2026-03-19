import { useState } from "react";
import type { PlayerData } from "../../core/decoder";
// 1. Importamos nuestro servicio traductor de Data Dragon
import { getChampionImageUrl, getItemImageUrl } from "../../core/datadragon";

interface PlayerPanelProps {
  players: PlayerData[];
}

export const PlayerPanel = ({ players }: PlayerPanelProps) => {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const togglePlayer = (id: string) => {
    setExpandedPlayerId(expandedPlayerId === id ? null : id);
  };

  if (!players || players.length === 0) return null;

  return (
    <div className="absolute right-5 top-20 flex flex-col gap-4 z-50 pointer-events-auto">
      {players.map((player) => (
        <div
          key={player.id}
          onClick={() => togglePlayer(player.id)}
          className="w-72 bg-[#0d1117]/90 border border-[#30363d] rounded-lg p-4 backdrop-blur-md cursor-pointer transition-all hover:border-gray-500 shadow-lg shadow-black/50"
        >
          {/* --- CABECERA DEL JUGADOR (Con Imagen del Campeón) --- */}
          <div className="flex justify-between items-center border-b border-[#30363d] pb-3">
            <div className="flex items-center gap-3">
              {/* 2. Inyectamos la imagen del Campeón */}
              <img
                src={getChampionImageUrl(player.champion)}
                alt={player.champion}
                className="w-12 h-12 rounded-full border-2 border-indigo-500/50 object-cover"
                // Fallback por si la imagen falla al cargar
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div>
                <h3 className="text-lg font-bold text-gray-100">
                  {player.name}
                </h3>
                <p className="text-sm text-gray-400">{player.champion}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">
                {player.kda}
              </span>
            </div>
          </div>

          {/* --- PANEL DE INVENTARIO (Con Iconos Reales) --- */}
          {expandedPlayerId === player.id && (
            <div className="mt-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Inventario Actual
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {player.items.map((item, index) => {
                  // 3. Traducimos el nombre del objeto a su URL oficial
                  const imageUrl = getItemImageUrl(item);

                  return imageUrl ? (
                    // Si existe la URL, mostramos la imagen de Riot
                    <img
                      key={index}
                      src={imageUrl}
                      alt={item}
                      title={item} // Muestra el nombre al pasar el mouse
                      className="w-8 h-8 rounded border border-[#30363d] shadow-sm"
                    />
                  ) : (
                    // Fallback visual: Si Riot no tiene el item, mostramos el texto como antes
                    <span
                      key={index}
                      className="text-xs bg-indigo-900/40 text-indigo-200 border border-indigo-700/50 px-2 py-1 rounded flex items-center h-8"
                    >
                      {item}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
