package stats

import (
	"log"
)

// LogTimelineStats imprime un resumen estructurado del estado del juego en la consola
func LogTimelineStats() {
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()

	if len(timelineCache) == 0 {
		log.Println("[STATS] 🔴 No hay datos cargados en la caché para mostrar.")
		return
	}

	log.Println("=== [DEBUG] RESUMEN DE PARTIDA EN RAM ===")
	// Mostramos solo el primer y último frame para no saturar la consola
	primerFrame := timelineCache[0]
	ultimoFrame := timelineCache[len(timelineCache)-1]

	log.Printf("-> Inicio (Min 0): Diff Oro: %d | Prob. Victoria Azul: %.2f%%",
		primerFrame.GoldDifference, primerFrame.WinProbability*100)

	log.Printf("-> Final (Min %d): Diff Oro: %d | Prob. Victoria Azul: %.2f%%",
		ultimoFrame.Minute, ultimoFrame.GoldDifference, ultimoFrame.WinProbability*100)

	log.Println("=========================================")
}
