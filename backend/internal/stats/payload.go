package stats

// GameStats define la estructura de datos que enviaremos al frontend.
// Observa los "tags" de JSON a la derecha. Esta es nuestra ofuscación de Nivel 1.
type GameStats struct {
	Timestamp   int `json:"t"`   // 't' = Tiempo actual del VOD en segundos
	GoldDiff    int `json:"g_d"` // 'g_d' = Gold Difference (Diferencia de Oro)
	DragonTimer int `json:"d_t"` // 'd_t' = Dragon Timer (Tiempo para el próximo dragón)
	BaronTimer  int `json:"b_t"` // 'b_t' = Baron Timer
}

// Nota para la Fase 2: Cuando inspecciones la pestaña "WS" (WebSockets) en las DevTools
// del navegador, solo verás algo como {"t":120,"g_d":-1500,"d_t":45,"b_t":0}.
// Quien intente robar tus datos tendrá que deducir qué significa "g_d".