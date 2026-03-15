import { useEffect, useRef } from "react";
import Hls from "hls.js";

// Definimos los Props (parámetros) que recibirá nuestro componente
interface VideoPlayerProps {
  url: string;
}

export const VideoPlayer = ({ url }: VideoPlayerProps) => {
  // useRef nos permite acceder directamente al elemento <video> real del DOM
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    // 1. Verificamos si el navegador soporta HLS.js (Chrome, Firefox, Edge)
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

      // 2. Soporte nativo (Principalmente para Safari en macOS/iOS)
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    }

    // 3. Cleanup: Destruimos la instancia de HLS si el componente se desmonta
    // Esto es CRÍTICO para evitar fugas de memoria (Memory Leaks) en React
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [url]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover bg-black"
      controls
      muted // Empezar muteado ayuda a evitar bloqueos de Autoplay en navegadores modernos
    />
  );
};
