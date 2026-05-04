import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../core/supabaseClient";
import { VideoPlayer } from "../features/player/VideoPlayer";
import { MatchScoreboard } from "../features/player/MatchScoreboard";
import { useGameStats } from "../features/player/useGameStats";
import { NotificationFeed } from "../features/player/NotificationFeed";
import { MatchTimeline } from "../features/player/MatchTimeline"; // NUEVA IMPORTACIÓN
import { useAuth } from "../core/AuthContext";

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

  const { stats, updateServerTime } = useGameStats(
    `ws://localhost:8080/ws/stats?match_id=${matchId}`,
  );

  console.log("DTO DEL BACKEND:", JSON.stringify(stats, null, 2));

  useEffect(() => {
    async function fetchMatchData() {
      setLoading(true);

      const { data: matchData, error: matchError } = await supabase
        .from("matches_data")
        .select("vod_url, start_time_offset")
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
        {/* Columna Principal (Video + Gráfico) */}
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

          {/* NUEVO: Inyección del gráfico de telemetría */}
          <MatchTimeline currentStats={stats} />
        </div>

        {/* Columna Lateral (Scoreboard) */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-800 p-5 h-[600px] overflow-y-auto">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Panel de Telemetría
          </h2>
          <div className="text-sm text-slate-400">
            <MatchScoreboard stats={stats} />
          </div>
        </div>
      </div>
    </main>
  );
}
