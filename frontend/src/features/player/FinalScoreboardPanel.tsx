import {
  getChampionImageUrl,
  getItemImageUrlById,
} from "../../core/datadragon";
import type { PlayerData } from "../../core/decoder";

interface FinalScoreboardProps {
  players: PlayerData[];
}

export function FinalScoreboardPanel({ players }: FinalScoreboardProps) {
  if (!players || players.length === 0) return null;

  const blueTeam = players.slice(0, 5);
  const redTeam = players.slice(5, 10);
  const roles = ["TOP", "JGL", "MID", "ADC", "SUP"];

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex text-[10px] font-black uppercase tracking-[0.3em] bg-black/20 border-b border-slate-800">
        <div className="flex-1 p-3 text-blue-400 text-center border-r border-slate-800">
          Blue Side
        </div>
        <div className="flex-1 p-3 text-red-400 text-center">Red Side</div>
      </div>

      <div className="flex flex-col">
        {roles.map((_, idx) => {
          const blueP = blueTeam[idx];
          const redP = redTeam[idx];

          return (
            <div
              key={idx}
              className="flex border-b border-slate-800/50 last:border-0"
            >
              {/* LADO AZUL */}
              <div className="flex-1 flex items-center gap-3 p-3 border-r border-slate-800/50">
                <div className="w-10 h-10 shrink-0 bg-slate-800 rounded overflow-hidden border border-slate-700">
                  {blueP?.champion && (
                    <img
                      src={getChampionImageUrl(blueP.champion)}
                      className="w-full h-full object-cover"
                      alt="champ"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="truncate font-bold text-slate-300 text-xs">
                      {blueP?.name || `Jugador ${idx + 1}`}
                    </span>
                    <span className="font-mono text-[10px] text-blue-500 font-bold ml-2">
                      {blueP?.kda || "0/0/0"}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {(blueP?.items || []).map((item, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 bg-black/40 rounded border border-slate-800"
                      >
                        <img
                          src={getItemImageUrlById(item)}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.style.visibility = "hidden")
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* LADO ROJO */}
              <div className="flex-1 flex items-center gap-3 p-3 flex-row-reverse text-right">
                <div className="w-10 h-10 shrink-0 bg-slate-800 rounded overflow-hidden border border-slate-700">
                  {redP?.champion && (
                    <img
                      src={getChampionImageUrl(redP.champion)}
                      className="w-full h-full object-cover"
                      alt="champ"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1 flex-row-reverse">
                    <span className="truncate font-bold text-slate-300 text-xs">
                      {redP?.name || `Jugador ${idx + 6}`}
                    </span>
                    <span className="font-mono text-[10px] text-red-500 font-bold mr-2">
                      {redP?.kda || "0/0/0"}
                    </span>
                  </div>
                  <div className="flex gap-0.5 flex-row-reverse">
                    {(redP?.items || []).map((item, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 bg-black/40 rounded border border-slate-800"
                      >
                        <img
                          src={getItemImageUrlById(item)}
                          className="w-full h-full object-cover"
                          onError={(e) =>
                            (e.currentTarget.style.visibility = "hidden")
                          }
                        />
                      </div>
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
