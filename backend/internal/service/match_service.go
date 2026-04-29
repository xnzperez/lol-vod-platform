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

// ProcessAndSaveMatch coordina la extracción, limpieza y persistencia
func (s *MatchService) ProcessAndSaveMatch(region, matchID string) error {
	log.Printf("[SERVICE] Procesando partida %s...", matchID)

	// 1. Extraer de Riot
	timeline, err := s.RiotClient.GetMatchTimeline(region, matchID)
	if err != nil {
		return err
	}

	// 2. Procesamiento Matemático
	cleanData := processTimeline(timeline)
	if len(cleanData) > 15 {
		log.Printf("[MATH] Minuto 15 -> Diff Oro: %d | Probabilidad Victoria Azul: %.2f%%",
			cleanData[15].GoldDifference, cleanData[15].WinProbability*100)
	}

	// 3. Convertir ambos a JSON para la DB
	rawJSON, err := json.Marshal(timeline)
	if err != nil {
		return fmt.Errorf("error serializando raw timeline: %v", err)
	}

	processedJSON, err := json.Marshal(cleanData)
	if err != nil {
		return fmt.Errorf("error serializando processed timeline: %v", err)
	}

	// 4. Guardar en Supabase (Usamos UPSERT para actualizar si el match_id ya existe)
	query := `INSERT INTO matches_data (match_id, region, duration_minutes, raw_timeline, processed_timeline) 
	          VALUES ($1, $2, $3, $4, $5) 
	          ON CONFLICT (match_id) 
	          DO UPDATE SET processed_timeline = EXCLUDED.processed_timeline, raw_timeline = EXCLUDED.raw_timeline`

	_, err = db.DB.Exec(query, matchID, region, len(timeline.Info.Frames), rawJSON, processedJSON)
	if err != nil {
		return fmt.Errorf("error guardando en DB: %v", err)
	}

	log.Printf("[SERVICE] 🟢 Partida %s guardada/actualizada exitosamente con datos procesados.", matchID)
	return nil
}

// ProcessedFrame representa el estado global de la partida en un minuto específico
type ProcessedFrame struct {
	Minute         int     `json:"minute"`
	BlueTeamGold   int     `json:"blueTeamGold"`
	RedTeamGold    int     `json:"redTeamGold"`
	GoldDifference int     `json:"goldDifference"`
	WinProbability float64 `json:"winProbability"` // Probabilidad de victoria del Equipo Azul (0.0 a 1.0)
}

// calculateWinProbability aplica una función sigmoide para predecir el resultado
func calculateWinProbability(goldDiff int) float64 {
	const k = 0.00027 // Constante de escalado para LoL
	exponent := -k * float64(goldDiff)
	return 1.0 / (1.0 + math.Exp(exponent))
}

// processTimeline ejecuta la agregación de datos por equipo
func processTimeline(timeline *riot.TimelineResponse) []ProcessedFrame {
	var processed []ProcessedFrame

	// Iteramos sobre los fotogramas (cada índice es un minuto de la partida)
	for i, frame := range timeline.Info.Frames {
		blueGold := 0
		redGold := 0

		// Mapeo estricto de la API de Riot Games:
		// IDs "1" al "5" -> Equipo Azul (Bottom side)
		// IDs "6" al "10" -> Equipo Rojo (Top side)
		for idStr, pFrame := range frame.ParticipantFrames {
			switch idStr {
			case "1", "2", "3", "4", "5":
				blueGold += pFrame.TotalGold
			case "6", "7", "8", "9", "10":
				redGold += pFrame.TotalGold
			}
		}

		diff := blueGold - redGold
		processed = append(processed, ProcessedFrame{
			Minute:         i,
			BlueTeamGold:   blueGold,
			RedTeamGold:    redGold,
			GoldDifference: diff,
			WinProbability: calculateWinProbability(diff),
		})
	}
	return processed
}
