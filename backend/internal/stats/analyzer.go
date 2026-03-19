package stats

import (
	"math"
)

// CalculateWinProbability aplica regresión logística para determinar
// la probabilidad de victoria del equipo Azul (Blue Team) basándose en el oro.
func CalculateWinProbability(goldDiff int) float64 {
	// Constante de peso del oro (ajustable según el análisis de datos históricos)
	const k = 0.0005

	// Diferencia de oro en formato decimal
	deltaG := float64(goldDiff)

	// Aplicamos la fórmula sigmoide: P = 1 / (1 + e^(-k * deltaG))
	// math.Exp calcula e^x
	prob := 1.0 / (1.0 + math.Exp(-k*deltaG))

	// Convertimos a porcentaje (ej. 0.8153 -> 81.53%)
	percent := prob * 100.0

	// Redondeamos a dos decimales para que la interfaz gráfica no sufra procesando números largos
	return math.Round(percent*100) / 100
}
