import { useState } from "react";
import type { PlayerData } from "../../core/decoder";
import {
  getChampionImageUrl,
  getItemImageUrlById,
} from "../../core/datadragon";

interface PlayerPanelProps {
  players: PlayerData[];
}

export const PlayerPanel = ({ players }: PlayerPanelProps) => {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const togglePlayer = (id: string) => {
    // Si haces clic en el mismo, se cierra. Si es otro, se abre el nuevo.
    setExpandedPlayerId(expandedPlayerId === id ? null : id);
  };

  if (!players || players.length !== 10) return null;

  const blueTeam = players.slice(0, 5);
  const redTeam = players.slice(5, 10);

  const renderTeam = (team: PlayerData[], isBlue: boolean) => (
    <div
      className={`flex flex-col gap-2 p-4 rounded-xl border transition-colors ${
        isBlue
          ? "bg-blue-950/20 border-blue-900/50"
          : "bg-red-950/20 border-red-900/50"
      }`}
    >
      <h3
        className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isBlue ? "text-blue-400" : "text-red-400"}`}
      >
        {isBlue ? "✦ Equipo Azul" : "✦ Equipo Rojo"}
      </h3>
      <div className="flex justify-between gap-2">
        {team.map((player) => {
          const isExpanded = expandedPlayerId === player.id;
          return (
            <div
              key={player.id}
              className="relative flex flex-col items-center"
            >
              {/* Avatar del Campeón */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Evita que el clic llegue al backdrop
                  togglePlayer(player.id);
                }}
                className={`relative w-12 h-12 rounded-full p-0.5 transition-all duration-300 z-50 ${
                  isExpanded
                    ? isBlue
                      ? "bg-blue-500 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                      : "bg-red-500 scale-110 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                    : "bg-slate-700 hover:bg-slate-500 scale-100"
                }`}
              >
                <img
                  src={getChampionImageUrl(player.champion)}
                  alt={player.champion}
                  className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                />
              </button>

              {/* Detalle Expandible */}
              <div
                className={`absolute top-16 w-56 z-[60] transition-all duration-300 ease-out origin-top backdrop-blur-xl bg-slate-900/95 border border-slate-700/50 rounded-xl shadow-2xl ${
                  isExpanded
                    ? "scale-100 opacity-100 translate-y-0"
                    : "scale-90 opacity-0 -translate-y-4 pointer-events-none"
                }`}
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white leading-none mb-1">
                        {player.name}
                      </h4>
                      <p className="text-[10px] text-blue-400 font-mono uppercase tracking-tighter">
                        {player.champion}
                      </p>
                    </div>
                    <span className="text-[10px] font-black bg-black/40 px-2 py-1 rounded border border-white/5 text-slate-300">
                      {player.kda}
                    </span>
                  </div>

                  <div className="grid grid-cols-6 gap-1 mt-3 pt-3 border-t border-white/5">
                    {player.items.map((item, index) => (
                      <img
                        key={index}
                        src={getItemImageUrlById(item)}
                        alt="item"
                        className="w-full aspect-square rounded bg-slate-800 border border-white/10 hover:border-amber-500/50 transition-colors"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="relative w-full mt-4">
      {/* BACKDROP: Si hay algo expandido, esta capa invisible captura el clic fuera para cerrar */}
      {expandedPlayerId && (
        <div
          className="fixed inset-0 z-[40] cursor-default"
          onClick={() => setExpandedPlayerId(null)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderTeam(blueTeam, true)}
        {renderTeam(redTeam, false)}
      </div>
    </div>
  );
};
