import {
  getChampionImageUrl,
  getItemImageUrlById,
} from "../../core/datadragon";
import type { PlayerData } from "../../core/decoder";

interface FinalScoreboardProps {
  players: PlayerData[];
}

export function FinalScoreboardPanel({ players }: FinalScoreboardProps) {
  // Verificación de seguridad
  if (!players || players.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 italic border border-dashed border-slate-700 rounded-xl mt-4">
        No hay datos de jugadores disponibles para este VOD.
      </div>
    );
  }

  const blueTeam = players.slice(0, 5);
  const redTeam = players.slice(5, 10);
  const roles = ["TOP", "JGL", "MID", "ADC", "SUP"];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-700 rounded-xl overflow-hidden shadow-2xl mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Encabezado de Equipos */}
      <div className="flex text-[10px] font-black uppercase tracking-[0.3em] bg-black/40 border-b border-slate-800">
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
              {/* BLOQUE AZUL */}
              <div className="flex-1 flex items-center gap-3 p-3 border-r border-slate-800/50 bg-blue-500/5">
                <div className="relative shrink-0">
                  <img
                    src={blueP ? getChampionImageUrl(blueP.champion) : ""}
                    className="w-12 h-12 rounded-lg border border-blue-500/30 object-cover"
                    alt="champ"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="truncate font-bold text-slate-200 text-sm">
                      {blueP?.name || "Desconocido"}
                    </span>
                    <span className="font-mono text-[11px] text-blue-400 font-bold ml-2">
                      {blueP?.kda}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {blueP?.items.map((itemId, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 bg-black/40 rounded border border-slate-700 overflow-hidden"
                      >
                        <img
                          src={getItemImageUrlById(itemId)}
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

              {/* BLOQUE ROJO */}
              <div className="flex-1 flex items-center gap-3 p-3 flex-row-reverse text-right bg-red-500/5">
                <div className="relative shrink-0">
                  <img
                    src={redP ? getChampionImageUrl(redP.champion) : ""}
                    className="w-12 h-12 rounded-lg border border-red-500/30 object-cover"
                    alt="champ"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1 flex-row-reverse">
                    <span className="truncate font-bold text-slate-200 text-sm">
                      {redP?.name || "Desconocido"}
                    </span>
                    <span className="font-mono text-[11px] text-red-400 font-bold mr-2">
                      {redP?.kda}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-row-reverse">
                    {redP?.items.map((itemId, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 bg-black/40 rounded border border-slate-700 overflow-hidden"
                      >
                        <img
                          src={getItemImageUrlById(itemId)}
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
