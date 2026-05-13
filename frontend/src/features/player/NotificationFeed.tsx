import { useEffect, useState } from "react";
import {
  getChampionImageUrl,
  getItemImageUrlById,
} from "../../core/datadragon";

interface EventDTO {
  type: string;
  participantId?: number;
  itemId?: number;
  killerId?: number;
  victimId?: number;
}

interface NotificationFeedProps {
  events: EventDTO[];
  championMap: Record<number, string>;
}

export function NotificationFeed({
  events,
  championMap,
}: NotificationFeedProps) {
  const [activeNotifications, setActiveNotifications] = useState<EventDTO[]>(
    [],
  );

  useEffect(() => {
    if (events && events.length > 0) {
      setActiveNotifications(events);

      const timer = setTimeout(() => {
        setActiveNotifications([]);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [events]);

  if (activeNotifications.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      {activeNotifications.map((evt, idx) => {
        // 1. EVENTO DE COMPRA
        if (evt.type === "ITEM_PURCHASED" && evt.participantId && evt.itemId) {
          const champName = championMap[evt.participantId] || "Desconocido";

          return (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-700/50 p-2 rounded-lg flex items-center gap-3 animate-fade-in-right"
            >
              <img
                src={getChampionImageUrl(champName)}
                alt={champName}
                className="w-8 h-8 rounded-full border border-slate-600"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-xs text-slate-300 font-bold truncate">
                  {champName}
                </span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Compró un objeto
                </span>
              </div>
              <img
                src={getItemImageUrlById(evt.itemId)}
                alt={`Item ${evt.itemId}`}
                className="w-8 h-8 rounded border border-amber-500/30"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          );
        }

        // 2. EVENTO DE ASESINATO
        if (evt.type === "CHAMPION_KILL" && evt.killerId && evt.victimId) {
          const killerName = championMap[evt.killerId] || "Desconocido";
          const victimName = championMap[evt.victimId] || "Desconocido";

          return (
            <div
              key={idx}
              className="bg-red-950/40 border border-red-900/50 p-2 rounded-lg flex items-center justify-between animate-fade-in-right"
            >
              <div className="flex flex-col items-center gap-1 w-1/3">
                <img
                  src={getChampionImageUrl(killerName)}
                  alt={killerName}
                  className="w-8 h-8 rounded-full border-2 border-red-500"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <span className="text-[10px] text-slate-300 font-mono truncate w-full text-center">
                  {killerName}
                </span>
              </div>

              <div className="flex flex-col items-center w-1/3">
                <span className="text-xs text-red-500 font-bold">⚔️ KILL</span>
              </div>

              <div className="flex flex-col items-center gap-1 w-1/3">
                <img
                  src={getChampionImageUrl(victimName)}
                  alt={victimName}
                  className="w-8 h-8 rounded-full border border-slate-600 grayscale opacity-75"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <span className="text-[10px] text-slate-500 font-mono truncate w-full text-center">
                  {victimName}
                </span>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
