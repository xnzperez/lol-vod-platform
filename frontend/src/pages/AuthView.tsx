import { useState } from "react";
import { supabase } from "../core/supabaseClient";
import { useNavigate } from "react-router-dom";

export function AuthView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // NUEVO: Estado para el nombre de usuario
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // NUEVO: Enviamos el username dentro de user_metadata para satisfacer el Trigger de Postgres
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              full_name: username, // Lo enviamos también por si el trigger lo mapea
            },
          },
        });
        if (error) throw error;
        alert(
          "Registro exitoso. Revisa tu consola de Supabase para validar el usuario o inicia sesión directamente.",
        );
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <div className="bg-slate-800/40 p-8 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
            <span className="text-xl">🔐</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-widest uppercase text-sm">
          {isSignUp ? "Crear Cuenta" : "Iniciar Sesión"}
        </h2>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg text-xs font-mono mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {/* NUEVO: Campo dinámico de Username solo para registro */}
          {isSignUp && (
            <div>
              <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">
                Nombre de Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                placeholder="ej: Faker_LA1"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm mt-2"
          >
            {loading
              ? "Procesando..."
              : isSignUp
                ? "Registrar Usuario"
                : "Entrar a la Plataforma"}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-700/50 pt-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setUsername(""); // Limpiar al cambiar de modo
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors uppercase tracking-wider"
          >
            {isSignUp
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </button>
        </div>
      </div>
    </div>
  );
}
