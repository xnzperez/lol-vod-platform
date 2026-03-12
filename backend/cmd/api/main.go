package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/xnzperez/lol-vod-platform/backend/internal/stats"
	"github.com/xnzperez/lol-vod-platform/backend/internal/vod"
)

func main() {
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

	// Registramos la ruta VOD
	vodHandler := vod.NewHandler(dataPath)
	mux.Handle("/vod/", http.StripPrefix("/vod/", vodHandler))
	mux.HandleFunc("/ws/stats", stats.WebSocketHandler)

	srv := &http.Server{
		Addr: ":8080",
		// AQUÍ ESTÁ LA MAGIA: Envolvemos todo con nuestro Logger Global
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
