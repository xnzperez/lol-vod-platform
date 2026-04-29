import { useEffect, useRef } from "react";
import YouTube from "react-youtube"; // SOLUCIÓN: Únicamente importación por defecto

interface VideoPlayerProps {
  videoId: string;
  onTimeUpdate: (time: number) => void;
  startTimeOffset?: number;
}

export const VideoPlayer = ({
  videoId,
  onTimeUpdate,
  startTimeOffset = 0,
}: VideoPlayerProps) => {
  // Usamos 'any' para evitar que Vite intente buscar tipos inexistentes en runtime
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Validamos que el reproductor exista y tenga el método disponible
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const currentTime = await playerRef.current.getCurrentTime();
        const gameTime = Math.floor(currentTime - startTimeOffset);

        if (gameTime >= 0) {
          onTimeUpdate(gameTime);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUpdate, startTimeOffset]);

  // Manejador del evento de inicialización de YouTube
  const onReady = (event: any) => {
    playerRef.current = event.target;
    console.log("[YOUTUBE] 🟢 Reproductor listo e instanciado.");
  };

  return (
    <div className="w-full h-full bg-black overflow-hidden relative">
      <YouTube
        videoId={videoId}
        opts={{
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            start: startTimeOffset,
            rel: 0,
            modestbranding: 1,
          },
        }}
        onReady={onReady}
        className="absolute top-0 left-0 w-full h-full"
        iframeClassName="w-full h-full object-cover"
      />
    </div>
  );
};
