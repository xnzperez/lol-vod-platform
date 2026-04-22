import { useState, useEffect, useRef } from "react";

export const useSmartUI = (isPlaying: boolean) => {
  const [isUIVisible, setIsUIVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Función central: Muestra la UI y reinicia el cronómetro de inactividad
    const handleActivity = () => {
      setIsUIVisible(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Si el video se está reproduciendo, iniciamos la cuenta regresiva para ocultar.
      // Si el video está pausado, no iniciamos el temporizador, dejando la UI visible
      // para que el analista pueda interactuar con los inventarios tranquilamente.
      if (isPlaying) {
        timeoutRef.current = setTimeout(() => {
          setIsUIVisible(false);
        }, 2500); // 2.5 segundos de inactividad antes de desaparecer
      }
    };

    // Escuchamos cualquier movimiento del ratón o clic en la pantalla
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("click", handleActivity);

    // Llamada inicial
    handleActivity();

    // Limpieza de memoria (Cleanup) cuando el componente se destruya
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("click", handleActivity);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying]);

  return isUIVisible;
};
