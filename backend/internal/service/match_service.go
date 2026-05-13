package service

import (
	"encoding/json"
	"fmt"
	"log"
	"math"

	"github.com/xnzperez/lol-vod-platform/backend/internal/db"
	"github.com/xnzperez/lol-vod-platform/backend/internal/riot"
)

type MatchService struct {
	RiotClient *riot.RiotClient
}

func NewMatchService(rc *riot.RiotClient) *MatchService {
	return &MatchService{RiotClient: rc}
}

// ProcessAndSaveMatch orquesta el fetch a la API de Riot y la persistencia en base de datos.
func (s *MatchService) ProcessAndSaveMatch(region, matchID, title, uploaderID, vodURL string, offset int) error {
	log.Printf("[SERVICE] Procesando partida %s...", matchID)

	// 1. Obtener la Timeline
	timeline, err := s.RiotClient.GetMatchTimeline(region, matchID)
	if err != nil {
		return fmt.Errorf("error obteniendo timeline: %v", err)
	}

	// 2. Obtener la Match Info
	matchInfo, err := s.RiotClient.GetMatch(region, matchID)
	if err != nil {
		return fmt.Errorf("error obteniendo match info: %v", err)
	}

	cleanData := processTimeline(timeline)
	if len(cleanData) > 15 {
		log.Printf("[MATH] Minuto 15 -> Diff Oro: %d | Probabilidad Victoria Azul: %.2f%%",
			cleanData[15].GoldDifference, cleanData[15].WinProbability*100)
	}

	rawJSON, err := json.Marshal(timeline)
	if err != nil {
		return fmt.Errorf("error serializando raw timeline: %v", err)
	}

	processedJSON, err := json.Marshal(cleanData)
	if err != nil {
		return fmt.Errorf("error serializando processed timeline: %v", err)
	}

	matchInfoJSON, err := json.Marshal(matchInfo)
	if err != nil {
		return fmt.Errorf("error serializando match info: %v", err)
	}

	// 3. Consulta SQL expandida para incluir los nuevos campos del frontend
	query := `INSERT INTO matches_data (match_id, region, duration_minutes, raw_timeline, processed_timeline, match_info, title, uploader_id, vod_url, start_time_offset) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
	          ON CONFLICT (match_id) 
	          DO UPDATE SET 
			  	processed_timeline = EXCLUDED.processed_timeline, 
				raw_timeline = EXCLUDED.raw_timeline, 
				match_info = EXCLUDED.match_info,
				title = EXCLUDED.title,
				uploader_id = EXCLUDED.uploader_id,
				vod_url = EXCLUDED.vod_url,
				start_time_offset = EXCLUDED.start_time_offset`

	_, err = db.DB.Exec(query, matchID, region, len(timeline.Info.Frames), rawJSON, processedJSON, matchInfoJSON, title, uploaderID, vodURL, offset)
	if err != nil {
		return fmt.Errorf("error guardando en DB: %v", err)
	}

	log.Printf("[SERVICE] 🟢 Partida %s guardada/actualizada exitosamente con metadata y VOD info.", matchID)
	return nil
}

// EventDTO es un modelo optimizado para enviar por WebSocket al frontend
type EventDTO struct {
	Type          string `json:"type"`
	ParticipantID int    `json:"participantId,omitempty"`
	ItemID        int    `json:"itemId,omitempty"`
	KillerID      int    `json:"killerId,omitempty"`
	VictimID      int    `json:"victimId,omitempty"`
}

type ProcessedFrame struct {
	Minute         int        `json:"minute"`
	BlueTeamGold   int        `json:"blueTeamGold"`
	RedTeamGold    int        `json:"redTeamGold"`
	GoldDifference int        `json:"goldDifference"`
	WinProbability float64    `json:"winProbability"`
	Events         []EventDTO `json:"events"` // NUEVO: Array de eventos relevantes del minuto
}

func calculateWinProbability(goldDiff int) float64 {
	const k = 0.00027
	exponent := -k * float64(goldDiff)
	return 1.0 / (1.0 + math.Exp(exponent))
}

func processTimeline(timeline *riot.TimelineResponse) []ProcessedFrame {
	var processed []ProcessedFrame

	for i, frame := range timeline.Info.Frames {
		blueGold := 0
		redGold := 0

		for idStr, pFrame := range frame.ParticipantFrames {
			switch idStr {
			case "1", "2", "3", "4", "5":
				blueGold += pFrame.TotalGold
			case "6", "7", "8", "9", "10":
				redGold += pFrame.TotalGold
			}
		}

		// NUEVO: Filtramos y extraemos solo eventos críticos
		var minuteEvents []EventDTO
		for _, e := range frame.Events {
			if e.Type == "ITEM_PURCHASED" || e.Type == "CHAMPION_KILL" || e.Type == "ELITE_MONSTER_KILL" {
				minuteEvents = append(minuteEvents, EventDTO{
					Type:          e.Type,
					ParticipantID: e.ParticipantID,
					ItemID:        e.ItemID,
					KillerID:      e.KillerID,
					VictimID:      e.VictimID,
				})
			}
		}

		diff := blueGold - redGold
		processed = append(processed, ProcessedFrame{
			Minute:         i,
			BlueTeamGold:   blueGold,
			RedTeamGold:    redGold,
			GoldDifference: diff,
			WinProbability: calculateWinProbability(diff),
			Events:         minuteEvents, // Inyectamos los eventos al frame
		})
	}
	return processed
}
