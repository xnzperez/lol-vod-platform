import { useState } from "react";
import { useAuth } from "../../core/AuthContext";
import { sileo } from "sileo"; // ACTUALIZADO: Importación nombrada

export function AddVodForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    region: "americas",
    matchId: "",
    vodUrl: "",
    offset: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      sileo.error({
        title: "Error de Autenticación",
        description: "Sesión no válida.",
      }); // ACTUALIZADO: Objeto SileoOptions
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
      }); // ACTUALIZADO
      setFormData({
        title: "",
        region: "americas",
        matchId: "",
        vodUrl: "",
        offset: 0,
      });
    } catch (error: any) {
      sileo.error({ title: "Error de Registro", description: error.message }); // ACTUALIZADO
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 mb-8 backdrop-blur-sm max-w-3xl mx-auto animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white uppercase tracking-tighter text-blue-400">
          Indexar Nueva Partida
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Conecta un video de YouTube con la telemetría oficial de Riot Games.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            type="text"
            placeholder="Título (ej: Rankeo vs Grandmaster)"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <select
            value={formData.region}
            onChange={(e) =>
              setFormData({ ...formData, region: e.target.value })
            }
            className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="americas">Americas (LAN/LAS/NA/BR)</option>
            <option value="europe">Europe (EUW/EUNE)</option>
            <option value="asia">Asia (KR/JP)</option>
          </select>
          <input
            required
            type="text"
            placeholder="Riot Match ID (LA1_...)"
            value={formData.matchId}
            onChange={(e) =>
              setFormData({ ...formData, matchId: e.target.value })
            }
            className="bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
          />
          <div className="relative">
            <input
              required
              type="number"
              placeholder="Offset (Segundos)"
              value={formData.offset}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  offset: parseInt(e.target.value) || 0,
                })
              }
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              title="Segundos desde el inicio del video hasta que los minions aparecen (Minuto 0:00)"
            />
          </div>
        </div>
        <input
          required
          type="url"
          placeholder="URL YouTube VOD"
          value={formData.vodUrl}
          onChange={(e) => setFormData({ ...formData, vodUrl: e.target.value })}
          className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
        />

        <button
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 mt-2"
        >
          {loading ? "Sincronizando con Riot API..." : "Confirmar Registro"}
        </button>
      </form>
    </div>
  );
}
