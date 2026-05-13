import { useState } from "react";
import { useAuth } from "../../core/AuthContext";
import { sileo } from "sileo";
import { Clock, Search, Hash, Map, Video, Crosshair, Trophy, Activity, Flame } from "lucide-react";

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
    region: "americas",
    matchId: "",
    vodUrl: "",
    offset: 0,
  });
  
  const [offsetInput, setOffsetInput] = useState("00:00");
  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [foundMatches, setFoundMatches] = useState<MatchSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleRegionChange = (newRegion: string) => {
    setFormData((prev) => ({ ...prev, region: newRegion }));
    setFoundMatches([]);
  };

  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9:]/g, "");
    
    if (val.length === 2 && !val.includes(":")) {
        if (offsetInput.length < val.length) {
            val += ":";
        }
    }
    
    setOffsetInput(val);

    const parts = val.split(":");
    let totalSeconds = 0;
    if (parts.length === 2) {
      const min = parseInt(parts[0]) || 0;
      const sec = parseInt(parts[1]) || 0;
      totalSeconds = min * 60 + sec;
    } else if (parts.length === 1) {
      totalSeconds = parseInt(parts[0]) || 0;
    }
    
    setFormData((prev) => ({ ...prev, offset: totalSeconds }));
  };

  const handleSearchMatches = async () => {
    if (!searchName || !searchTag) {
      sileo.error({
        title: "CAMPOS INCOMPLETOS",
        description: "Debes ingresar el Riot ID y el Tag.",
      });
      return;
    }

    setIsSearching(true);
    setFoundMatches([]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/search-matches?name=${encodeURIComponent(
          searchName,
        )}&tag=${encodeURIComponent(searchTag)}&region=${formData.region}`,
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setFoundMatches(data.matches);
      sileo.success({
        title: "BÚSQUEDA EXITOSA",
        description: `Historial de ${formData.region.toUpperCase()} sincronizado.`,
      });
    } catch (error: any) {
      sileo.error({ title: "ERROR DE BÚSQUEDA", description: error.message });
      setFoundMatches([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      sileo.error({
        title: "ERROR DE AUTENTICACIÓN",
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
        title: "PARTIDA SINCRONIZADA",
        description: "La telemetría está lista para el análisis.",
      });

      setFormData({
        title: "",
        region: "americas",
        matchId: "",
        vodUrl: "",
        offset: 0,
      });
      setOffsetInput("00:00");
      setFoundMatches([]);
      onSuccess();
    } catch (error: any) {
      sileo.error({ title: "ERROR DE REGISTRO", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[--bg-surface] p-6 rounded-xl border border-white/5 mb-8 max-w-3xl mx-auto shadow-2xl relative overflow-hidden group">
      {/* Hextech Accents */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[--color-primary] to-transparent opacity-50"></div>
      <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[--color-primary] to-transparent opacity-20"></div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#c9d1d9] uppercase tracking-tighter flex items-center justify-center gap-2">
          <Activity className="w-6 h-6 text-[--color-primary]" />
          Sincronizar Telemetría
        </h2>
        <p className="text-slate-400 text-xs mt-2 font-medium tracking-wide">
          VINCULA DATOS DE RIOT GAMES CON METRAJE DE VOD
        </p>
      </div>

      <div className="mb-8 p-5 bg-black/20 border border-white/5 rounded-lg relative">
        <div className="absolute -left-[1px] top-4 w-[3px] h-8 bg-[--color-primary] shadow-[0_0_10px_var(--color-primary)] rounded-r-full"></div>
        <h3 className="text-xs font-black text-slate-300 mb-4 uppercase tracking-widest ml-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-[--color-primary]" />
          Paso 1: Localizar Partida
        </h3>

        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Map className="w-4 h-4 text-slate-500" />
              </div>
              <select
                value={formData.region}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full sm:w-auto bg-[#0d1117] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[--color-primary] cursor-pointer transition-all appearance-none"
              >
                <option value="americas">Americas (NA/LAN/LAS/BR)</option>
                <option value="europe">Europe (EUW/EUNE)</option>
                <option value="asia">Asia (KR/JP)</option>
              </select>
            </div>

            <div className="flex-1 relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Crosshair className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Riot ID (ej: Faker)"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[--color-primary] transition-all"
              />
            </div>

            <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Tag (ej: T1)"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="w-full sm:w-32 bg-[#0d1117] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[--color-primary] transition-all"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearchMatches}
            disabled={isSearching}
            className="w-full bg-[#1c232d] border border-white/10 hover:border-[--color-primary]/50 hover:bg-[#222b36] text-[--color-primary] font-bold py-2.5 rounded-lg text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <span className="animate-pulse flex items-center gap-2">
                <Search className="w-4 h-4 animate-spin" /> Consultando Riot API...
              </span>
            ) : (
              <>
                <Search className="w-4 h-4" /> Buscar Historial
              </>
            )}
          </button>
        </div>

        {foundMatches?.length > 0 && (
          <div className="grid grid-cols-1 gap-2 mt-6 animate-in slide-in-from-bottom-2 duration-300">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 flex items-center gap-2">
               <Trophy className="w-3 h-3 text-[--color-gold]" />
               Resultados Recientes
            </p>
            {foundMatches.map((m) => {
              const isSelected = formData.matchId === m.matchId;
              const isWin = m.win;

              return (
                <button
                  key={m.matchId}
                  type="button"
                  onClick={() => setFormData({ ...formData, matchId: m.matchId })}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left group
                    ${
                      isSelected
                        ? `bg-[--color-primary]/10 border-[--color-primary] shadow-[0_0_15px_rgba(0,163,255,0.15)]`
                        : isWin 
                          ? `bg-green-500/5 border-green-500/20 hover:border-green-500/50`
                          : `bg-red-500/5 border-red-500/20 hover:border-red-500/50`
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex flex-col items-center justify-center w-8 h-8 rounded bg-black/50 border ${isWin ? 'border-green-500/30' : 'border-red-500/30'}`}
                    >
                      <span className={`text-[10px] font-black ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                        {isWin ? 'V' : 'D'}
                      </span>
                    </div>
                    <div>
                      <p className={`text-sm font-black uppercase transition-colors ${isSelected ? 'text-[--color-primary]' : 'text-white group-hover:text-gray-200'}`}>
                        {m.champion}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono tracking-tight flex items-center gap-1">
                        <Hash className="w-2.5 h-2.5" />
                        {m.matchId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-xs font-black text-slate-300 tracking-wider bg-black/40 px-2 py-0.5 rounded border border-white/5">
                      {m.kills} <span className="text-slate-600">/</span> <span className="text-red-400">{m.deaths}</span> <span className="text-slate-600">/</span> {m.assists}
                    </p>
                    <p className="text-[9px] uppercase tracking-widest text-slate-500 mt-1 font-bold">
                      {m.gameMode}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="relative">
         <div className="absolute -left-[25px] top-4 w-[3px] h-8 bg-[--color-primary] shadow-[0_0_10px_var(--color-primary)] rounded-r-full"></div>
         <h3 className="text-xs font-black text-slate-300 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Video className="w-4 h-4 text-[--color-primary]" />
            Paso 2: Datos del VOD
         </h3>

         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input
                  required
                  type="text"
                  placeholder="Título (ej: Faker T1 vs GenG)"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[--color-primary] transition-colors"
                />
              </div>

              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="w-4 h-4 text-[--color-primary]" />
                 </div>
                 <input
                  required
                  type="text"
                  placeholder="00:00"
                  value={offsetInput}
                  onChange={handleOffsetChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-[--color-primary] text-sm font-mono focus:outline-none focus:border-[--color-primary] transition-colors shadow-inner"
                />
                <span className="absolute right-3 top-3.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Offset (MM:SS)
                </span>
              </div>
            </div>

            <div className="px-1 mb-2">
              <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                 <Flame className="w-3 h-3 text-orange-500" />
                 <strong className="text-slate-300">Sincronización de Partida:</strong> Ajusta el tiempo exacto donde termina el Draft y comienza la partida (ej: 07:15).
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Video className="w-4 h-4 text-slate-500" />
              </div>
              <input
                required
                type="url"
                placeholder="URL del VOD en YouTube (ej: https://youtube.com/watch?v=...)"
                value={formData.vodUrl}
                onChange={(e) => setFormData({ ...formData, vodUrl: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[--color-primary] transition-colors"
              />
            </div>

            <button
              disabled={loading || !formData.matchId}
              className="w-full mt-6 bg-gradient-to-r from-[--color-primary] to-[#005180] hover:shadow-[0_0_20px_var(--color-primary)] text-white font-black py-4 rounded-lg text-xs transition-all disabled:opacity-30 disabled:hover:shadow-none disabled:cursor-not-allowed uppercase tracking-[0.2em] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" /> PROCESANDO TELEMETRÍA...
                  </>
                ) : (
                  <>
                    <Crosshair className="w-4 h-4" /> CONFIRMAR E INDEXAR PARTIDA
                  </>
                )}
              </span>
            </button>
         </form>
      </div>
    </div>
  );
}
