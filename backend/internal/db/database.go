package db

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
	_ "github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB inicializa la conexión a PostgreSQL (Supabase)
func InitDB() error {
	// 1. Encontrar y cargar el archivo .env
	cwd, _ := os.Getwd()
	envPath := filepath.Join(cwd, ".env")

	err := godotenv.Load(envPath)
	if err != nil {
		log.Printf("[DB] Advertencia: No se encontró archivo .env en %s. Leyendo variables de entorno del sistema.", envPath)
	}

	// 2. Obtener la cadena de conexión
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("[DB] ERROR: La variable DATABASE_URL está vacía.")
	}

	// 3. Abrir la conexión
	database, err := sql.Open("postgres", dbURL)
	if err != nil {
		return err
	}

	// 4. Verificar que realmente hay conexión (Ping)
	err = database.Ping()
	if err != nil {
		return err
	}

	DB = database
	log.Println("[DB] 🟢 Conexión a Supabase (PostgreSQL) establecida con éxito.")
	return nil
}
