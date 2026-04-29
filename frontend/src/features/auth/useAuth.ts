import { useState } from "react";
import { supabase } from "../../core/supabaseClient";

export const useAuth = () => {
  // Variables de estado que se habían borrado
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerAccount = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Registramos enviando metadatos. El Trigger de la DB se encargará del resto.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;

      console.log(
        "[AUTH] 🟢 Registro completado. El perfil fue creado por el Trigger en PostgreSQL.",
      );
      return authData.user;
    } catch (err: any) {
      console.error("[AUTH] 🔴 Error:", err.message);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Exportamos las funciones y variables para que RegisterForm las pueda usar
  return { registerAccount, loading, error };
};
