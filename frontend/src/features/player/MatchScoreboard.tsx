import React from "react";

interface MatchScoreboardProps {
  stats: {
    minute: number;
    blueTeamGold: number;
    redTeamGold: number;
    goldDifference: number;
    winProbability: number;
  } | null;
}

const Scoreboard = ({ stats }: MatchScoreboardProps) => {
  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 italic animate-pulse">
        Esperando telemetría del servidor...
      </div>
    );
  }

  // Formateador de oro (ej. 7500 -> 7.5k)
  const formatGold = (gold: number) => (gold / 1000).toFixed(1) + "k";

  // Determinar quién tiene la ventaja
  const blueAdvantage = stats.goldDifference > 0;
  const absDiff = Math.abs(stats.goldDifference);
  
  // Dynamic glow and gradient classes
  const advantageColorVar = blueAdvantage ? "var(--color-primary)" : "var(--color-danger)";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center border-b pb-4" style={{ borderColor: "var(--color-gold)" }}>
        <h3 className="text-lg font-bold uppercase tracking-wider" style={{ color: "var(--color-gold)", textShadow: "0 0 10px var(--color-gold)" }}>
          Estado de la Partida
        </h3>
        <div className="px-3 py-1 rounded text-sm font-mono border" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
          Minuto {stats.minute}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Equipo Azul */}
        <div className="rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--color-primary)" }}>
          <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-[var(--color-primary)] to-transparent pointer-events-none" />
          <span className="text-sm font-semibold uppercase tracking-widest mb-1 z-10" style={{ color: "var(--color-primary)" }}>
            Equipo Azul
          </span>
          <span className="text-3xl font-bold text-white font-mono z-10 drop-shadow-md">
            {formatGold(stats.blueTeamGold)}
          </span>
        </div>

        {/* Equipo Rojo */}
        <div className="rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--color-danger)" }}>
          <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-[var(--color-danger)] to-transparent pointer-events-none" />
          <span className="text-sm font-semibold uppercase tracking-widest mb-1 z-10" style={{ color: "var(--color-danger)" }}>
            Equipo Rojo
          </span>
          <span className="text-3xl font-bold text-white font-mono z-10 drop-shadow-md">
            {formatGold(stats.redTeamGold)}
          </span>
        </div>
      </div>

      <div 
        className="rounded-lg p-4 mt-2 relative transition-all duration-300"
        style={{ 
          backgroundColor: "var(--bg-surface)", 
          border: `1px solid ${advantageColorVar}`,
          boxShadow: `0 0 15px -2px ${advantageColorVar}66` // Glow effect
        }}
      >
        <div className="text-center mb-2">
          <span className="text-sm uppercase tracking-wider" style={{ color: "var(--color-gold)" }}>
            Diferencia de Oro
          </span>
        </div>
        <div
          className="text-center text-2xl font-bold font-mono transition-colors duration-300"
          style={{ 
            color: advantageColorVar,
            textShadow: `0 0 8px ${advantageColorVar}` 
          }}
        >
          {absDiff === 0
            ? "Empate"
            : `+${formatGold(absDiff)} ${blueAdvantage ? "Azul" : "Rojo"}`}
        </div>
      </div>
    </div>
  );
};

// React.memo con función de comparación para rendimiento
export const MatchScoreboard = React.memo(Scoreboard, (prevProps, nextProps) => {
  if (prevProps.stats === nextProps.stats) return true;
  if (!prevProps.stats || !nextProps.stats) return false;
  
  // Solo renderiza si la diferencia de oro o el minuto cambian significativamente
  return (
    prevProps.stats.minute === nextProps.stats.minute &&
    prevProps.stats.goldDifference === nextProps.stats.goldDifference
  );
});
