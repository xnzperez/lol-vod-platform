import { sileo } from "sileo";
import type { MatchFrameData } from "../features/player/useGameStats";

// Usamos la nueva interfaz que coincide con Go
type OnStatsUpdateCallback = (stats: MatchFrameData) => void;

export class VODWebSocketClient {
  private ws: WebSocket | null = null;
  private onUpdate: OnStatsUpdateCallback | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  public subscribe(callback: OnStatsUpdateCallback): void {
    this.onUpdate = callback;
  }

  public connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[WS] 🟢 Conexión establecida con éxito.");
      sileo.success({ title: "Sincronización en vivo activada" });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        // 1. Parseamos el JSON directo de Supabase/Go, SIN el decoder viejo
        const cleanStats = JSON.parse(event.data) as MatchFrameData;

        // 2. Notificamos a React inmediatamente
        if (this.onUpdate) {
          this.onUpdate(cleanStats);
        }
      } catch (error) {
        console.error("[WS] 🔴 Error parseando JSON del servidor:", error);
      }
    };

    this.ws.onclose = () => {
      console.warn("[WS] 🟡 Conexión perdida. Intentando reconectar...");
      sileo.error({ title: "Se perdió la conexión con el servidor" });
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (error: Event) => {
      console.error("[WS] 🔴 Error de red:", error);
    };
  }

  public sendMessage(payload: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}
