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
    setExpandedPlayerId(expandedPlayerId === id ? null : id);
  };

  if (!players || players.length !== 10) return null;

  const blueTeam = players.slice(0, 5);
  const redTeam = players.slice(5, 10);

  const renderTeam = (team: PlayerData[], isBlue: boolean) => (
    <div
      className={`flex flex-col gap-2 p-4 rounded-xl border ${isBlue ? "bg-blue-950/20 border-blue-900/50" : "bg-red-950/20 border-red-900/50"}`}
    >
      <h3
        className={`text-xs font-bold uppercase tracking-widest mb-2 ${isBlue ? "text-blue-400" : "text-red-400"}`}
      >
        {isBlue ? "Equipo Azul" : "Equipo Rojo"}
      </h3>
      <div className="flex justify-between gap-2">
        {team.map((player) => {
          const isExpanded = expandedPlayerId === player.id;
          return (
            <div
              key={player.id}
              className="relative flex flex-col items-center"
            >
              {/* Avatar Clickable */}
              <button
                onClick={() => togglePlayer(player.id)}
                className={`w-12 h-12 rounded-full p-0.5 transition-transform hover:scale-110 shadow-lg ${
                  isExpanded
                    ? isBlue
                      ? "bg-blue-500"
                      : "bg-red-500"
                    : "bg-slate-700"
                }`}
              >
                <img
                  src={getChampionImageUrl(player.champion)}
                  alt={player.champion}
                  className="w-full h-full rounded-full object-cover border-2 border-slate-900"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              </button>

              {/* Panel Desplegable (Debajo del Avatar) */}
              <div
                className={`absolute top-14 w-48 z-10 transition-all duration-200 ease-out origin-top backdrop-blur-md bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl overflow-hidden ${
                  isExpanded
                    ? "scale-100 opacity-100 pointer-events-auto"
                    : "scale-95 opacity-0 pointer-events-none"
                }`}
              >
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate w-24">
                        {player.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 uppercase">
                        {player.champion}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-white">
                      {player.kda}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {player.items.map((item, index) => {
                      const imageUrl = getItemImageUrlById(item);
                      return imageUrl ? (
                        <img
                          key={index}
                          src={imageUrl}
                          alt="item"
                          className="w-6 h-6 rounded border border-slate-700"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      ) : null;
                    })}
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {renderTeam(blueTeam, true)}
      {renderTeam(redTeam, false)}
    </div>
  );
};
