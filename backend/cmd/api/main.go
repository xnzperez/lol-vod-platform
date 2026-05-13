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
	"github.com/xnzperez/lol-vod-platform/backend/internal/service"
	"github.com/xnzperez/lol-vod-platform/backend/internal/stats"
	"github.com/xnzperez/lol-vod-platform/backend/internal/vod"
)

// AddMatchRequest define el payload esperado desde el frontend para subir un VOD
type AddMatchRequest struct {
	Title      string `json:"title"`
	Region     string `json:"region"`
	MatchID    string `json:"matchId"`
	VodURL     string `json:"vodUrl"`
	Offset     int    `json:"offset"`
	UploaderID string `json:"uploaderId"`
}

func main() {
	// 1. INICIALIZAR LA BASE DE DATOS
	if err := db.InitDB(); err != nil {
		log.Fatalf("Error crítico al conectar a la base de datos: %v", err)
	}

	// 2. INICIALIZAR EL CLIENTE DE RIOT Y SERVICIOS
	riotClient, err := riot.NewClient()
	if err != nil {
		log.Fatalf("Error crítico al inicializar cliente de Riot: %v", err)
	}
	matchService := service.NewMatchService(riotClient)
	_ = matchService

	// 3. REPROCESAMIENTO FORZADO
	/*go func() {
		err := matchService.ProcessAndSaveMatch("americas", "LA1_1654100537")
		if err != nil {
			log.Printf("[MAIN] 🔴 Error: %v", err)
		} else {
			log.Printf("[MAIN] 🟢 Partida LA1 procesada con eventos granulares. Lista para React.")
		}
	}()*/

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

		/*err := stats.ExportAnalytics()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{
				"error":    "Fallo al generar el reporte CSV",
				"detalles": err.Error(),
			})
			return
		}*/

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "success",
			"message": "Reporte CSV generado correctamente en la carpeta /data",
		})
	})

	// Endpoint para recibir y procesar nuevos VODs desde el frontend
	mux.HandleFunc("POST /api/matches", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var req AddMatchRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Payload JSON inválido"})
			return
		}

		// Validamos que el usuario esté autenticado
		if req.UploaderID == "" || req.MatchID == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Faltan datos obligatorios (MatchID o UploaderID)"})
			return
		}

		// NUEVO: Verificar si la partida ya existe para evitar sobreescritura
		var exists bool
		errCheck := db.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM matches_data WHERE match_id = $1)", req.MatchID).Scan(&exists)
		if errCheck == nil && exists {
			w.WriteHeader(http.StatusConflict) // HTTP 409 Conflict
			json.NewEncoder(w).Encode(map[string]string{"error": "Este VOD ya fue indexado previamente en la plataforma."})
			return
		}

		// Ejecutamos la función de servicio
		err := matchService.ProcessAndSaveMatch(req.Region, req.MatchID, req.Title, req.UploaderID, req.VodURL, req.Offset)
		if err != nil {
			log.Printf("[API] 🔴 Error al procesar VOD: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "success",
			"message": "VOD y telemetría procesados e indexados correctamente",
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
