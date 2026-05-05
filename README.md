from ds_python_interpreter import execute

readme_content = """# Lol Vod Platform - Análisis y Telemetría de eSports

**Plataforma multimedia avanzada para la revisión táctica de partidas competitivas de League of Legends, sincronizando VODs con telemetría en tiempo real.**

## TL;DR
Plataforma orientada a analistas y coaches que sincroniza video HLS con datos de la API de Riot Games mediante WebSockets. Utiliza un backend en Go, frontend en React 19 y persistencia en Supabase con modelos predictivos de regresión logística.

---

## 1. Overview & System Architecture

Lol Vod Platform resuelve el acoplamiento monolítico de las transmisiones tradicionales de eSports. A diferencia de los sistemas actuales, esta plataforma separa la capa de video de la capa de datos, permitiendo una interactividad asíncrona total sobre el VOD (Video On Demand).

### Arquitectura de Alto Nivel
El sistema sigue un modelo Cliente-Servidor de alta concurrencia:
* **Backend:** Orquestador en Go que gestiona la lógica de negocio, cálculos estadísticos y túneles TCP.
* **Frontend:** Aplicación SPA en React que renderiza la telemetría sobre un lienzo de video HLS.
* **Infraestructura:** Base de datos relacional (PostgreSQL) y autenticación vía Supabase.

*📌 [IMAGEN A PEGAR AQUÍ]: "Figura 3. Diagrama de Casos de Uso de la Plataforma Interactiva"*
*📌 [IMAGEN A PEGAR AQUÍ]: "System Component Interaction"*

---

## 2. Reverse Engineering & Domain Logic

Para el diseño, se analizaron los sistemas de la PGL (CS2) y la LEC (LoL). Se identificaron deficiencias críticas como la pérdida de interactividad tras el directo y la intrusión visual de los overlays estáticos.

### Hallazgos Clave:
* **Acoplamiento Fuerte:** Los datos se queman en el video, perdiendo utilidad en el VOD.
* **Ineficiencia de Red:** Uso de *Polling* HTTP en lugar de flujos bidireccionales.
* **Análisis Heurístico:** Predicciones basadas en votos de fans y no en el estado real de la partida.

*📌 [IMAGEN A PEGAR AQUÍ]: "Figura 1. Interfaz Monolítica y sobrecarga visual en la transmisión de PGL (CS2)"*
*📌 [IMAGEN A PEGAR AQUÍ]: "Figura 2. Sistema de predicción basado en popularidad ("Who Will Win?") en la LEC"*

---

## 3. Data Flow Architecture

El ciclo de vida del dato garantiza que cada segundo del video corresponda exactamente a un estado del juego en la base de datos.

### Pipeline de Datos:
1.  **Ingestion:** `MatchService` extrae datos de `Match-V5` y `Timeline-V5` (Riot API).
2.  **Processing:** El backend calcula la **Win Probability** usando regresión logística ($k=0.00027$) y genera los `ProcessedFrame`.
3.  **Delivery:** Un servidor `WebSocket` despacha los ticks de datos sincronizados con el `currentTime` del reproductor.

*📌 [IMAGEN A PEGAR AQUÍ]: "Pipeline Flow Diagram: Ingestion to Storage"*
*📌 [IMAGEN A PEGAR AQUÍ]: "Entity Interaction Diagram: Backend to Frontend"*

---

## 4. Tech Stack

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | Go (net/http, gorilla/websocket, lib/pq) |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, hls.js |
| **Database** | PostgreSQL (Supabase), JSONB para Timelines |
| **APIs** | Riot Games API, YouTube IFrame API |

---

## 5. Módulos del Sistema

### Backend (Go)
* **API Server:** Punto de entrada para streaming HLS y WebSockets.
* **Riot Client:** Cliente especializado para el consumo autenticado de la API de Riot.
* **Timeline Cache:** Almacenamiento en memoria ($O(1)$) para acceso rápido durante el scrubbing del video.

### Frontend (React)
* **VideoPlayer:** Orquestador de sincronización y calibración de offsets.
* **Smart UI:** Lógica de visibilidad condicional para reducir la sobrecarga cognitiva.
* **Telemetry Components:** `MatchEventLog`, `WinProbabilityBar`, `MatchScoreboard`, `MatchTimeline`.

*📌 [IMAGEN A PEGAR AQUÍ]: "Figura 4. Diagrama de Componentes ilustrando la arquitectura Cliente-Servidor"*
*📌 [IMAGEN A PEGAR AQUÍ]: "Synchronization Pipeline"*

---

## 6. Estándares de Calidad e Ingeniería

El proyecto se alinea con la norma **ISO/IEC 25010**, priorizando:
* **Eficiencia de Desempeño:** Delegación de interpolaciones matemáticas al cliente para evitar saturación de red.
* **Mantenibilidad:** Bajo acoplamiento mediante interfaces JSON y servicios aislados.
* **Extensibilidad:** Arquitectura preparada para inyectar nuevos módulos de eSports (Caja Blanca/Negra).

---

## 7. Modelado de Datos (DTOs)

El sistema utiliza contratos estrictos para garantizar la integridad entre Go y TypeScript.

**Estructura del `ProcessedFrame`:**
```go
type ProcessedFrame struct {
    Minute         int         `json:"minute"`
    BlueTeamGold   int         `json:"blueTeamGold"`
    RedTeamGold    int         `json:"redTeamGold"`
    WinProbability float64     `json:"winProbability"`
    Events         []EventDTO  `json:"events"`
}
