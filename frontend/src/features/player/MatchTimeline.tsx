import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Tipado estricto basado en el DTO de Go
interface GameStats {
  minute: number;
  blueTeamGold: number;
  redTeamGold: number;
  goldDifference: number;
  winProbability: number;
}

interface MatchTimelineProps {
  currentStats: GameStats | null;
}

export function MatchTimeline({ currentStats }: MatchTimelineProps) {
  // Arreglo acumulador para construir la línea de tiempo
  const [chartData, setChartData] = useState<GameStats[]>([]);

  useEffect(() => {
    if (!currentStats) return;

    setChartData((prev) => {
      // 1. Validamos si ya tenemos datos para este minuto específico (evita duplicados si el video se pausa)
      const existingIndex = prev.findIndex(
        (p) => p.minute === currentStats.minute,
      );
      if (existingIndex >= 0) {
        return prev;
      }

      // 2. Insertamos el nuevo punto y garantizamos el orden cronológico
      const newData = [...prev, currentStats];
      return newData.sort((a, b) => a.minute - b.minute);
    });
  }, [currentStats]);

  return (
    <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-5 h-80 w-full mt-6">
      <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
        📊 Gráfico de Ventaja (Oro)
      </h2>
      <div className="h-64 w-full text-xs font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="minute"
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}m`}
            />
            <YAxis
              stroke="#64748b"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                color: "#f8fafc",
                borderRadius: "0.5rem",
              }}
              itemStyle={{ fontWeight: "bold" }}
              labelFormatter={(label) => `Minuto ${label}`}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />
            {/* Las llaves de datos ahora coinciden exactamente con tu backend (blueTeamGold / redTeamGold) */}
            <Line
              type="monotone"
              dataKey="blueTeamGold"
              name="Equipo Azul"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="redTeamGold"
              name="Equipo Rojo"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
