import { useState } from "react";
import { useAuth } from "./useAuth";

export const RegisterForm = () => {
  const { registerAccount, loading, error } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(false);

    const user = await registerAccount(email, password, username, fullName);

    if (user) {
      setIsSuccess(true);
      setEmail("");
      setPassword("");
      setUsername("");
      setFullName("");
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl shadow-black/80 z-50 relative">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-white tracking-wider uppercase drop-shadow-md">
          Crear Cuenta
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          Únete a la plataforma VOD de E-Sports
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Nombre Completo
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Faker Lee"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Nombre de Usuario
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="hide_on_bush"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Correo Electrónico
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="faker@t1.gg"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="••••••••"
            minLength={6}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm font-medium text-center">
            {error}
          </div>
        )}
        {isSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-200 text-sm font-medium text-center">
            ¡Cuenta creada! Revisa el panel de Supabase.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 mt-2 rounded-lg font-bold uppercase tracking-widest text-sm transition-all shadow-lg ${loading ? "bg-gray-600 cursor-not-allowed text-gray-300" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 hover:shadow-blue-500/40"}`}
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
};
