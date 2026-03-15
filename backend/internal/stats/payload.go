package stats

// PlayerData mapea la información individual de cada jugador (Ofuscado)
type PlayerData struct {
	ID    string   `json:"id"`  // Identificador único (ej. "t1_faker")
	Name  string   `json:"n"`   // Nombre del jugador
	Champ string   `json:"c"`   // Campeón utilizado
	KDA   string   `json:"kda"` // Asesinatos/Muertes/Asistencias
	Items []string `json:"i"`   // Arreglo de strings con los objetos comprados
}

// GameStats es el payload principal que enviamos al frontend
type GameStats struct {
	Timestamp   int          `json:"t"`
	GoldDiff    int          `json:"g_d"`
	DragonTimer int          `json:"d_t"`
	BaronTimer  int          `json:"b_t"`
	Players     []PlayerData `json:"p_d"` // Inyectamos el arreglo de jugadores
}

// ClientMessage es la estructura que ESPERAMOS recibir desde React.
// El frontend nos enviará mensajes como: {"time": 15}
type ClientMessage struct {
	Time int `json:"time"`
}
