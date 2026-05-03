package stats

import (
	"log"
)

// LogTimelineStats imprime un resumen estructurado del estado del juego en la consola
func LogTimelineStats(matchID string) {
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()

	timeline, exists := timelineCache[matchID]
	if !exists || len(timeline) == 0 {
		log.Printf("[STATS] 🔴 No hay datos cargados en la caché para mostrar del match: %s.", matchID)
		return
	}

	log.Printf("=== [DEBUG] RESUMEN DE PARTIDA EN RAM (%s) ===", matchID)
	// Extraemos el primer y último frame del arreglo específico de esta partida
	primerFrame := timeline[0]
	ultimoFrame := timeline[len(timeline)-1]

	log.Printf("-> Inicio (Min 0): Diff Oro: %d | Prob. Victoria Azul: %.2f%%",
		primerFrame.GoldDifference, primerFrame.WinProbability*100)

	log.Printf("-> Final (Min %d): Diff Oro: %d | Prob. Victoria Azul: %.2f%%",
		ultimoFrame.Minute, ultimoFrame.GoldDifference, ultimoFrame.WinProbability*100)

	log.Println("=========================================")
}
