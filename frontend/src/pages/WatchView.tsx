import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../core/supabaseClient";
import { VideoPlayer } from "../features/player/VideoPlayer";
import { WinProbabilityBar } from "../features/player/WinProbabilityBar";
import { useGameStats } from "../features/player/useGameStats";
import { NotificationFeed } from "../features/player/NotificationFeed";

export function WatchView() {
  const { matchId } = useParams<{ matchId: string }>();
  const [videoConfig, setVideoConfig] = useState<{
    id: string;
    offset: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const { stats, updateServerTime } = useGameStats(
    `ws://localhost:8080/ws/stats?match_id=${matchId}`,
  );

  useEffect(() => {
    async function fetchMatchData() {
      setLoading(true);

      const { data, error } = await supabase
        .from("matches_data")
        .select("vod_url, start_time_offset")
        .eq("match_id", matchId)
        .single();

      if (error) {
        console.error(
          "DEBUG SUPABASE ERROR:",
          error.message,
          error.details,
          error.hint,
        );
      }

      if (!data) {
        console.warn(
          "DEBUG SUPABASE DATA:",
          "No se encontró ninguna fila con match_id:",
          matchId,
        );
      } else {
        const youtubeId =
          data.vod_url.split("v=")[1]?.split("&")[0] ||
          data.vod_url.split("/").pop();
        setVideoConfig({
          id: youtubeId || "",
          offset: data.start_time_offset,
        });
      }
      setLoading(false);
    }

    fetchMatchData();
  }, [matchId]);

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse text-slate-500 font-mono">
        Consultando base de datos de Riot...
      </div>
    );
  if (!videoConfig)
    return (
      <div className="p-10 text-center text-red-400">
        Partida no encontrada en los registros.
      </div>
    );

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black ring-1 ring-slate-800 shadow-2xl relative">
            {stats && stats.events && (
              <NotificationFeed events={stats.events} />
            )}
            <VideoPlayer
              videoId={videoConfig.id}
              startTimeOffset={videoConfig.offset}
              onTimeUpdate={updateServerTime}
            />
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mt-4 flex flex-col items-center">
            {stats ? (
              <WinProbabilityBar blueWinProb={stats.winProbability * 100} />
            ) : (
              <span className="text-sm text-slate-500 font-mono italic">
                Sincronizando telemetría de {matchId}...
              </span>
            )}
          </div>
        </div>
        <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-5 h-[600px] overflow-y-auto">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Match Stats: {matchId}
          </h2>
          <div className="text-sm text-slate-400">
            {stats ? (
              <pre className="whitespace-pre-wrap font-mono text-xs text-green-400 bg-black/40 p-3 rounded-lg border border-green-500/20">
                {JSON.stringify(stats, null, 2)}
              </pre>
            ) : (
              <p className="italic text-slate-500">
                Esperando respuesta del servidor en Go...
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
