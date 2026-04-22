package stats

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
)

// Client representa un espectador único conectado
type Client struct {
	Conn *websocket.Conn
	Send chan GameStats
}

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	timelineCache  map[string]GameStats
	sortedTimeKeys []int // NUEVO: Arreglo ordenado para buscar el evento más cercano
	cacheMutex     sync.RWMutex
)

// InitTimeline carga el JSON y pre-calcula las llaves ordenadas
func InitTimeline() error {
	cwd, _ := os.Getwd()
	filePath := filepath.Join(cwd, "data", "timeline.json")

	bytes, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	var data map[string]GameStats
	if err := json.Unmarshal(bytes, &data); err != nil {
		return err
	}

	// Extraemos y ordenamos las llaves de tiempo
	var keys []int
	for k := range data {
		t, err := strconv.Atoi(k)
		if err == nil {
			keys = append(keys, t)
		}
	}
	sort.Ints(keys) // [0, 15, 30, 45, 55]

	cacheMutex.Lock()
	timelineCache = data
	sortedTimeKeys = keys
	cacheMutex.Unlock()

	log.Printf("[STATS] Memoria RAM: %d fotogramas clave cargados.", len(data))
	return nil
}

// getActiveState busca el último estado válido para un segundo específico
func getActiveState(requestedTime int) (GameStats, bool) {
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()

	if len(sortedTimeKeys) == 0 {
		return GameStats{}, false
	}

	// Algoritmo de búsqueda: encontrar la llave más grande que sea <= requestedTime
	activeKey := sortedTimeKeys[0]
	for _, k := range sortedTimeKeys {
		if k <= requestedTime {
			activeKey = k
		} else {
			break // Como está ordenado, si nos pasamos, ya tenemos la correcta
		}
	}

	stats, exists := timelineCache[strconv.Itoa(activeKey)]
	return stats, exists
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[STATS] Error Upgrading: %v", err)
		return
	}

	client := &Client{
		Conn: conn,
		Send: make(chan GameStats, 10),
	}

	log.Printf("[WS] 🟢 Cliente conectado: %s", r.RemoteAddr)

	defer func() {
		log.Printf("[WS] 🔴 Cliente desconectado: %s. Liberando recursos...", r.RemoteAddr)
		close(client.Send)
		client.Conn.Close()
	}()

	go client.writePump()

	// Bucle principal de lectura
	for {
		_, msgBytes, err := client.Conn.ReadMessage()
		if err != nil {
			break
		}

		// Asumimos que ClientMessage tiene un campo int 'Time'
		var clientMsg struct {
			Time int `json:"time"`
		}
		if err := json.Unmarshal(msgBytes, &clientMsg); err != nil {
			continue
		}

		// NUEVO: Usamos la función inteligente de búsqueda en lugar de coincidencia exacta
		stats, exists := getActiveState(clientMsg.Time)

		if exists {
			stats.WinProb = CalculateWinProbability(stats.GoldDiff)
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
