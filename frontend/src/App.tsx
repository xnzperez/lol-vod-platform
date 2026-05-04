import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { WatchView } from "./pages/WatchView";
import { AuthView } from "./pages/AuthView";
import { DashboardView } from "./pages/DashboardView";
import { useAuth } from "./core/AuthContext";
import { supabase } from "./core/supabaseClient";

// NUEVO: HOC para interceptar rutas que requieren autenticación
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 font-mono animate-pulse">
        Validando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-bold tracking-tight text-white uppercase text-xs tracking-[0.2em]">
              Lol Vod Platform
            </span>
          </Link>

          <div>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs uppercase tracking-wider bg-slate-800 hover:bg-red-900/50 border border-slate-700 hover:border-red-500/50 px-3 py-1.5 rounded transition-all text-slate-300 hover:text-white"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="text-xs uppercase tracking-wider bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded transition-all font-bold text-white shadow-lg shadow-blue-500/20"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      <Routes>
        {/* NUEVO: Rutas envueltas en el protector de sesión */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/watch/:matchId"
          element={
            <ProtectedRoute>
              <WatchView />
            </ProtectedRoute>
          }
        />

        {/* Si un usuario ya logueado intenta ir a /auth, lo devolvemos al Dashboard */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthView />}
        />
      </Routes>
    </div>
  );
}
