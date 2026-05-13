import { sileo } from "sileo";
import type { MatchFrameData } from "../features/player/useGameStats";

type OnStatsUpdateCallback = (stats: MatchFrameData) => void;

export class VODWebSocketClient {
  private ws: WebSocket | null = null;
  private onUpdate: OnStatsUpdateCallback | null = null;
  private onErrorCb: ((err: string) => void) | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  public subscribe(callback: OnStatsUpdateCallback): void {
    this.onUpdate = callback;
  }

  public onError(callback: (err: string) => void): void {
    this.onErrorCb = callback;
  }

  public connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("[WS] 🟢 Conexión establecida con éxito.");
      sileo.success({ title: "Sincronización en vivo activada" });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        console.log("🔥 RAW WS JSON (LO QUE MANDA GO):", event.data);
        const rawData = JSON.parse(event.data);

        // Mapeo Estricto: Casteo explícito a String en el ID para no romper el acumulador
        let mappedPlayers = undefined;

        if (rawData.players && Array.isArray(rawData.players)) {
          mappedPlayers = rawData.players;
        } else if (rawData.p_d && Array.isArray(rawData.p_d)) {
          mappedPlayers = rawData.p_d.map((p: any) => ({
            id: p.id
              ? String(p.id)
              : p.participantId
                ? String(p.participantId)
                : "",
            name: p.n || p.name || "Jugador",
            champion: p.c || p.champion || "",
            kda: p.kda || "0/0/0",
            items: p.i || p.items || [],
          }));
        }

        // Construimos el contrato estricto
        const cleanStats: MatchFrameData = {
          minute: rawData.minute || rawData.t || 0,
          blueTeamGold: rawData.blueTeamGold || 0,
          redTeamGold: rawData.redTeamGold || 0,
          goldDifference: rawData.goldDifference || rawData.g_d || 0,
          winProbability: rawData.winProbability || rawData.w_p || 50,
          events: rawData.events || null,
          players: mappedPlayers,
        };

        if (this.onUpdate) {
          this.onUpdate(cleanStats);
        }
      } catch (error) {
        console.error("[WS] 🔴 Error parseando JSON del servidor:", error);
      }
    };

    this.ws.onclose = () => {
      console.warn("[WS] 🟡 Conexión perdida. Intentando reconectar...");
      if (this.onErrorCb) {
        this.onErrorCb("Se perdió la conexión con el servidor");
      } else {
        sileo.error({ title: "Se perdió la conexión con el servidor" });
      }
      setTimeout(() => this.connect(), 3000);
    };

    this.ws.onerror = (error: Event) => {
      console.error("[WS] 🔴 Error de red:", error);
      if (this.onErrorCb) {
        this.onErrorCb("Error de red en la conexión WebSocket");
      }
    };
  }

  public sendMessage(payload: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}
