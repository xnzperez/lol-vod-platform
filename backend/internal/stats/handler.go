package stats

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/xnzperez/lol-vod-platform/backend/internal/db"
	"github.com/xnzperez/lol-vod-platform/backend/internal/service"

	"github.com/gorilla/websocket"
)

// Client representa un espectador único conectado
type Client struct {
	Conn *websocket.Conn
	Send chan service.ProcessedFrame // Cambiado a nuestra estructura limpia
}

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true // En producción, aquí validaremos los CORS
		},
	}

	// El caché ahora es un slice (array) directo, ya no un map
	timelineCache []service.ProcessedFrame
	cacheMutex    sync.RWMutex
)

// InitTimeline carga el JSON procesado directamente desde Supabase en O(1)
func InitTimeline(matchID string) error {
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

	cacheMutex.Lock()
	timelineCache = timeline
	cacheMutex.Unlock()

	log.Printf("[STATS] 🟢 Memoria RAM: %d fotogramas clave cargados desde Supabase.", len(timeline))
	return nil
}

// getActiveState busca el último estado válido usando acceso O(1)
func getActiveState(requestedTimeSeconds int) (service.ProcessedFrame, bool) {
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()

	if len(timelineCache) == 0 {
		return service.ProcessedFrame{}, false
	}

	// Matemática simple: 150 segundos / 60 = índice 2 (Minuto 2)
	minute := requestedTimeSeconds / 60

	// Prevención de Out of Bounds si el video dura más que los datos de la API
	if minute >= len(timelineCache) {
		minute = len(timelineCache) - 1
	}
	if minute < 0 {
		minute = 0
	}

	return timelineCache[minute], true
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[STATS] Error Upgrading: %v", err)
		return
	}

	client := &Client{
		Conn: conn,
		Send: make(chan service.ProcessedFrame, 10),
	}

	log.Printf("[WS] 🟢 Cliente conectado: %s", r.RemoteAddr)

	defer func() {
		log.Printf("[WS] 🔴 Cliente desconectado: %s. Liberando recursos...", r.RemoteAddr)
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

		stats, exists := getActiveState(clientMsg.Time)
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
