package riot

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

// RiotClient maneja la configuración centralizada para consumir la API de Riot Games
type RiotClient struct {
	APIKey     string
	HttpClient *http.Client
}

// NewClient inicializa el cliente leyendo las variables de entorno de forma segura
func NewClient() (*RiotClient, error) {
	apiKey := os.Getenv("RIOT_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("la variable RIOT_API_KEY está vacía o no existe en .env")
	}

	client := &RiotClient{
		APIKey:     apiKey,
		HttpClient: &http.Client{}, // En producción, aquí agregaremos Timeouts para evitar cuellos de botella
	}

	log.Println("[RIOT] 🟢 Cliente HTTP configurado correctamente.")
	return client, nil
}
