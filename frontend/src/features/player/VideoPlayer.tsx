import { useEffect, useRef } from "react";
import Hls from "hls.js";

// 1. Modificación: Añadimos la función callback a las propiedades (Props)
// Esto permite que el componente padre (App.tsx) sepa en qué segundo va el video.
interface VideoPlayerProps {
  url: string;
  onTimeUpdate: (time: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
}

// 2. Modificación: Desestructuramos onTimeUpdate para poder usarlo dentro del componente
export const VideoPlayer = ({
  url,
  onTimeUpdate,
  onPlay,
  onPause,
}: VideoPlayerProps) => {
  // useRef nos permite acceder directamente al elemento <video> real del DOM
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    // Verificamos si el navegador soporta HLS.js (Chrome, Firefox, Edge)
    if (Hls.isSupported()) {
      hls = new Hls({
        // debug: true, // Puedes cambiar esto a true si quieres ver cómo descarga cada fragmento .ts
      });

      // Le pasamos la URL de nuestro backend en Go
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log(
          "[HLS] Manifiesto cargado exitosamente. Listo para reproducir.",
        );
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error("[HLS] Error de red o decodificación:", data);
      });

      // Soporte nativo (Principalmente para Safari en macOS/iOS)
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    }

    // Cleanup: Destruimos la instancia de HLS si el componente se desmonta
    // Esto es CRÍTICO para evitar fugas de memoria (Memory Leaks) en React
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  // 3. Nueva Función: Interceptora de tiempo
  // Esta función se ejecuta automáticamente varias veces por segundo mientras el video se reproduce
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      // videoRef.current.currentTime devuelve el tiempo en milisegundos flotantes (ej: 10.45321)
      // Usamos Math.floor para redondearlo hacia abajo y obtener el segundo entero exacto (ej: 10)
      // Esto evita saturar el WebSocket enviando cientos de peticiones por segundo.
      const currentSecond = Math.floor(videoRef.current.currentTime);
      onTimeUpdate(currentSecond);
    }
  };

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover bg-black"
      controls
      muted // Empezar muteado ayuda a evitar bloqueos de Autoplay en navegadores modernos
      onTimeUpdate={handleTimeUpdate} // 4. Enlazamos nuestra función al evento nativo de HTML5
      onPlay={onPlay} // Avisa que empezó a reproducir
      onPause={onPause} // Avisa que se pausó
    />
  );
};
