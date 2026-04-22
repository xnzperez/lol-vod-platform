import { useState } from "react";
import type { PlayerData } from "../../core/decoder";
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
    // Posicionamos el contenedor a la derecha, centrado verticalmente
    <div className="absolute right-4 top-1/4 flex flex-col gap-3 z-50 pointer-events-auto">
      {players.map((player) => {
        const isExpanded = expandedPlayerId === player.id;
        const isT1 = player.id.startsWith("t1"); // Detectamos el equipo para el color

        return (
          <div
            key={player.id}
            className="relative flex items-center justify-end"
          >
            {/* PANEL DE CRISTAL EXPANDIBLE (Aparece hacia la izquierda del avatar) */}
            <div
              className={`absolute right-16 transition-all duration-300 ease-out origin-right overflow-hidden backdrop-blur-md bg-black/40 border border-white/10 rounded-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] ${
                isExpanded
                  ? "w-60 opacity-100 pointer-events-auto scale-100"
                  : "w-0 opacity-0 pointer-events-none scale-95"
              }`}
            >
              <div className="p-3 w-60">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-wide">
                      {player.name}
                    </h3>
                    <p className="text-[10px] text-gray-300 font-medium uppercase">
                      {player.champion}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-black bg-black/60 border border-white/10 px-2 py-1 rounded text-white shadow-inner">
                    {player.kda}
                  </span>
                </div>

                {/* Inventario Compacto */}
                <div className="flex gap-1.5 mt-2">
                  {player.items.map((item, index) => {
                    const imageUrl = getItemImageUrl(item);
                    return imageUrl ? (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={item}
                        className="w-7 h-7 rounded border border-white/20 shadow-md"
                      />
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* AVATAR CIRCULAR SIEMPRE VISIBLE (El botón disparador) */}
            <button
              onClick={() => togglePlayer(player.id)}
              className={`relative w-12 h-12 rounded-full p-0.5 transition-transform duration-200 hover:scale-110 z-10 shadow-lg ${
                isExpanded
                  ? isT1
                    ? "bg-blue-500"
                    : "bg-red-500"
                  : "bg-white/20 backdrop-blur-sm"
              }`}
            >
              <img
                src={getChampionImageUrl(player.champion)}
                alt={player.champion}
                className="w-full h-full rounded-full object-cover border-2 border-black/80"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
};
