import { decodePayload, type GameStats } from "./decoder"; // Importamos la librería de físicas/toasts Sileo
// (Nota: asumo la sintaxis estándar de instanciación, ajusta si la doc de Sileo indica otra)
import * as sileo from "sileo";
// Definimos el tipo de la función que reaccionará a los mensajes
type OnStatsUpdateCallback = (stats: GameStats) => void;

export class VODWebSocketClient {
  private ws: WebSocket | null = null;
  private onUpdate: OnStatsUpdateCallback | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  // Método para suscribir la interfaz gráfica a los cambios de datos
  public subscribe(callback: OnStatsUpdateCallback): void {
    this.onUpdate = callback;
  }

  // Inicializa la conexión y maneja el ciclo de vida de la red
  public connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[WS] Conexión establecida con éxito.");
      // Usamos Sileo para notificar al usuario final de forma visual
      toast({ message: "Sincronización en vivo activada", type: "success" });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      // 1. Interceptamos el texto crudo
      const rawData = event.data as string;

      // 2. Pasamos el texto por nuestro decodificador
      const cleanStats = decodePayload(rawData);

      // 3. Si la decodificación fue exitosa y tenemos alguien escuchando, enviamos los datos
      if (cleanStats && this.onUpdate) {
        this.onUpdate(cleanStats);
      }
    };

    this.ws.onclose = () => {
      console.warn("[WS] Conexión perdida. Intentando reconectar...");
      toast({
        message: "Se perdió la conexión con el servidor",
        type: "error",
      });

      // Buena Práctica: Intentar reconectar automáticamente después de 3 segundos
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (error: Event) => {
      console.error("[WS] Error de red:", error);
    };
  }
}
