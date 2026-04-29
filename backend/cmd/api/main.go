package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/xnzperez/lol-vod-platform/backend/internal/db"
	"github.com/xnzperez/lol-vod-platform/backend/internal/riot"
	"github.com/xnzperez/lol-vod-platform/backend/internal/stats"
	"github.com/xnzperez/lol-vod-platform/backend/internal/vod"
)

func main() {
	// 1. INICIALIZAR LA CACHÉ EN RAM (¡Vital para la arquitectura concurrente!)
	if err := stats.InitTimeline(); err != nil {
		log.Fatalf("Error crítico al iniciar el Timeline en RAM: %v", err)
	}

	// 2. INICIALIZAR LA BASE DE DATOS (NUEVO)
	if err := db.InitDB(); err != nil {
		log.Fatalf("Error crítico al conectar a la base de datos: %v", err)
	}

	// 3. INICIALIZAR EL CLIENTE DE RIOT
	riotClient, err := riot.NewClient()
	if err != nil {
		log.Fatalf("Error crítico al inicializar cliente de Riot: %v", err)
	}

	// --- [PRUEBA DE EXTRACCIÓN - RIOT API] ---
	// Usaremos un ID de partida de prueba de la región LAN (LA1).
	// Si este ID ya caducó en los servidores de Riot, la consola arrojará un código 404, lo cual es normal.
	testRegion := "americas"
	testMatchID := "LA1_1654100537" // ID de prueba (formato: SERVIDOR_NUMERO)

	log.Printf("[RIOT] Intentando extraer Timeline de la partida: %s en la región: %s...", testMatchID, testRegion)

	timeline, err := riotClient.GetMatchTimeline(testRegion, testMatchID)
	if err != nil {
		log.Printf("[RIOT] 🔴 Error en la prueba (Aviso: Si es 404, significa que el Match ID no existe): %v", err)
	} else {
		log.Printf("[RIOT] 🟢 ¡Extracción Exitosa! Match ID: %s | Fotogramas extraídos: %d", timeline.Metadata.MatchID, len(timeline.Info.Frames))
	}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Servidor VOD LoL Operativo"))
	})

	cwd, err := os.Getwd()
	if err != nil {
		log.Fatalf("Error obteniendo el directorio: %v", err)
	}
	dataPath := filepath.Join(cwd, "data")

	// Registramos la ruta VOD y WebSockets
	vodHandler := vod.NewHandler(dataPath)
	mux.Handle("/vod/", http.StripPrefix("/vod/", vodHandler))
	mux.HandleFunc("/ws/stats", stats.WebSocketHandler)

	// 2. NUEVA RUTA: Endpoint para exportar analíticas (Estándar net/http)
	mux.HandleFunc("/api/export", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		err := stats.ExportAnalytics()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error":    "Fallo al generar el reporte CSV",
				"detalles": err.Error(),
			})
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "success",
			"message": "Reporte CSV generado correctamente en la carpeta /data",
		})
	})

	srv := &http.Server{
		Addr: ":8080",
		// Envolvemos todo con nuestro Logger Global y CORS
		Handler:      globalLogger(enableCORS(mux)),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	log.Println("Iniciando servidor HLS/WS en http://localhost:8080...")
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("Error crítico en el servidor: %v", err)
	}
}

// globalLogger es nuestra "cámara de seguridad". Imprime TODO lo que entra al servidor.
func globalLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("[GLOBAL] Petición entrante -> Método: %s | Ruta solicitada: %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
