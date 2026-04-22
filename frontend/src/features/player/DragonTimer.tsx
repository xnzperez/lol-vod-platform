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
    <div className="bg-white/10 border border-white/20 px-3 md:px-5 py-2 md:py-3 rounded-xl backdrop-blur-md shadow-lg text-xs md:text-sm font-bold uppercase tracking-wider text-gray-100 flex items-center justify-between min-w-[150px] md:min-w-[200px]">
      Dragón en
      <span className="ml-3 md:ml-4 text-xl md:text-2xl font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
        {displayTimer !== null ? `${displayTimer}s` : "--"}
      </span>
    </div>
  );
};
