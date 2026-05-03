package stats

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/xnzperez/lol-vod-platform/backend/internal/db"
	"github.com/xnzperez/lol-vod-platform/backend/internal/service"
)

// Client representa un espectador único conectado
type Client struct {
	Conn *websocket.Conn
	Send chan service.ProcessedFrame
}

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true // En producción, aquí validaremos los CORS
		},
	}

	// Refactor: El caché ahora es un mapa para soportar múltiples VODs concurrentes en O(1)
	timelineCache = make(map[string][]service.ProcessedFrame)
	cacheMutex    sync.RWMutex
)

// InitTimeline carga el JSON procesado si no está ya en memoria
func InitTimeline(matchID string) error {
	// 1. Verificamos si ya está en caché para ahorrar I/O de base de datos
	cacheMutex.RLock()
	_, exists := timelineCache[matchID]
	cacheMutex.RUnlock()

	if exists {
		return nil
	}

	var rawJSON []byte
	query := `SELECT processed_timeline FROM matches_data WHERE match_id = $1`

	err := db.DB.QueryRow(query, matchID).Scan(&rawJSON)
	if err != nil {
		return err
	}

	var timeline []service.ProcessedFrame
	if err := json.Unmarshal(rawJSON, &timeline); err != nil {
		return err
	}

	// 2. Guardamos en el espacio de memoria específico del VOD
	cacheMutex.Lock()
	timelineCache[matchID] = timeline
	cacheMutex.Unlock()

	log.Printf("[STATS] 🟢 Memoria RAM: %d fotogramas cargados para el VOD %s.", len(timeline), matchID)
	return nil
}

// getActiveState busca el último estado válido aislando por matchID
func getActiveState(matchID string, requestedTimeSeconds int) (service.ProcessedFrame, bool) {
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()

	timeline, exists := timelineCache[matchID]
	if !exists || len(timeline) == 0 {
		return service.ProcessedFrame{}, false
	}

	minute := requestedTimeSeconds / 60

	if minute >= len(timeline) {
		minute = len(timeline) - 1
	}
	if minute < 0 {
		minute = 0
	}

	return timeline[minute], true
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Extraemos el match_id de la URL (ej: ws://localhost:8080/ws/stats?match_id=LA1_1654100537)
	matchID := r.URL.Query().Get("match_id")
	if matchID == "" {
		http.Error(w, "El parámetro match_id es obligatorio", http.StatusBadRequest)
		return
	}

	// 2. Cargamos el timeline en memoria si es el primer espectador de este VOD
	if err := InitTimeline(matchID); err != nil {
		log.Printf("[WS] 🔴 Error cargando datos de Supabase para %s: %v", matchID, err)
		http.Error(w, "Datos de la partida no encontrados", http.StatusNotFound)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[STATS] Error Upgrading: %v", err)
		return
	}

	client := &Client{
		Conn: conn,
		Send: make(chan service.ProcessedFrame, 10),
	}

	log.Printf("[WS] 🟢 Cliente conectado a %s: %s", matchID, r.RemoteAddr)

	defer func() {
		log.Printf("[WS] 🔴 Cliente desconectado de %s. Liberando recursos...", matchID)
		close(client.Send)
		client.Conn.Close()
	}()

	go client.writePump()

	for {
		_, msgBytes, err := client.Conn.ReadMessage()
		if err != nil {
			break
		}

		var clientMsg struct {
			Time int `json:"time"`
		}
		if err := json.Unmarshal(msgBytes, &clientMsg); err != nil {
			continue
		}

		stats, exists := getActiveState(matchID, clientMsg.Time)
		if exists {
			client.Send <- stats
		}
	}
}

func (c *Client) writePump() {
	for {
		stats, ok := <-c.Send
		if !ok {
			return
		}
		err := c.Conn.WriteJSON(stats)
		if err != nil {
			log.Printf("[WS] Error de escritura: %v", err)
			return
		}
	}
}
