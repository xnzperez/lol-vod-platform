import { sileo } from "sileo";
import type { MatchFrameData } from "../features/player/useGameStats";

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
        const rawData = JSON.parse(event.data);

        // Mapeo Defensivo: Rescatamos los jugadores si vienen comprimidos (p_d) o planos
        const mappedPlayers = rawData.players
          ? rawData.players
          : rawData.p_d
            ? rawData.p_d.map((p: any) => ({
                id: p.id || p.participantId?.toString(),
                name: p.n || p.name || `Jugador`,
                champion: p.c || p.champion || "",
                kda: p.kda || "0/0/0",
                items: p.i || p.items || [],
              }))
            : undefined;

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
