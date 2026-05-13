import { useEffect, useState, useRef } from "react";
// Importamos Data Dragon en lugar del viejo diccionario
import {
  getChampionImageUrl,
  getItemImageUrlById,
} from "../../core/datadragon";

interface RawEvent {
  type: string;
  killerId?: number;
  victimId?: number;
  participantId?: number;
  itemId?: number;
}

interface GameStats {
  minute: number;
  events: RawEvent[] | null;
}

// Actualizamos la interfaz para manejar datos que nos sirvan para renderizar imágenes
interface UIEvent {
  id: string;
  time: string;
  side: string;
  playerChamp: string; // Nombre del campeón para buscar su imagen
  action: string;
  targetItem?: number; // ID del ítem
  targetChamp?: string; // Nombre de la víctima
}

interface MatchEventLogProps {
  currentStats: GameStats | null;
  championMap: Record<number, string>;
}

const getSide = (id?: number) => (id && id <= 5 ? "blue" : "red");

export function MatchEventLog({
  currentStats,
  championMap,
}: MatchEventLogProps) {
  const [eventLog, setEventLog] = useState<UIEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !currentStats ||
      !currentStats.events ||
      currentStats.events.length === 0
    )
      return;

    const currentMinute = currentStats.minute;

    const newUIEvents: UIEvent[] = currentStats.events.map((raw, index) => {
      let playerChamp = "-";
      let action = raw.type;
      let targetChamp: string | undefined = undefined;
      let targetItem: number | undefined = undefined;
      let side = "blue";

      if (raw.type === "CHAMPION_KILL") {
        action = "Asesinato";
        playerChamp = raw.killerId
          ? championMap[raw.killerId] || "Desconocido"
          : "-";
        targetChamp = raw.victimId
          ? championMap[raw.victimId] || "Desconocido"
          : undefined;
        side = getSide(raw.killerId);
      } else if (raw.type === "ITEM_PURCHASED") {
        action = "Compra";
        playerChamp = raw.participantId
          ? championMap[raw.participantId] || "Desconocido"
          : "-";
        targetItem = raw.itemId;
        side = getSide(raw.participantId);
      }

      return {
        id: `${currentMinute}-${raw.type}-${raw.killerId || raw.participantId}-${raw.victimId || raw.itemId}-${index}`,
        time: `Min ${currentMinute}`,
        side,
        playerChamp,
        action,
        targetItem,
        targetChamp,
      };
    });

    setEventLog((prev) => {
      const prevIds = new Set(prev.map((e) => e.id));
      const uniqueNewEvents = newUIEvents.filter((e) => !prevIds.has(e.id));

      if (uniqueNewEvents.length === 0) return prev;
      return [...prev, ...uniqueNewEvents];
    });
  }, [currentStats, championMap]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [eventLog]);

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-5 h-80 flex flex-col mt-6">
      <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest shrink-0">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        ⚔️ Registro de Eventos
      </h2>

      <div
        className="relative overflow-y-auto rounded-lg border border-slate-700/50 flex-1 custom-scrollbar"
        ref={scrollRef}
      >
        <table className="w-full text-xs text-left text-slate-400">
          <thead className="text-[10px] uppercase bg-slate-900/80 text-slate-300 sticky top-0 backdrop-blur-md shadow-sm z-10">
            <tr>
              <th scope="col" className="px-4 py-3">
                Tiempo
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Lado
              </th>
              <th scope="col" className="px-4 py-3">
                Jugador
              </th>
              <th scope="col" className="px-4 py-3 text-center">
                Acción
              </th>
              <th scope="col" className="px-4 py-3">
                Objetivo
              </th>
            </tr>
          </thead>
          <tbody>
            {eventLog.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500 italic"
                >
                  Esperando eventos de la partida...
                </td>
              </tr>
            ) : (
              eventLog.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-b border-slate-800/50 hover:bg-slate-800/80 transition-colors"
                >
                  {/* TIEMPO */}
                  <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                    {ev.time}
                  </td>

                  {/* LADO (Punto de color) */}
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shadow-sm ${ev.side === "blue" ? "bg-blue-500 shadow-blue-500/50" : "bg-red-500 shadow-red-500/50"}`}
                      ></div>
                    </div>
                  </td>

                  {/* JUGADOR (Avatar + Nombre) */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {ev.playerChamp !== "-" && (
                        <img
                          src={getChampionImageUrl(ev.playerChamp)}
                          alt={ev.playerChamp}
                          className="w-6 h-6 rounded-full border border-slate-600"
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                        />
                      )}
                      <span className="font-semibold text-slate-200">
                        {ev.playerChamp}
                      </span>
                    </div>
                  </td>

                  {/* ACCIÓN (Tag visual) */}
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ev.action === "Asesinato"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {ev.action}
                    </span>
                  </td>

                  {/* OBJETIVO (Avatar Víctima o Icono de Ítem) */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {ev.action === "Asesinato" && ev.targetChamp && (
                        <>
                          <img
                            src={getChampionImageUrl(ev.targetChamp)}
                            alt={ev.targetChamp}
                            className="w-6 h-6 rounded-full border border-slate-600 grayscale opacity-80"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                          <span className="text-slate-400 font-mono">
                            {ev.targetChamp}
                          </span>
                        </>
                      )}
                      {ev.action === "Compra" && ev.targetItem && (
                        <>
                          <img
                            src={getItemImageUrlById(ev.targetItem)}
                            alt={`Item ${ev.targetItem}`}
                            className="w-6 h-6 rounded border border-slate-600 shadow-sm"
                            onError={(e) =>
                              (e.currentTarget.style.display = "none")
                            }
                          />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
