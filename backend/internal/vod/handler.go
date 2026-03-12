package vod

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// NewHandler retorna un handler que lee los archivos sin causar redirecciones HTTP
func NewHandler(dataDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cleanPath := filepath.Clean(r.URL.Path)
		fullFilePath := filepath.Join(dataDir, cleanPath)

		log.Printf("[VOD] Solicitud procesada -> URL original: %s | Archivo: %s", r.URL.Path, cleanPath)

		// 1. Abrimos el archivo directamente desde el sistema operativo
		file, err := os.Open(fullFilePath)
		if err != nil {
			log.Printf("[VOD] ERROR: No se encontró físicamente el archivo %s", fullFilePath)
			http.NotFound(w, r)
			return
		}
		// CRÍTICO en Go: Siempre diferir el cierre del archivo para evitar Fugas de Memoria (Memory Leaks)
		defer file.Close()

		// 2. Obtenemos los metadatos del archivo (tamaño, fecha de modificación)
		info, err := file.Stat()
		if err != nil || info.IsDir() {
			http.NotFound(w, r)
			return
		}

		// 3. Asignación de cabeceras HLS estrictas
		ext := filepath.Ext(fullFilePath)
		if ext == ".m3u8" {
			w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
			w.Header().Set("Cache-Control", "no-cache")
		} else if ext == ".ts" {
			w.Header().Set("Content-Type", "video/mp2t")
			w.Header().Set("Cache-Control", "public, max-age=3600")
		}

		// 4. ServeContent inyecta los bytes del archivo en la respuesta HTTP
		// Soporta rangos de video (avanzar/retroceder) y NO emite redirecciones automáticas.
		http.ServeContent(w, r, info.Name(), info.ModTime(), file)
		log.Printf("[VOD] ÉXITO: Bytes transferidos al cliente -> %s", cleanPath)
	})
}
