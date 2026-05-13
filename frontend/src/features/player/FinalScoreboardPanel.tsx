import {
  getChampionImageUrl,
  getItemImageUrlById,
} from "../../core/datadragon";
import type { PlayerData } from "../../core/decoder";

interface FinalScoreboardProps {
  players: PlayerData[];
}

export function FinalScoreboardPanel({ players }: FinalScoreboardProps) {
  if (!players || players.length !== 10) return null;

  const blueTeam = players.slice(0, 5);
  const redTeam = players.slice(5, 10);

  const roles = ["TOP", "JGL", "MID", "ADC", "SUP"];

  return (
    <div className="w-full bg-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl mt-6">
      <div className="flex text-xs font-black uppercase tracking-[0.2em] bg-black/60 border-b border-slate-700/50">
        <div className="flex-1 p-3 text-blue-400 text-center border-r border-slate-700/50">
          Equipo Azul
        </div>
        <div className="flex-1 p-3 text-red-400 text-center">Equipo Rojo</div>
      </div>

      <div className="flex flex-col">
        {roles.map((role, idx) => {
          const bluePlayer = blueTeam[idx];
          const redPlayer = redTeam[idx];

          return (
            <div
              key={idx}
              className="flex border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
            >
              {/* JUGADOR AZUL */}
              <div className="flex-1 flex items-center gap-3 p-2 border-r border-slate-800/50">
                <img
                  src={getChampionImageUrl(bluePlayer.champion)}
                  alt={bluePlayer.champion}
                  className="w-10 h-10 rounded border border-blue-900 shadow-sm"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-slate-200 text-sm">
                      {bluePlayer.name}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {bluePlayer.kda}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {bluePlayer.items.map((item, i) => (
                      <img
                        key={i}
                        src={getItemImageUrlById(item)}
                        alt="item"
                        className="w-6 h-6 rounded bg-slate-800 border border-slate-700"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* JUGADOR ROJO */}
              <div className="flex-1 flex items-center gap-3 p-2 flex-row-reverse text-right">
                <img
                  src={getChampionImageUrl(redPlayer.champion)}
                  alt={redPlayer.champion}
                  className="w-10 h-10 rounded border border-red-900 shadow-sm"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div className="flex flex-col flex-1 items-end">
                  <div className="flex justify-between items-center w-full flex-row-reverse">
                    <span className="font-bold text-slate-200 text-sm">
                      {redPlayer.name}
                    </span>
                    <span className="font-mono text-xs text-slate-400">
                      {redPlayer.kda}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1 flex-row-reverse">
                    {redPlayer.items.map((item, i) => (
                      <img
                        key={i}
                        src={getItemImageUrlById(item)}
                        alt="item"
                        className="w-6 h-6 rounded bg-slate-800 border border-slate-700"
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
}
