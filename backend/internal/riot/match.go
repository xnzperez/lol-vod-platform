package riot

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// TimelineEvent representa una acción discreta en la partida.
// Mapeamos los campos esenciales para compras de ítems y asesinatos.
type TimelineEvent struct {
	Type          string `json:"type"`                    // ej: "ITEM_PURCHASED", "CHAMPION_KILL"
	ItemID        int    `json:"itemId,omitempty"`        // Presente si es ITEM_PURCHASED
	ParticipantID int    `json:"participantId,omitempty"` // Quién compró el ítem
	KillerID      int    `json:"killerId,omitempty"`      // Presente si es CHAMPION_KILL
	VictimID      int    `json:"victimId,omitempty"`      // Presente si es CHAMPION_KILL
}

// TimelineResponse es la estructura que mapea el JSON de Riot Match-V5.
type TimelineResponse struct {
	Metadata struct {
		MatchID string `json:"matchId"`
	} `json:"metadata"`
	Info struct {
		Frames []struct {
			Timestamp         int                         `json:"timestamp"`
			ParticipantFrames map[string]ParticipantFrame `json:"participantFrames"`
			Events            []TimelineEvent             `json:"events"` // NUEVO: Extraemos el array de eventos
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
func (c *RiotClient) GetMatchTimeline(region string, matchID string) (*TimelineResponse, error) {
	url := fmt.Sprintf("https://%s.api.riotgames.com/lol/match/v5/matches/%s/timeline", region, matchID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error al crear request: %v", err)
	}

	req.Header.Add("X-Riot-Token", c.APIKey)

	resp, err := c.HttpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error ejecutando request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
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
