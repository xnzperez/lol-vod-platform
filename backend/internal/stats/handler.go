package stats

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// Configuramos el "Upgrader". Esta herramienta toma la petición HTTP
// y la convierte en una conexión WebSocket bidireccional.
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// IMPORTANTE: Como nuestro frontend (Vite) corre en el puerto 5173
	// y el backend en 8080, debemos relajar temporalmente la seguridad de origen.
	CheckOrigin: func(r *http.Request) bool {
		return true // En producción, aquí validaríamos que venga de "midominio.com"
	},
}

// WebSocketHandler es el controlador que conectaremos a nuestro enrutador principal.
func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Mutamos la petición HTTP a WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[STATS] Error al establecer conexión WebSocket: %v", err)
		return
	}

	// 2. Garantizamos que la conexión se cierre cuando el usuario salga de la página
	defer conn.Close()
	log.Printf("[STATS] Cliente conectado exitosamente al WebSocket desde %s", r.RemoteAddr)

	// 3. Bucle de prueba de concepto (Ping-Pong)
	// Por ahora, solo enviaremos un dato de prueba y esperaremos mensajes del cliente.
	// En el siguiente paso conectaremos esto al servicio que lee los tiempos reales.

	testPayload := GameStats{
		Timestamp:   0,
		GoldDiff:    1500, // T1 va ganando por 1.5k de oro
		DragonTimer: 120,  // Faltan 2 minutos para el dragón
	}

	// Enviamos el payload ofuscado en formato JSON
	if err := conn.WriteJSON(testPayload); err != nil {
		log.Printf("[STATS] Error escribiendo en WebSocket: %v", err)
		return
	}

	// Mantenemos la conexión viva escuchando (necesario para que no se cierre sola)
	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Printf("[STATS] Cliente desconectado: %v", err)
			break
		}
		log.Printf("[STATS] Mensaje recibido del cliente: %s (Tipo: %d)", string(p), messageType)
	}
}
