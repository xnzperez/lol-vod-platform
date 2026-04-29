package riot

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// TimelineResponse es la estructura que mapea el JSON de Riot Match-V5.
// Iremos agregando más campos (como eventos de dragón y oro) según los necesitemos.
type TimelineResponse struct {
	Metadata struct {
		MatchID string `json:"matchId"`
	} `json:"metadata"`
	Info struct {
		Frames []struct {
			Timestamp         int                         `json:"timestamp"`
			ParticipantFrames map[string]ParticipantFrame `json:"participantFrames"`
		} `json:"frames"`
	} `json:"info"`
}

type ParticipantFrame struct {
	ParticipantID int `json:"participantId"`
	TotalGold     int `json:"totalGold"`
	Level         int `json:"level"`
	Xp            int `json:"xp"`
}

// GetMatchTimeline ejecuta la petición HTTP hacia los servidores de Riot.
// Recibe el "routing value" (ej. americas, asia) y el ID de la partida.
func (c *RiotClient) GetMatchTimeline(region string, matchID string) (*TimelineResponse, error) {
	url := fmt.Sprintf("https://%s.api.riotgames.com/lol/match/v5/matches/%s/timeline", region, matchID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error al crear request: %v", err)
	}

	// Buena práctica: Inyectar el token en el Header, no en la query string
	req.Header.Add("X-Riot-Token", c.APIKey)

	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error ejecutando request: %v", err)
	}
	defer resp.Body.Close()

	// Control de Rate Limits y Errores
	if resp.StatusCode != http.StatusOK {
		// Si es 429, significa que superamos los 100 req/2 min
		return nil, fmt.Errorf("error de la API de Riot. Código HTTP: %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error leyendo el body: %v", err)
	}

	var timeline TimelineResponse
	if err := json.Unmarshal(bodyBytes, &timeline); err != nil {
		return nil, fmt.Errorf("error decodificando el JSON de Riot: %v", err)
	}

	return &timeline, nil
}
