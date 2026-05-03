import { useEffect, useState } from "react";

// Replicamos la estructura del DTO que configuramos en Go
interface EventDTO {
  type: string;
  participantId?: number;
  itemId?: number;
  killerId?: number;
  victimId?: number;
}

interface NotificationFeedProps {
  events: EventDTO[];
}

export function NotificationFeed({ events }: NotificationFeedProps) {
  const [activeNotifications, setActiveNotifications] = useState<EventDTO[]>(
    [],
  );

  // Efecto para actualizar el feed cuando llegan nuevos eventos del WebSocket
  useEffect(() => {
    if (events && events.length > 0) {
      setActiveNotifications(events);

      // Auto-limpieza: las notificaciones desaparecen después de 5 segundos
      const timer = setTimeout(() => {
        setActiveNotifications([]);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [events]);

  if (activeNotifications.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none w-64">
      {activeNotifications.map((evt, idx) => {
        if (evt.type === "ITEM_PURCHASED") {
          return (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-md animate-fade-in-right flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-amber-500/20 rounded flex items-center justify-center border border-amber-500/50">
                <span className="text-xs">🛒</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-mono">
                  Jugador {evt.participantId}
                </span>
                <span className="text-sm text-white font-semibold">
                  Compró Item {evt.itemId}
                </span>
              </div>
            </div>
          );
        }

        if (evt.type === "CHAMPION_KILL") {
          return (
            <div
              key={idx}
              className="bg-red-900/90 border border-red-700 p-3 rounded-lg shadow-xl backdrop-blur-md animate-fade-in-right flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center border border-red-500/50">
                <span className="text-xs">⚔️</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-mono">
                  Asesinato
                </span>
                <span className="text-sm text-white font-semibold">
                  {evt.killerId} ➔ {evt.victimId}
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
