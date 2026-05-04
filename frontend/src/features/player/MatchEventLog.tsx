import { useEffect, useState, useRef } from "react";

// 1. Tipado exacto del Payload que envía tu backend en Go
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

// 2. Tipado de lo que necesita la Interfaz de Usuario (UI)
interface UIEvent {
  id: string;
  time: string;
  side: string;
  player: string;
  action: string;
  target: string;
}

interface MatchEventLogProps {
  currentStats: GameStats | null;
}

// Helper para determinar el lado: 1-5 Azul, 6-10 Rojo
const getSide = (id?: number) => (id && id <= 5 ? "blue" : "red");

export function MatchEventLog({ currentStats }: MatchEventLogProps) {
  const [eventLog, setEventLog] = useState<UIEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Acumulador y Parseador de eventos
  useEffect(() => {
    if (
      !currentStats ||
      !currentStats.events ||
      currentStats.events.length === 0
    )
      return;

    const currentMinute = currentStats.minute;

    // 3. Adapter: Transformar DTO crudo a estructura UI
    const newUIEvents: UIEvent[] = currentStats.events.map((raw, index) => {
      let player = "-";
      let target = "-";
      let action = raw.type;
      let side = "blue";

      if (raw.type === "CHAMPION_KILL") {
        action = "Asesinato ⚔️";
        player = `Jugador ${raw.killerId}`;
        target = `Jugador ${raw.victimId}`;
        side = getSide(raw.killerId);
      } else if (raw.type === "ITEM_PURCHASED") {
        action = "Compra 💰";
        player = `Jugador ${raw.participantId}`;
        target = `Ítem ID: ${raw.itemId}`;
        side = getSide(raw.participantId);
      }

      return {
        // Generamos un ID compuesto para deduplicar (Minuto + Tipo + Actores + Index)
        id: `${currentMinute}-${raw.type}-${raw.killerId || raw.participantId}-${raw.victimId || raw.itemId}-${index}`,
        time: `Min ${currentMinute}`, // Usamos el minuto como marca de tiempo temporal
        side,
        player,
        action,
        target,
      };
    });

    setEventLog((prev) => {
      // 4. Filtro estricto anti-duplicación del WebSocket
      const prevIds = new Set(prev.map((e) => e.id));
      const uniqueNewEvents = newUIEvents.filter((e) => !prevIds.has(e.id));

      if (uniqueNewEvents.length === 0) return prev; // Si no hay nada nuevo, abortar render
      return [...prev, ...uniqueNewEvents];
    });
  }, [currentStats]);

  // Efecto para auto-scroll
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
        className="relative overflow-y-auto rounded-lg border border-slate-700/50 flex-1"
        ref={scrollRef}
      >
        <table className="w-full text-xs text-left text-slate-400">
          <thead className="text-[10px] uppercase bg-slate-800/80 text-slate-300 sticky top-0 backdrop-blur-sm shadow-sm z-10">
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
              <th scope="col" className="px-4 py-3">
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
                  className="border-b border-slate-800/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {ev.time}
                  </td>
                  <td className="px-4 py-3 flex justify-center">
                    <div
                      className={`w-3 h-3 rounded-sm shadow-sm ${ev.side === "blue" ? "bg-blue-500 shadow-blue-500/50" : "bg-red-500 shadow-red-500/50"}`}
                    ></div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200">
                    {ev.player}
                  </td>
                  <td className="px-4 py-3">{ev.action}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono">
                    {ev.target}
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
