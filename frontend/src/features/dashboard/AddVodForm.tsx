import { useState } from "react";
import { useAuth } from "../../core/AuthContext";
import { sileo } from "sileo";

interface MatchSummary {
  matchId: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  gameMode: string;
}

interface AddVodFormProps {
  onSuccess: () => void;
}

export function AddVodForm({ onSuccess }: AddVodFormProps) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    region: "americas", // Empieza en Americas, pero lo puedes cambiar arriba
    matchId: "",
    vodUrl: "",
    offset: 0,
  });
  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [foundMatches, setFoundMatches] = useState<MatchSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // LA LÓGICA QUE FALTABA: Actualiza la región global cuando cambias el select del buscador
  const handleRegionChange = (newRegion: string) => {
    setFormData((prev) => ({ ...prev, region: newRegion }));
    setFoundMatches([]); // Limpia la lista porque cambiaste de continente
  };

  const handleSearchMatches = async () => {
    if (!searchName || !searchTag) {
      sileo.error({
        title: "Campos Incompletos",
        description: "Debes ingresar el Riot ID y el Tag.",
      });
      return;
    }

    setIsSearching(true);
    setFoundMatches([]);

    try {
      // Busca exactamente en la región que elegiste en el select
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/search-matches?name=${encodeURIComponent(
          searchName,
        )}&tag=${encodeURIComponent(searchTag)}&region=${formData.region}`,
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setFoundMatches(data.matches);
      sileo.success({
        title: "Búsqueda Exitosa",
        description: `Historial de ${formData.region.toUpperCase()} sincronizado.`,
      });
    } catch (error: any) {
      sileo.error({ title: "Error de Búsqueda", description: error.message });
      setFoundMatches([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      sileo.error({
        title: "Error de Autenticación",
        description: "Sesión no válida.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/matches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, uploaderId: user.id }),
        },
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      sileo.success({
        title: "Partida Indexada",
        description: "VOD procesado correctamente.",
      });

      setFormData({
        title: "",
        region: "americas",
        matchId: "",
        vodUrl: "",
        offset: 0,
      });
      setFoundMatches([]);
      onSuccess();
    } catch (error: any) {
      sileo.error({ title: "Error de Registro", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 mb-8 backdrop-blur-sm max-w-3xl mx-auto animate-fade-in shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-tighter text-blue-400">
          Indexar Nueva Partida
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Vincula telemetría de Riot Games con el metraje de YouTube.
        </p>
      </div>

      {/* SECCIÓN 1: BUSCADOR (CON EL SELECTOR DE REGIÓN CORRECTO) */}
      <div className="mb-8 p-5 bg-slate-900/50 border border-slate-700/50 rounded-lg">
        <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
          1. Buscar Partida Reciente
        </h3>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* EL ÚNICO SELECTOR DE REGIÓN */}
            <select
              value={formData.region}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="americas">Americas (LAN/LAS/NA/BR)</option>
              <option value="europe">Europe (EUW/EUNE)</option>
              <option value="asia">Asia (KR/JP)</option>
            </select>

            <input
              type="text"
              placeholder="Riot ID (ej: Mechs)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-black">#</span>
              <input
                type="text"
                placeholder="Tag"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="w-full sm:w-24 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearchMatches}
            disabled={isSearching}
            className="w-full bg-slate-700 hover:bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 shadow-lg"
          >
            {isSearching ? "Consultando Riot API..." : "Sincronizar Historial"}
          </button>
        </div>

        {foundMatches?.length > 0 && (
          <div className="grid grid-cols-1 gap-2 animate-fade-in">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">
              Partidas encontradas en {formData.region}:
            </p>
            {foundMatches.map((m) => (
              <button
                key={m.matchId}
                type="button"
                onClick={() => setFormData({ ...formData, matchId: m.matchId })}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all group ${
                  formData.matchId === m.matchId
                    ? "bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.1)] scale-[1.01]"
                    : "bg-slate-950/40 border-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${m.win ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444]"}`}
                  ></div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white uppercase group-hover:text-blue-400 transition-colors">
                      {m.champion}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {m.matchId}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-300 italic">
                    {m.kills} / <span className="text-red-400">{m.deaths}</span>{" "}
                    / {m.assists}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">
                    {m.gameMode}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: FORMULARIO DE REGISTRO */}
      <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2">
        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
        2. Datos de Referencia
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            type="text"
            placeholder="Título del análisis (ej: Mechs vs Pro Player)"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />

          {/* INDICADOR DE REGIÓN BLOQUEADA (Espejo del selector de arriba) */}
          <div className="relative group">
            <input
              readOnly
              type="text"
              value={formData.region.toUpperCase()}
              className="w-full bg-slate-900/30 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-500 text-sm font-bold cursor-not-allowed opacity-70"
            />
            <span className="absolute right-3 top-2.5 text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
              Región Fija
            </span>
          </div>

          <input
            required
            type="text"
            placeholder="Selecciona una partida arriba"
            value={formData.matchId}
            readOnly
            className="bg-slate-900/30 border border-slate-800 rounded-lg px-4 py-2.5 text-blue-400/70 text-sm font-mono cursor-not-allowed"
          />

          <input
            required
            type="number"
            placeholder="Offset de Sincronización (s)"
            value={formData.offset}
            onChange={(e) =>
              setFormData({
                ...formData,
                offset: parseInt(e.target.value) || 0,
              })
            }
            className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            title="Segundos que tarda el video en llegar al segundo 0 de la partida real."
          />
        </div>

        <input
          required
          type="url"
          placeholder="URL del VOD en YouTube"
          value={formData.vodUrl}
          onChange={(e) => setFormData({ ...formData, vodUrl: e.target.value })}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />

        <button
          disabled={loading || !formData.matchId}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-widest"
        >
          {loading ? "Indexando datos en DB..." : "Confirmar e Indexar"}
        </button>
      </form>
    </div>
  );
}
