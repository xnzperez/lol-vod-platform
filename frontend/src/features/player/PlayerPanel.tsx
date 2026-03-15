import { useState } from "react";
import type { PlayerData } from "../../core/decoder";

interface PlayerPanelProps {
  players: PlayerData[]; // Recibimos el arreglo de jugadores desde el backend
}

export const PlayerPanel = ({ players }: PlayerPanelProps) => {
  // 1. ESTADO LOCAL: Guardamos el ID del jugador al que el usuario le hace clic.
  // Inicia en 'null' porque al principio ningún panel de objetos está abierto.
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // 2. LÓGICA DE INTERACCIÓN: Alternar el panel
  const togglePlayer = (id: string) => {
    // Si clickeamos al jugador que ya está abierto, lo cerramos (null).
    // Si clickeamos a uno nuevo, guardamos su ID para abrir su panel.
    setExpandedPlayerId(expandedPlayerId === id ? null : id);
  };

  // Si aún no hay datos sincronizados, no renderizamos nada (evita errores en pantalla)
  if (!players || players.length === 0) return null;

  return (
    // 3. CONTENEDOR PRINCIPAL: Posicionado a la derecha del video.
    // CRÍTICO: 'pointer-events-auto' permite que el usuario pueda hacer clic aquí,
    // contrarrestando el 'pointer-events-none' del contenedor padre en App.tsx.
    <div className="absolute right-5 top-20 flex flex-col gap-4 z-50 pointer-events-auto">
      {/* 4. MAPEO DE DATOS: Iteramos sobre el arreglo de Faker y Knight */}
      {players.map((player) => (
        <div
          key={player.id}
          onClick={() => togglePlayer(player.id)}
          className="w-64 bg-[#0d1117]/90 border border-[#30363d] rounded-lg p-4 backdrop-blur-md cursor-pointer transition-all hover:border-gray-500 shadow-lg shadow-black/50"
        >
          {/* --- CABECERA DEL JUGADOR (Siempre visible) --- */}
          <div className="flex justify-between items-center border-b border-[#30363d] pb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-100">{player.name}</h3>
              <p className="text-sm text-gray-400">{player.champion}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">
                {player.kda}
              </span>
            </div>
          </div>

          {/* --- PANEL DE INVENTARIO (Renderizado Condicional) --- */}
          {/* Esta sección SOLO existe en el DOM si el ID del jugador coincide con el estado */}
          {expandedPlayerId === player.id && (
            <div className="mt-3">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Inventario Actual
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {/* Mapeamos el arreglo de strings de los items ("Zhonya", "Rabadon", etc.) */}
                {player.items.map((item, index) => (
                  <span
                    key={index}
                    className="text-xs bg-indigo-900/40 text-indigo-200 border border-indigo-700/50 px-2 py-1 rounded"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
