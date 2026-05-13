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
import { PlayerPanel } from "../features/player/PlayerPanel";
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

  // LÓGICA MAESTRA: Acumulador para retener la telemetría en vivo
  const [liveTelemetry, setLiveTelemetry] = useState<
    Record<string, { kda: string; items: string[] }>
  >({});

  const { stats, updateServerTime } = useGameStats(
    `${import.meta.env.VITE_WS_URL}/ws/stats?match_id=${matchId}`,
  );

  // EFECTO CORREGIDO: Construir KDA e Inventario leyendo los EVENTOS de Go
  useEffect(() => {
    if (stats?.events && Array.isArray(stats.events)) {
      // 1. Inicializamos un tablero en blanco para los 10 jugadores
      const currentTelemetry: Record<
        string,
        { kills: number; deaths: number; assists: number; items: string[] }
      > = {};

      for (let i = 1; i <= 10; i++) {
        currentTelemetry[String(i)] = {
          kills: 0,
          deaths: 0,
          assists: 0,
          items: [],
        };
      }

      // 2. Procesamos la historia exacta que manda Go en ese minuto
      stats.events.forEach((ev: any) => {
        if (ev.type === "CHAMPION_KILL") {
          if (ev.killerId) currentTelemetry[String(ev.killerId)].kills += 1;
          if (ev.victimId) currentTelemetry[String(ev.victimId)].deaths += 1;
          // Si Go manda asistencias, se suman aquí
          if (ev.assistantIds && Array.isArray(ev.assistantIds)) {
            ev.assistantIds.forEach((aId: number) => {
              currentTelemetry[String(aId)].assists += 1;
            });
          }
        } else if (ev.type === "ITEM_PURCHASED") {
          if (ev.participantId && ev.itemId) {
            currentTelemetry[String(ev.participantId)].items.push(
              String(ev.itemId),
            );
          }
        } else if (ev.type === "ITEM_SOLD" || ev.type === "ITEM_DESTROYED") {
          if (ev.participantId && ev.itemId) {
            const idx = currentTelemetry[
              String(ev.participantId)
            ].items.indexOf(String(ev.itemId));
            if (idx > -1)
              currentTelemetry[String(ev.participantId)].items.splice(idx, 1);
          }
        }
      });

      // 3. Lo formateamos a texto (ej: "1/0/0") para que el PlayerPanel lo entienda
      const newLiveTelemetry: Record<string, { kda: string; items: string[] }> =
        {};
      Object.keys(currentTelemetry).forEach((id) => {
        const p = currentTelemetry[id];
        newLiveTelemetry[id] = {
          kda: `${p.kills}/${p.deaths}/${p.assists}`,
          items: p.items,
        };
      });

      // 4. Inyectamos los datos calculados a la UI
      setLiveTelemetry(newLiveTelemetry);
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

      if (matchError) {
        console.error("DEBUG SUPABASE ERROR:", matchError.message);
      } else if (matchData) {
        const youtubeId =
          matchData.vod_url.split("v=")[1]?.split("&")[0] ||
          matchData.vod_url.split("/").pop();
        setVideoConfig({
          id: youtubeId || "",
          offset: matchData.start_time_offset,
        });

        if (
          matchData.match_info &&
          matchData.match_info.info &&
          matchData.match_info.info.participants
        ) {
          const map: Record<number, string> = {};
          const playersList: PlayerData[] = [];

          matchData.match_info.info.participants.forEach((p: any) => {
            map[p.participantId] = p.championName;

            playersList.push({
              id: p.participantId.toString(),
              name:
                p.riotIdGameName ||
                p.summonerName ||
                `Jugador ${p.participantId}`,
              champion: p.championName,
              kda: `${p.kills ?? 0}/${p.deaths ?? 0}/${p.assists ?? 0}`,
              items: [
                p.item0,
                p.item1,
                p.item2,
                p.item3,
                p.item4,
                p.item5,
                p.item6,
              ]
                .filter((itemId) => itemId && itemId > 0)
                .map(String),
            });
          });

          setChampionMap(map);
          setMatchPlayers(playersList);
        }
      }

      if (user && matchId) {
        const { data: savedData, error: savedError } = await supabase
          .from("user_saved_matches")
          .select("id")
          .eq("user_id", user.id)
          .eq("match_id", matchId)
          .maybeSingle();

        if (!savedError && savedData) {
          setIsSaved(true);
        }
      }

      setLoading(false);
    }

    fetchMatchData();
  }, [matchId, user]);

  const toggleSaveMatch = async () => {
    if (!user || !matchId) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await supabase
          .from("user_saved_matches")
          .delete()
          .eq("user_id", user.id)
          .eq("match_id", matchId);
        setIsSaved(false);
      } else {
        await supabase
          .from("user_saved_matches")
          .insert([{ user_id: user.id, match_id: matchId }]);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error al procesar el guardado:", error);
    } finally {
      setIsSaving(false);
    }
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
        Partida no encontrada en los registros.
      </div>
    );

  // FUSIÓN DE DATOS: Unimos los avatares estáticos con la telemetría dinámica retenida
  const displayPlayers = matchPlayers.map((p) => ({
    ...p,
    kda:
      liveTelemetry[p.id]?.kda && liveTelemetry[p.id].kda !== "0/0/0"
        ? liveTelemetry[p.id].kda
        : p.kda,
    items:
      liveTelemetry[p.id]?.items && liveTelemetry[p.id].items.length > 0
        ? liveTelemetry[p.id].items
        : p.items,
  }));

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
          Análisis de VOD
        </h1>
        <button
          onClick={toggleSaveMatch}
          disabled={isSaving}
          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
            isSaved
              ? "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-red-400 hover:border-red-500/50"
              : "bg-blue-600 text-white border-blue-500 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSaving
            ? "Procesando..."
            : isSaved
              ? "Quitar de Guardados"
              : "⭐ Guardar VOD"}
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

          {/* Renderizado con los datos fusionados (Nunca parpadeará a vacío) */}
          {displayPlayers.length > 0 && (
            <PlayerPanel players={displayPlayers} />
          )}

          <MatchTimeline currentStats={stats} />
          <MatchEventLog currentStats={stats} championMap={championMap} />
        </div>

        <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-5 max-h-[85vh] sticky top-20 flex flex-col">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Panel de Telemetría
          </h2>
          <div className="text-sm text-slate-400 shrink-0">
            <MatchScoreboard stats={stats} />
          </div>
          <div className="mt-6 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-700/50 pb-2 shrink-0">
              Eventos en Tiempo Real
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {stats && stats.events ? (
                <NotificationFeed
                  events={stats.events}
                  championMap={championMap}
                />
              ) : (
                <div className="text-slate-600 text-xs text-center py-4 italic">
                  Esperando eventos...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
