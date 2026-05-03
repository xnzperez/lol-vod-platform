interface MatchScoreboardProps {
  stats: {
    minute: number;
    blueTeamGold: number;
    redTeamGold: number;
    goldDifference: number;
    winProbability: number;
  } | null;
}

export function MatchScoreboard({ stats }: MatchScoreboardProps) {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">
          Estado de la Partida
        </h3>
        <div className="bg-slate-800 px-3 py-1 rounded text-sm font-mono text-slate-300 border border-slate-600">
          Minuto {stats.minute}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Equipo Azul */}
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 flex flex-col items-center justify-center">
          <span className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-1">
            Equipo Azul
          </span>
          <span className="text-3xl font-bold text-white font-mono">
            {formatGold(stats.blueTeamGold)}
          </span>
        </div>

        {/* Equipo Rojo */}
        <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 flex flex-col items-center justify-center">
          <span className="text-red-400 text-sm font-semibold uppercase tracking-widest mb-1">
            Equipo Rojo
          </span>
          <span className="text-3xl font-bold text-white font-mono">
            {formatGold(stats.redTeamGold)}
          </span>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mt-2">
        <div className="text-center mb-2">
          <span className="text-sm text-slate-400 uppercase tracking-wider">
            Diferencia de Oro
          </span>
        </div>
        <div
          className={`text-center text-2xl font-bold font-mono ${blueAdvantage ? "text-blue-400" : "text-red-400"}`}
        >
          {absDiff === 0
            ? "Empate"
            : `+${formatGold(absDiff)} ${blueAdvantage ? "Azul" : "Rojo"}`}
        </div>
      </div>
    </div>
  );
}
