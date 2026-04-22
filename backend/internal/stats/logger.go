package stats

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strconv"
)

// ExportAnalytics CSV extrae la caché actual, ordena los datos temporalmente
// y genera un reporte útil para análisis de rentabilidad y estadística.
func ExportAnalytics() error {
	// 1. Bloqueamos la memoria en modo lectura para evitar colisiones
	cacheMutex.RLock()
	defer cacheMutex.RUnlock()

	// Si no hay datos, abortamos
	if len(timelineCache) == 0 {
		return fmt.Errorf("no hay datos en memoria para exportar")
	}

	// 2. ORDENAMIENTO CRONOLÓGICO
	// En Go, los mapas (diccionarios) no tienen orden garantizado.
	// Extraemos todas las llaves (segundos), las pasamos a enteros y las ordenamos.
	var timeKeys []int
	for k := range timelineCache {
		t, err := strconv.Atoi(k)
		if err == nil {
			timeKeys = append(timeKeys, t)
		}
	}
	sort.Ints(timeKeys) // Ordena de menor a mayor (0, 5, 10, 15...)

	// 3. CREACIÓN DEL ARCHIVO CSV
	cwd, _ := os.Getwd()
	// Guardamos el reporte en la carpeta data
	exportPath := filepath.Join(cwd, "data", "reporte_probabilidades.csv")

	file, err := os.Create(exportPath)
	if err != nil {
		return fmt.Errorf("error creando archivo CSV: %v", err)
	}
	// Nos aseguramos de cerrar el archivo al terminar la función
	defer file.Close()

	// Inicializamos el escritor CSV
	writer := csv.NewWriter(file)
	defer writer.Flush() // Asegura que todos los datos en buffer se escriban al disco

	// 4. ESCRIBIR CABECERAS
	headers := []string{"Segundo_Partida", "Diferencia_Oro", "Dragon_Timer", "Baron_Timer", "WinProb_Azul_Porcentaje"}
	if err := writer.Write(headers); err != nil {
		return fmt.Errorf("error escribiendo cabeceras: %v", err)
	}

	// 5. POBLAR DATOS
	// Iteramos sobre las llaves ordenadas, extraemos el estado y calculamos la probabilidad
	for _, t := range timeKeys {
		timeStr := strconv.Itoa(t)
		stats := timelineCache[timeStr]

		// Aplicamos tu algoritmo matemático
		winProb := CalculateWinProbability(stats.GoldDiff)

		// Convertimos todo a texto para el CSV
		row := []string{
			timeStr,
			fmt.Sprintf("%d", stats.GoldDiff),
			fmt.Sprintf("%d", stats.DragonTimer),
			fmt.Sprintf("%d", stats.BaronTimer),
			fmt.Sprintf("%.2f", winProb), // Limitamos a 2 decimales
		}

		writer.Write(row)
	}

	log.Printf("[DATA SCIENCE] Reporte exportado exitosamente en: %s", exportPath)
	return nil
}
