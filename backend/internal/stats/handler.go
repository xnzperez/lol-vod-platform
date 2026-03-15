package stats

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // En producción validaríamos los dominios permitidos
	},
}

// loadTimeline lee el JSON del disco y lo inyecta en la RAM.
// Retorna un Mapa (Diccionario) donde la clave es el segundo (string) y el valor son los datos.
func loadTimeline() (map[string]GameStats, error) {
	cwd, _ := os.Getwd()
	filePath := filepath.Join(cwd, "data", "timeline.json")

	// Lee el archivo completo en bytes
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	// Transforma el JSON en la estructura Map de Go
	var data map[string]GameStats
	if err := json.Unmarshal(bytes, &data); err != nil {
		return nil, err
	}

	return data, nil
}

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[STATS] Error al establecer conexión WebSocket: %v", err)
		return
	}
	defer conn.Close()

	// 1. CARGA EN MEMORIA: Instanciamos el guion de la partida
	timeline, err := loadTimeline()
	if err != nil {
		log.Printf("[STATS] Error crítico cargando timeline.json: %v", err)
		return
	}
	log.Printf("[STATS] Timeline cargado en RAM. Cliente conectado desde %s", r.RemoteAddr)

	// 2. EVENT LOOP (Bucle infinito de escucha)
	for {
		// El código se pausa aquí hasta que React envía un mensaje por el WebSocket
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			log.Printf("[STATS] Cliente desconectado.")
			break
		}

		// Parseamos el mensaje recibido (Ej: {"time": 10})
		var clientMsg ClientMessage
		if err := json.Unmarshal(msgBytes, &clientMsg); err != nil {
			log.Printf("[STATS] Advertencia: Mensaje inválido del cliente: %s", string(msgBytes))
			continue
		}

		// 3. COMPLEJIDAD O(1): Convertimos el número 10 a texto "10" y buscamos en el diccionario
		timeKey := strconv.Itoa(clientMsg.Time)

		// Evaluamos si en ese segundo exacto hay datos guardados en nuestro timeline.json
		if stats, exists := timeline[timeKey]; exists {
			// Si existen, disparamos los datos ofuscados de vuelta a React
			if err := conn.WriteJSON(stats); err != nil {
				log.Printf("[STATS] Error enviando paquete de datos: %v", err)
				break
			}
			log.Printf("[STATS] Sincronización exitosa -> Segundo %s despachado.", timeKey)
		}
	}
}
