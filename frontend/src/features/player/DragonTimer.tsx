import { useState, useEffect } from "react";

interface DragonTimerProps {
  serverTimer: number | undefined;
  isPlaying: boolean; // NUEVO: Recibimos si el video está pausado o reproduciéndose
}

export const DragonTimer = ({ serverTimer, isPlaying }: DragonTimerProps) => {
  const [displayTimer, setDisplayTimer] = useState<number | null>(null);

  // Efecto 1: Sincronización Maestra (Solo actualiza cuando Go manda un dato nuevo)
  useEffect(() => {
    if (serverTimer !== undefined) {
      setDisplayTimer(serverTimer);
    }
  }, [serverTimer]);

  // Efecto 2: Motor de Interpolación (Controlado por el Play/Pause)
  useEffect(() => {
    // Si el video está pausado, abortamos y no creamos el intervalo
    if (!isPlaying) return;

    const intervalId = setInterval(() => {
      setDisplayTimer((prevTime) => {
        if (prevTime !== null && prevTime > 0) {
          return prevTime - 1;
        }
        return prevTime;
      });
    }, 1000);

    // Si el usuario pausa el video, React ejecuta este return y destruye el reloj instantáneamente
    return () => clearInterval(intervalId);
  }, [isPlaying]); // Este efecto reacciona mágicamente cada vez que le das Play o Pause

  return (
    <div className="bg-[#0d1117]/85 border border-[#30363d]/80 px-5 py-3 rounded backdrop-blur-sm text-lg font-semibold uppercase tracking-wider text-gray-300">
      Dragón en:
      <span className="ml-3 text-2xl font-extrabold text-amber-500">
        {displayTimer !== null ? `${displayTimer}s` : "--"}
      </span>
    </div>
  );
};
