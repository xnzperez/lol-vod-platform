import { useEffect, useState } from "react";
import { useAuth } from "../core/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "../core/supabaseClient";

interface MatchRecord {
  match_id: string;
}

export function DashboardView() {
  const { user } = useAuth();
  const [allMatches, setAllMatches] = useState<MatchRecord[]>([]);
  const [savedMatchIds, setSavedMatchIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // NUEVO: Estado para controlar qué pestaña se está viendo
  const [activeTab, setActiveTab] = useState<"all" | "saved">("all");

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);

      // 1. Consultar TODAS las partidas del sistema
      const { data: globalMatches, error: globalError } = await supabase
        .from("matches_data")
        .select("match_id")
        .order("created_at", { ascending: false });

      // 2. Consultar solo los IDs que el usuario ha guardado
      const { data: savedMatches, error: savedError } = await supabase
        .from("user_saved_matches")
        .select("match_id")
        .eq("user_id", user.id);

      if (!globalError && globalMatches) {
        setAllMatches(globalMatches);
      }

      if (!savedError && savedMatches) {
        // Usamos un Set para búsquedas instantáneas O(1)
        const ids = new Set(savedMatches.map((m) => m.match_id));
        setSavedMatchIds(ids);
      }

      setLoading(false);
    }

    fetchData();
  }, [user]);

  // Filtramos la lista dependiendo de la pestaña activa
  const displayedMatches =
    activeTab === "all"
      ? allMatches
      : allMatches.filter((match) => savedMatchIds.has(match.match_id));

  return (
    <main className="mx-auto max-w-7xl p-6 animate-fade-in">
      <div className="mb-6 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Panel de Control
        </h1>
        <p className="text-slate-400 mt-2">
          Bienvenido,{" "}
          <span className="text-blue-400 font-mono">{user?.email}</span>.
          Selecciona un VOD procesado para analizar su telemetría.
        </p>
      </div>

      {/* NUEVO: Sistema de Pestañas (Tabs) */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "all"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white"
          }`}
        >
          🌐 Explorar Todo
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
            activeTab === "saved"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white"
          }`}
        >
          ⭐ Mis Guardados ({savedMatchIds.size})
        </button>
      </div>

      {loading ? (
        <div className="text-slate-500 font-mono animate-pulse">
          Sincronizando base de datos...
        </div>
      ) : displayedMatches.length === 0 ? (
        <div className="text-slate-500 italic p-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
          {activeTab === "all"
            ? "No hay partidas procesadas en el servidor."
            : "No tienes partidas guardadas en tu perfil."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMatches.map((match) => {
            const isSaved = savedMatchIds.has(match.match_id);

            return (
              <div
                key={match.match_id}
                className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all shadow-lg group relative"
              >
                <div className="aspect-video bg-black relative border-b border-slate-700">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600/80 group-hover:bg-blue-500 flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                      <span className="text-white ml-1">▶</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    {/* Badge dinámico */}
                    {isSaved ? (
                      <span className="text-[10px] font-bold bg-green-900/50 border border-green-700/50 text-green-400 px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1">
                        <span>⭐</span> Guardado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-800 border border-slate-600 text-slate-400 px-2 py-1 rounded uppercase tracking-widest">
                        Público
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-mono">
                      ID: {match.match_id.split("_")[1] || match.match_id}
                    </span>
                  </div>

                  <h3
                    className="text-lg font-semibold text-white mb-4 truncate"
                    title={match.match_id}
                  >
                    {match.match_id}
                  </h3>

                  <Link
                    to={`/watch/${match.match_id}`}
                    className="block w-full text-center bg-slate-700/50 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-xs uppercase tracking-wider border border-slate-600 hover:border-blue-500"
                  >
                    Analizar Telemetría
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
