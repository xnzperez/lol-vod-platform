import { useEffect, useState } from "react";
import { useAuth } from "../core/AuthContext";
import { Link } from "react-router-dom";
import { supabase } from "../core/supabaseClient";
import { AddVodForm } from "../features/dashboard/AddVodForm";

interface MatchRecord {
  match_id: string;
  title?: string;
  region?: string;
}

export function DashboardView() {
  const { user } = useAuth();
  const [allMatches, setAllMatches] = useState<MatchRecord[]>([]);
  const [savedMatchIds, setSavedMatchIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Estados de UI
  const [activeTab, setActiveTab] = useState<"all" | "saved" | "add">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");

  // EXTRAÍDO: Lógica de consulta a Supabase
  const fetchMatches = async () => {
    if (!user) return;
    setLoading(true);

    const { data: globalMatches, error: globalError } = await supabase
      .from("matches_data")
      .select("match_id, title, region")
      .order("created_at", { ascending: false });

    const { data: savedMatches, error: savedError } = await supabase
      .from("user_saved_matches")
      .select("match_id")
      .eq("user_id", user.id);

    if (!globalError && globalMatches) {
      setAllMatches(globalMatches);
    }

    if (!savedError && savedMatches) {
      const ids = new Set(savedMatches.map((m) => m.match_id));
      setSavedMatchIds(ids);
    }

    setLoading(false);
  };

  // Se ejecuta al montar el componente
  useEffect(() => {
    fetchMatches();
  }, [user]);

  // NUEVO: Se ejecuta cuando AddVodForm termina con éxito
  const handleVodAdded = () => {
    fetchMatches(); // Recarga los datos silenciosamente
    setActiveTab("all"); // Cambia la pestaña para mostrar el nuevo VOD
  };

  // Filtro combinado (Pestaña + Búsqueda + Región)
  const displayedMatches = allMatches.filter((match) => {
    const matchesTab = activeTab === "all" || savedMatchIds.has(match.match_id);
    const matchesTitle = match.title
      ? match.title.toLowerCase().includes(searchTerm.toLowerCase())
      : match.match_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion =
      regionFilter === "all" || match.region === regionFilter;

    return matchesTab && matchesTitle && matchesRegion;
  });

  return (
    <main className="mx-auto max-w-7xl p-6 animate-fade-in">
      <div className="mb-6 border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Panel de Control
          </h1>
          <p className="text-slate-400 mt-2">
            Bienvenido,{" "}
            <span className="text-blue-400 font-mono">{user?.email}</span>.
            Selecciona un VOD procesado para analizar su telemetría.
          </p>
        </div>

        {/* Controles de Búsqueda y Filtro */}
        {activeTab !== "add" && (
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar VOD o ID..."
              className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:border-blue-500 outline-none flex-1 min-w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              <option value="all">Todas las Regiones</option>
              <option value="americas">Americas</option>
              <option value="europe">Europe</option>
              <option value="asia">Asia</option>
            </select>
          </div>
        )}
      </div>

      {/* Sistema de Pestañas con la opción de Agregar */}
      <div className="flex flex-wrap gap-4 mb-6">
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
        <button
          onClick={() => setActiveTab("add")}
          className={`px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ml-auto ${
            activeTab === "add"
              ? "bg-green-600 text-white shadow-lg shadow-green-500/20"
              : "bg-slate-800/50 text-green-500 border border-green-900/50 hover:bg-slate-700 hover:text-green-400"
          }`}
        >
          ➕ Indexar VOD
        </button>
      </div>

      {/* RENDERIZADO CONDICIONAL: Muestra formulario o grilla dependiendo de la pestaña */}
      {activeTab === "add" ? (
        <AddVodForm onSuccess={handleVodAdded} />
      ) : loading ? (
        <div className="text-slate-500 font-mono animate-pulse">
          Sincronizando base de datos...
        </div>
      ) : displayedMatches.length === 0 ? (
        <div className="text-slate-500 italic p-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
          {activeTab === "all"
            ? "No hay partidas que coincidan con tu búsqueda."
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

                  {match.region && (
                    <span className="absolute top-3 right-3 bg-blue-600/80 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-tighter text-white shadow-sm backdrop-blur-sm z-10">
                      {match.region}
                    </span>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-blue-600/80 group-hover:bg-blue-500 flex items-center justify-center transition-colors shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                      <span className="text-white ml-1">▶</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
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
                    title={match.title || match.match_id}
                  >
                    {match.title || match.match_id}
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
