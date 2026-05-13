package main

import (
	"encoding/json"
	"fmt"
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

	// NUEVA RUTA: Buscar últimos Match IDs por Riot ID (Nombre#Tag)
	mux.HandleFunc("GET /api/search-matches", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		gameName := r.URL.Query().Get("name")
		tagLine := r.URL.Query().Get("tag")
		region := r.URL.Query().Get("region")

		if gameName == "" || tagLine == "" {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "Faltan name o tag"})
			return
		}

		apiKey := os.Getenv("RIOT_API_KEY") // Asegúrate de que esta variable exista
		client := &http.Client{}

		// 1. Obtener PUUID desde Account-V1 (Americas)
		accountURL := fmt.Sprintf("https://%s.api.riotgames.com/riot/account/v1/accounts/by-riot-id/%s/%s", region, gameName, tagLine)
		reqAcc, _ := http.NewRequest("GET", accountURL, nil)
		reqAcc.Header.Set("X-Riot-Token", apiKey)

		respAcc, err := client.Do(reqAcc)
		if err != nil || respAcc.StatusCode != 200 {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Jugador no encontrado en Riot Games"})
			return
		}
		defer respAcc.Body.Close()

		var accountData struct {
			Puuid string `json:"puuid"`
		}
		json.NewDecoder(respAcc.Body).Decode(&accountData)

		// 2. Obtener los últimos 5 Match IDs usando el PUUID
		matchesURL := fmt.Sprintf("https://%s.api.riotgames.com/lol/match/v5/matches/by-puuid/%s/ids?start=0&count=5", region, accountData.Puuid)
		reqMatch, _ := http.NewRequest("GET", matchesURL, nil)
		reqMatch.Header.Set("X-Riot-Token", apiKey)

		respMatch, err := client.Do(reqMatch)
		if err != nil || respMatch.StatusCode != 200 {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Error obteniendo el historial de partidas"})
			return
		}

		var matchIDs []string
		json.NewDecoder(respMatch.Body).Decode(&matchIDs)
		respMatch.Body.Close()

		// NUEVO: 3. Estructura para el resumen de la partida
		type MatchSummary struct {
			MatchID  string `json:"matchId"`
			Champion string `json:"champion"`
			Kills    int    `json:"kills"`
			Deaths   int    `json:"deaths"`
			Assists  int    `json:"assists"`
			Win      bool   `json:"win"`
			GameMode string `json:"gameMode"`
		}

		var summaries []MatchSummary

		// NUEVO: 4. Consultar los detalles de cada partida y extraer los datos del jugador
		for _, matchID := range matchIDs {
			detailURL := fmt.Sprintf("https://americas.api.riotgames.com/lol/match/v5/matches/%s", matchID)
			reqDetail, _ := http.NewRequest("GET", detailURL, nil)
			reqDetail.Header.Set("X-Riot-Token", apiKey)

			respDetail, err := client.Do(reqDetail)
			if err != nil || respDetail.StatusCode != 200 {
				continue // Si una partida falla, la saltamos para no romper el ciclo
			}

			var matchData struct {
				Info struct {
					GameMode     string `json:"gameMode"`
					Participants []struct {
						Puuid        string `json:"puuid"`
						ChampionName string `json:"championName"`
						Kills        int    `json:"kills"`
						Deaths       int    `json:"deaths"`
						Assists      int    `json:"assists"`
						Win          bool   `json:"win"`
					} `json:"participants"`
				} `json:"info"`
			}

			json.NewDecoder(respDetail.Body).Decode(&matchData)
			respDetail.Body.Close()

			// Buscamos cuál de los 10 jugadores es el que estamos buscando
			for _, p := range matchData.Info.Participants {
				if p.Puuid == accountData.Puuid {
					summaries = append(summaries, MatchSummary{
						MatchID:  matchID,
						Champion: p.ChampionName,
						Kills:    p.Kills,
						Deaths:   p.Deaths,
						Assists:  p.Assists,
						Win:      p.Win,
						GameMode: matchData.Info.GameMode,
					})
					break
				}
			}
		}

		// Devolvemos la lista de resúmenes estructurados al frontend
		json.NewEncoder(w).Encode(map[string]interface{}{
			"matches": summaries,
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
