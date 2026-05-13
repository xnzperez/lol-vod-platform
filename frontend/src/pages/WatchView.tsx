import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../core/supabaseClient";
import { VideoPlayer } from "../features/player/VideoPlayer";
import { MatchScoreboard } from "../features/player/MatchScoreboard";
import { useGameStats } from "../features/player/useGameStats";
import { NotificationFeed } from "../features/player/NotificationFeed";
import { MatchTimeline } from "../features/player/MatchTimeline";
import { MatchEventLog } from "../features/player/MatchEventLog";
import { useAuth } from "../core/AuthContext";
import { FinalScoreboardPanel } from "../features/player/FinalScoreboardPanel";
import type { PlayerData } from "../core/decoder";

export function WatchView() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();

  const [videoConfig, setVideoConfig] = useState<{
    id: string;
    offset: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [championMap, setChampionMap] = useState<Record<number, string>>({});
  const [matchPlayers, setMatchPlayers] = useState<PlayerData[]>([]);

  // 1. ACUMULADOR DE TELEMETRÍA (Para procesar lo que manda Go)
  const [liveTelemetry, setLiveTelemetry] = useState<
    Record<string, { kda: string; items: string[] }>
  >({});

  const { stats, updateServerTime } = useGameStats(
    `${import.meta.env.VITE_WS_URL}/ws/stats?match_id=${matchId}`,
  );

  // 2. MOTOR DE EVENT SOURCING: Calcula KDA e Items desde los eventos del WS
  useEffect(() => {
    if (stats?.events && Array.isArray(stats.events)) {
      const currentStats: Record<string, { k; d; a; items: string[] }> = {};

      // Inicializamos a los 10
      for (let i = 1; i <= 10; i++) {
        currentStats[String(i)] = { k: 0, d: 0, a: 0, items: [] };
      }

      // Procesamos la lista de eventos que manda tu backend en Go
      stats.events.forEach((ev: any) => {
        const pId = String(ev.participantId || ev.killerId);
        const vId = String(ev.victimId);

        if (ev.type === "CHAMPION_KILL") {
          if (currentStats[pId]) currentStats[pId].k += 1;
          if (currentStats[vId]) currentStats[vId].d += 1;
          if (ev.assistantIds) {
            ev.assistantIds.forEach((id: number) => {
              if (currentStats[String(id)]) currentStats[String(id)].a += 1;
            });
          }
        } else if (ev.type === "ITEM_PURCHASED" && ev.itemId) {
          if (currentStats[pId])
            currentStats[pId].items.push(String(ev.itemId));
        } else if (
          (ev.type === "ITEM_SOLD" || ev.type === "ITEM_DESTROYED") &&
          ev.itemId
        ) {
          if (currentStats[pId]) {
            const index = currentStats[pId].items.indexOf(String(ev.itemId));
            if (index > -1) currentStats[pId].items.splice(index, 1);
          }
        }
      });

      // Formateamos para el componente visual
      const formatted: Record<string, { kda: string; items: string[] }> = {};
      Object.keys(currentStats).forEach((id) => {
        const p = currentStats[id];
        formatted[id] = {
          kda: `${p.k}/${p.d}/${p.a}`,
          items: p.items,
        };
      });

      setLiveTelemetry(formatted);
    }
  }, [stats?.events]);

  useEffect(() => {
    async function fetchMatchData() {
      setLoading(true);
      const { data: matchData, error: matchError } = await supabase
        .from("matches_data")
        .select("vod_url, start_time_offset, match_info")
        .eq("match_id", matchId)
        .single();

      if (matchData) {
        const youtubeId =
          matchData.vod_url.split("v=")[1]?.split("&")[0] ||
          matchData.vod_url.split("/").pop();
        setVideoConfig({
          id: youtubeId || "",
          offset: matchData.start_time_offset,
        });

        if (matchData.match_info?.info?.participants) {
          const map: Record<number, string> = {};
          const list: PlayerData[] = matchData.match_info.info.participants.map(
            (p: any) => {
              map[p.participantId] = p.championName;
              return {
                id: p.participantId.toString(),
                name:
                  p.riotIdGameName ||
                  p.summonerName ||
                  `Jugador ${p.participantId}`,
                champion: p.championName,
                kda: "0/0/0", // Base estática
                items: [],
              };
            },
          );
          setChampionMap(map);
          setMatchPlayers(list);
        }
      }
      setLoading(false);
    }
    fetchMatchData();
  }, [matchId]);

  const toggleSaveMatch = async () => {
    /* ... misma lógica anterior ... */
  };

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse text-slate-500 font-mono">
        Consultando base de datos...
      </div>
    );
  if (!videoConfig)
    return (
      <div className="p-10 text-center text-red-400">
        Partida no encontrada.
      </div>
    );

  // 3. FUSIÓN: Si el WS tiene data nueva de eventos, la priorizamos sobre el 0/0/0 de Supabase
  const displayPlayers = matchPlayers.map((p) => ({
    ...p,
    kda: liveTelemetry[p.id]?.kda || p.kda,
    items: liveTelemetry[p.id]?.items || p.items,
  }));

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
          Análisis de VOD
        </h1>
        <button
          onClick={toggleSaveMatch}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest"
        >
          {isSaved ? "Quitar de Guardados" : "⭐ Guardar VOD"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black ring-1 ring-slate-800 shadow-2xl relative">
            <VideoPlayer
              videoId={videoConfig.id}
              startTimeOffset={videoConfig.offset}
              onTimeUpdate={updateServerTime}
            />
          </div>

          <MatchTimeline currentStats={stats} />
          <MatchEventLog currentStats={stats} championMap={championMap} />

          <div className="pt-4 mt-8 border-t border-slate-800/50 pb-20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 px-2">
              Estadísticas Finales de la Partida
            </h2>
            {/* USAMOS LA DATA FUSIONADA AQUÍ */}
            {displayPlayers.length > 0 && (
              <FinalScoreboardPanel players={displayPlayers} />
            )}
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-5 max-h-[85vh] sticky top-20 flex flex-col">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>{" "}
            Panel de Telemetría
          </h2>
          <div className="text-sm text-slate-400 shrink-0">
            <MatchScoreboard stats={stats} />
          </div>
          <div className="mt-6 flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {stats?.events && (
                <NotificationFeed
                  events={stats.events}
                  championMap={championMap}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
