# Overview

Overview
Relevant source files
README.md
backend/cmd/api/main.go
frontend/src/App.tsx
The LoL VOD Platform is a specialized analysis tool designed for League of Legends (LoL) competitive matches. It synchronizes high-quality VOD playback with real-time telemetry, including win probability forecasting, item purchase logs, and detailed gold/objective statistics derived from the Riot Games API.

Core Capabilities
The platform operates as a monorepo consisting of a Go-based backend and a React-based frontend.

VOD Synchronization: Streams HLS video segments and synchronizes them with a WebSocket-based telemetry feed.
Predictive Analytics: Calculates real-time win probability using game state variables like gold lead and objective control.
Interactive Dashboard: Allows users to browse historical matches, save favorites, and enter a detailed "Watch View" for frame-by-frame analysis.
Authentication: Secure access managed via Supabase, protecting match data and user preferences.
For a detailed breakdown of the monorepo layout and dependencies, see Project Structure & Tech Stack.

System Architecture
The system is built on a distributed architecture where the Go backend acts as the orchestrator between external data providers (Riot Games API), persistent storage (Supabase/PostgreSQL), and the client.

Component Relationship Diagram
This diagram illustrates how the primary code entities across the stack interact to deliver the VOD experience.

"System Component Interaction"

Sources:
backend/cmd/api/main.go
18-59

frontend/src/App.tsx
72-97

frontend/src/pages/WatchView.tsx
40-60

Data Integration Pipeline
Data flows through the system in three distinct phases:

Ingestion: The MatchService
backend/internal/service/match_service.go
29-31
uses the RiotClient
backend/internal/riot/client.go
25-28
to pull raw match data.
Processing: The backend calculates win probabilities and transforms raw events into a "ProcessedFrame" format optimized for the frontend.
Consumption: The frontend WatchView
frontend/src/pages/WatchView.tsx
1-10
subscribes to a WebSocket stream
backend/cmd/api/main.go
58
that broadcasts these frames in sync with the video's current timestamp.
For an end-to-end walkthrough of this pipeline, see Data Flow Architecture.

Code Entity Mapping
The following diagram maps high-level system operations to specific functions and files within the codebase.

"Natural Language to Code Entity Mapping"

Sources:
backend/cmd/api/main.go
25-58

frontend/src/App.tsx
9-25

frontend/src/core/AuthContext.tsx
1-20

Key Technologies
Layer Technologies
Backend Go, net/http, gorilla/websocket, lib/pq
Frontend React 19, TypeScript, Vite, Tailwind CSS 4, hls.js
Database PostgreSQL (Supabase), matches_data schema
API Riot Games API (Match-V5, Timeline-V5)
Sources:
backend/cmd/api/main.go
1-16

frontend/src/App.tsx
1-6

README.md
1-2

Child Sections
Project Structure & Tech Stack: Details on the monorepo organization and environment configuration.
Data Flow Architecture: Deep dive into the Riot API → Backend → Frontend data lifecycle.

## Project Structure & Tech Stack

Project Structure & Tech Stack
Relevant source files
.gitignore
backend/go.mod
backend/go.sum
backend/internal/db/database.go
frontend/package-lock.json
frontend/package.json
frontend/vite.config.ts
This page details the architectural layout, technology choices, and environment configurations for the League of Legends VOD Platform. The project is organized as a monorepo, separating the Go-based backend from the React-based frontend to facilitate independent scaling and clear separation of concerns.

Monorepo Layout
The repository is structured into two primary directories, each containing its own dependency management and configuration files.

Directory Responsibility Key Files
backend/ Go API, Riot API integration, WebSocket server, and HLS streaming. go.mod, main.go, internal/
frontend/ React SPA, VOD playback, real-time telemetry overlays, and authentication. package.json, vite.config.ts, src/
backend/data/ Static assets including HLS playlists (.m3u8) and video segments (.ts). partida-t1-geng.m3u8
Sources:

backend/go.mod
1-10
frontend/package.json
1-39
Backend Tech Stack
The backend is built using Go 1.25.1
backend/go.mod
3
focusing on high-performance concurrency for WebSocket handling and efficient data processing.

Core Dependencies
Networking & WebSockets: github.com/gorilla/websocket is used to manage real-time telemetry streams between the server and the frontend
backend/go.mod
6
Database Driver: github.com/lib/pq provides the PostgreSQL driver required to communicate with the Supabase database instance
backend/go.mod
8
Environment Management: github.com/joho/godotenv is utilized to load configuration from .env files
backend/go.mod
7
Backend Entity Relationship
The following diagram illustrates how backend entities interact with external services and internal storage.

Backend System Architecture

Sources:

backend/internal/db/database.go
14-14
backend/go.mod
5-9
Frontend Tech Stack
The frontend is a modern Single Page Application (SPA) built with TypeScript and React 19
frontend/package.json
16-17
bundled via Vite
frontend/package.json
37

Core Dependencies
Styling: Tailwind CSS 4 is integrated directly into the Vite pipeline via @tailwindcss/vite for high-performance utility-first styling
frontend/package.json
14

frontend/vite.config.ts
3-10
State & Auth: @supabase/supabase-js manages user sessions and direct database queries for match metadata
frontend/package.json
13
Routing: react-router-dom handles navigation between the Dashboard, Watch, and Auth views
frontend/package.json
18
Media & Visualization:
hls.js: Powers the custom HLS video streaming implementation
frontend/package.json
15
react-youtube: Manages YouTube iframe embeds for VODs not hosted locally
frontend/package.json
19
recharts: Renders the match gold and win probability charts
frontend/package.json
20
Frontend Component & Data Logic
This diagram maps the frontend logic to the underlying libraries and data sources.

Frontend Tech Integration

Sources:

frontend/package.json
12-23
frontend/vite.config.ts
6-11
Environment Configuration
Both the frontend and backend rely on environment variables for sensitive credentials and service endpoints. These are typically stored in a .env file at the root or within specific subdirectories (note: .env files are ignored by git)
.gitignore
3-5

Backend Variables
The backend initialization logic searches for the .env file in the current working directory using os.Getwd() and filepath.Join()
backend/internal/db/database.go
19-22

Variable Description
DATABASE*URL PostgreSQL connection string for Supabase
backend/internal/db/database.go
28-31
RIOT_API_KEY (Required by Riot Client) API key for fetching match data.
Frontend Variables
Vite requires frontend variables to be prefixed with VITE* to be exposed to the client-side code.

Variable Description
VITE_SUPABASE_URL The API URL for the Supabase project.
VITE_SUPABASE_ANON_KEY The public anonymous key for Supabase client initialization.
Sources:

backend/internal/db/database.go
17-31
.gitignore
3-5

## Data Flow Architecture

Relevant source files
backend/internal/riot/match.go
backend/internal/service/match_service.go
backend/internal/stats/handler.go
frontend/src/core/websocket.ts
frontend/src/features/player/useGameStats.ts
This page describes the end-to-end data pipeline of the LoL VOD Platform. It tracks the lifecycle of League of Legends match data from its ingestion via the Riot Games API, its transformation and storage in the Go backend and Supabase, and its eventual real-time delivery to the React frontend.

1. Data Ingestion and Processing Pipeline
   The pipeline begins with the MatchService in the Go backend. It orchestrates the retrieval of raw match data and its conversion into a structured format suitable for time-series analysis and real-time playback synchronization.

Data Acquisition
The backend uses the RiotClient to perform authenticated HTTP requests to Riot Games' Match-V5 endpoints. Two primary datasets are fetched for every match:

Match Metadata: Basic info including participants and champion names
backend/internal/riot/match.go
78-90
Match Timeline: A minute-by-minute breakdown of gold, experience, and discrete events (kills, item purchases)
backend/internal/riot/match.go
21-40
Transformation Logic
Once fetched, the processTimeline function iterates through the Riot API frames to aggregate team-level statistics.

Gold Aggregation: Participants 1-5 are summed for the Blue Team, and 6-10 for the Red Team
backend/internal/service/match_service.go
104-111
Win Probability: A logistic regression formula ($k=0.00027$) is applied to the gold difference at every minute to estimate the current win chance
backend/internal/service/match_service.go
91-95
Event Filtering: Critical events like ITEM_PURCHASED and CHAMPION_KILL are extracted into EventDTO objects for the frontend log
backend/internal/service/match_service.go
114-125
Storage
The resulting ProcessedFrame slice is serialized to JSON and stored in the matches_data table in Supabase (PostgreSQL) using an UPSERT operation
backend/internal/service/match_service.go
59-67

Pipeline Flow Diagram: Ingestion to Storage

Sources:
backend/internal/riot/match.go
42-73

backend/internal/service/match_service.go
21-71

backend/internal/service/match_service.go
97-138

2. Real-Time Delivery via WebSocket
   The platform uses a bidirectional WebSocket communication pattern to synchronize the VOD playback time with the telemetry data stored in the database.

Synchronization Flow
Connection: The frontend initializes a VODWebSocketClient and connects to /ws/stats?match_id={id}
frontend/src/core/websocket.ts
20-29
Caching: On the first connection for a specific match, the backend InitTimeline function queries the matches_data table and hydrates an in-memory timelineCache
backend/internal/stats/handler.go
35-65
Time Updates: As the YouTube/HLS video plays, the useGameStats hook sends the current playback second to the backend
frontend/src/features/player/useGameStats.ts
40-50
State Retrieval: The backend getActiveState function maps the requested second to the corresponding minute in the ProcessedFrame array
backend/internal/stats/handler.go
68-87
Broadcast: The backend pushes the ProcessedFrame (containing gold, win probability, and events) back to the client
backend/internal/stats/handler.go
145-157
Entity Interaction Diagram: Backend to Frontend

Sources:
backend/internal/stats/handler.go
89-143

frontend/src/features/player/useGameStats.ts
15-53

frontend/src/core/websocket.ts
7-58

3. Data Schema and Model Mapping
   The system maintains a consistent data contract across the stack to ensure type safety and efficient parsing.

Backend Entity (Go) Database Column Frontend Entity (TS) Purpose
service.ProcessedFrame processed_timeline MatchFrameData Core telemetry per minute
backend/internal/service/match_service.go
82-89
service.EventDTO Part of processed_timeline (Implicit in MatchFrameData) Filtered match events
backend/internal/service/match_service.go
74-80
riot.MatchResponse match_info MatchInfo Player and champion metadata
backend/internal/riot/match.go
78-80
Sources:
backend/internal/service/match_service.go
59-64

frontend/src/features/player/useGameStats.ts
7-13

# Backend

Data Flow Architecture
Relevant source files
backend/internal/riot/match.go
backend/internal/service/match_service.go
backend/internal/stats/handler.go
frontend/src/core/websocket.ts
frontend/src/features/player/useGameStats.ts
This page describes the end-to-end data pipeline of the LoL VOD Platform. It tracks the lifecycle of League of Legends match data from its ingestion via the Riot Games API, its transformation and storage in the Go backend and Supabase, and its eventual real-time delivery to the React frontend.

1. Data Ingestion and Processing Pipeline
   The pipeline begins with the MatchService in the Go backend. It orchestrates the retrieval of raw match data and its conversion into a structured format suitable for time-series analysis and real-time playback synchronization.

Data Acquisition
The backend uses the RiotClient to perform authenticated HTTP requests to Riot Games' Match-V5 endpoints. Two primary datasets are fetched for every match:

Match Metadata: Basic info including participants and champion names
backend/internal/riot/match.go
78-90
Match Timeline: A minute-by-minute breakdown of gold, experience, and discrete events (kills, item purchases)
backend/internal/riot/match.go
21-40
Transformation Logic
Once fetched, the processTimeline function iterates through the Riot API frames to aggregate team-level statistics.

Gold Aggregation: Participants 1-5 are summed for the Blue Team, and 6-10 for the Red Team
backend/internal/service/match_service.go
104-111
Win Probability: A logistic regression formula ($k=0.00027$) is applied to the gold difference at every minute to estimate the current win chance
backend/internal/service/match_service.go
91-95
Event Filtering: Critical events like ITEM_PURCHASED and CHAMPION_KILL are extracted into EventDTO objects for the frontend log
backend/internal/service/match_service.go
114-125
Storage
The resulting ProcessedFrame slice is serialized to JSON and stored in the matches_data table in Supabase (PostgreSQL) using an UPSERT operation
backend/internal/service/match_service.go
59-67

Pipeline Flow Diagram: Ingestion to Storage

Sources:
backend/internal/riot/match.go
42-73

backend/internal/service/match_service.go
21-71

backend/internal/service/match_service.go
97-138

2. Real-Time Delivery via WebSocket
   The platform uses a bidirectional WebSocket communication pattern to synchronize the VOD playback time with the telemetry data stored in the database.

Synchronization Flow
Connection: The frontend initializes a VODWebSocketClient and connects to /ws/stats?match_id={id}
frontend/src/core/websocket.ts
20-29
Caching: On the first connection for a specific match, the backend InitTimeline function queries the matches_data table and hydrates an in-memory timelineCache
backend/internal/stats/handler.go
35-65
Time Updates: As the YouTube/HLS video plays, the useGameStats hook sends the current playback second to the backend
frontend/src/features/player/useGameStats.ts
40-50
State Retrieval: The backend getActiveState function maps the requested second to the corresponding minute in the ProcessedFrame array
backend/internal/stats/handler.go
68-87
Broadcast: The backend pushes the ProcessedFrame (containing gold, win probability, and events) back to the client
backend/internal/stats/handler.go
145-157
Entity Interaction Diagram: Backend to Frontend

Sources:
backend/internal/stats/handler.go
89-143

frontend/src/features/player/useGameStats.ts
15-53

frontend/src/core/websocket.ts
7-58

3. Data Schema and Model Mapping
   The system maintains a consistent data contract across the stack to ensure type safety and efficient parsing.

Backend Entity (Go) Database Column Frontend Entity (TS) Purpose
service.ProcessedFrame processed_timeline MatchFrameData Core telemetry per minute
backend/internal/service/match_service.go
82-89
service.EventDTO Part of processed_timeline (Implicit in MatchFrameData) Filtered match events
backend/internal/service/match_service.go
74-80
riot.MatchResponse match_info MatchInfo Player and champion metadata
backend/internal/riot/match.go
78-80
Sources:
backend/internal/service/match_service.go
59-64

frontend/src/features/player/useGameStats.ts
7-13

## Api Server & Middleware

API Server & Middleware
Relevant source files
backend/cmd/api/main.go
The API Server & Middleware layer serves as the central entry point for the LoL VOD Platform backend. It is responsible for initializing core services, configuring the HTTP server environment, and routing requests to specialized handlers for VOD streaming, WebSocket telemetry, and health monitoring.

Server Configuration
The server is implemented in main.go using the standard library's http.Server struct. It is configured to listen on port 8080 with specific timeout settings to ensure resource management and prevent stale connections
backend/cmd/api/main.go
81-88

Setting Value Description
Port :8080 The network port the server binds to
backend/cmd/api/main.go
82
ReadTimeout 10s Maximum duration for reading the entire request
backend/cmd/api/main.go
85
WriteTimeout 10s Maximum duration before timing out writes of the response
backend/cmd/api/main.go
86
IdleTimeout 120s Maximum amount of time to wait for the next request when keep-alives are enabled
backend/cmd/api/main.go
87
Startup Sequence
The main() function orchestrates the following initialization steps:

Database Initialization: Calls db.InitDB() to establish a connection to PostgreSQL
backend/cmd/api/main.go
20-22
Riot Client Setup: Initializes the riot.NewClient() to interact with the Riot Games API
backend/cmd/api/main.go
25-28
Service Instantiation: Creates a matchService for processing game data
backend/cmd/api/main.go
29
Route Registration: Defines the API surface using http.NewServeMux
backend/cmd/api/main.go
42-79
Sources:

backend/cmd/api/main.go
18-94
Route Registration
The platform utilizes http.NewServeMux to map URL patterns to specific logic.

Routing Table
Route Method Logic / Handler Description
/health GET Inline function Returns 200 OK and a status string
backend/cmd/api/main.go
44-47
/vod/ GET vod.NewHandler Serves HLS (.m3u8) and segment (.ts) files
backend/cmd/api/main.go
56-57
/ws/stats UPGRADE stats.WebSocketHandler Handles real-time telemetry WebSocket connections
backend/cmd/api/main.go
58
/api/export GET Inline function Triggers CSV analytics generation
backend/cmd/api/main.go
61-79
Request Routing Architecture
The following diagram illustrates how incoming requests are dispatched to various internal packages.

Diagram: Request Dispatching Flow

Sources:

backend/cmd/api/main.go
42-79
backend/cmd/api/main.go
97-116
Middleware Chain
The server wraps the primary router (mux) in a chain of middleware functions to handle cross-cutting concerns.

globalLogger
Acts as the primary auditing layer. It logs every incoming request method and path to the console before passing the request to the next handler
backend/cmd/api/main.go
97-102

enableCORS
Handles Cross-Origin Resource Sharing (CORS) to allow the React frontend (typically running on a different port) to interact with the API.

Allowed Origins: \* (All origins)
backend/cmd/api/main.go
106
Allowed Methods: GET, POST, OPTIONS
backend/cmd/api/main.go
107
Preflight: Intercepts OPTIONS requests and returns 200 OK immediately
backend/cmd/api/main.go
110-113
Middleware Implementation Structure
The diagram below shows how the http.Handler interface is used to wrap functionality.

Diagram: Middleware Wrapping Logic

Sources:

backend/cmd/api/main.go
84
backend/cmd/api/main.go
97-116
Data Flow: Entry Point to Handlers
When the server starts, it identifies the current working directory to locate the data folder, which contains the VOD files and exported analytics
backend/cmd/api/main.go
49-53
This path is passed to the vod.NewHandler to ensure the file server has the correct context
backend/cmd/api/main.go
56

Component Association
Code Entity Responsibility
srv \*http.Server Lifecycle management of the HTTP listener
backend/cmd/api/main.go
81
globalLogger Logging decorator for http.Handler
backend/cmd/api/main.go
97
enableCORS Header manipulation for cross-origin requests
backend/cmd/api/main.go
104
stats.WebSocketHandler Connection upgrader for real-time stats
backend/cmd/api/main.go
58
vod.NewHandler File system abstraction for HLS streaming
backend/cmd/api/main.go
56
Sources:

backend/cmd/api/main.go
49-58
backend/cmd/api/main.go
81-88

## Riot Games API Client

Riot Games API Client
Relevant source files
backend/internal/riot/client.go
backend/internal/riot/match.go
frontend/src/core/supabaseClient.ts
frontend/src/features/auth/RegisterForm.tsx
frontend/src/features/auth/useAuth.ts
The backend/internal/riot package serves as the specialized HTTP client for interacting with the Riot Games Match-V5 API. It is responsible for fetching historical match data and granular timeline frames, which are subsequently used by the Match Processing Service to generate win probabilities and telemetry.

Client Configuration
The RiotClient struct encapsulates the necessary configuration for authenticated requests. It utilizes a standard http.Client and manages the API key lifecycle.

Constructor: NewClient()
The NewClient() function initializes the client by retrieving the RIOT_API_KEY from the environment variables. If the key is missing, the constructor returns an error to prevent the backend from starting in an invalid state
backend/internal/riot/client.go
17-30

RiotClient Struct
Field Type Description
APIKey string The developer/production key provided by Riot Games.
HttpClient \*http.Client The underlying Go HTTP client used for requests.
Sources:
backend/internal/riot/client.go
11-14

backend/internal/riot/client.go
17-30

API Methods
The client implements two primary methods to retrieve data from the match/v5 endpoints. Both methods inject the API key into the X-Riot-Token header
backend/internal/riot/match.go
50

backend/internal/riot/match.go
103

GetMatch()
Retrieves high-level metadata for a specific match, including participant identities and champion selections.

Endpoint: https://{region}.api.riotgames.com/lol/match/v5/matches/{matchID}
backend/internal/riot/match.go
96
Returns: \*MatchResponse containing participant names and champion IDs
backend/internal/riot/match.go
95
GetMatchTimeline()
Retrieves minute-by-minute (and second-by-second) snapshots of the game state. This is the primary data source for gold differences and event logging.

Endpoint: https://{region}.api.riotgames.com/lol/match/v5/matches/{matchID}/timeline
backend/internal/riot/match.go
43
Returns: \*TimelineResponse containing frames, participant stats (gold, level, XP), and events (kills, item purchases)
backend/internal/riot/match.go
42
Sources:
backend/internal/riot/match.go
41-73

backend/internal/riot/match.go
95-127

Data Transfer Objects (DTOs)
The package defines several structs to map the JSON responses from Riot's API into Go types.

Match Metadata Models
Used by GetMatch to identify who is playing.

MatchResponse: Wrapper for match info
backend/internal/riot/match.go
78-80
Participant: Maps summonerName and championName to a participantId
backend/internal/riot/match.go
86-90
Timeline & Telemetry Models
Used by GetMatchTimeline for analysis.

TimelineResponse: Contains the array of Frames
backend/internal/riot/match.go
21-32
ParticipantFrame: Captures TotalGold, Level, and Xp for a specific player at a specific timestamp
backend/internal/riot/match.go
34-39
TimelineEvent: Captures discrete actions like ITEM_PURCHASED or CHAMPION_KILL, including KillerID and VictimID
backend/internal/riot/match.go
12-18
Sources:
backend/internal/riot/match.go
10-39

backend/internal/riot/match.go
78-90

Data Flow & Entity Mapping
The following diagrams illustrate how the internal code entities map to the external Riot API structure and how data flows through the client.

Riot API Entity Mapping
This diagram bridges the Riot API JSON structure to the Go internal structs.

Sources:
backend/internal/riot/match.go
21-39

backend/internal/riot/match.go
78-90

backend/internal/riot/match.go
95-127

Request Execution Flow
This diagram shows the internal logic of a Riot API request within the Go backend.

Sources:
backend/internal/riot/match.go
42-72

backend/internal/riot/client.go
23-26

Error Handling Strategy
The client employs a "fail-fast" strategy with descriptive error wrapping:

Request Creation: Errors in http.NewRequest are caught immediately
backend/internal/riot/match.go
46-48
Network/Execution: Failures in HttpClient.Do (e.g., DNS, timeouts) are returned with a "request execution" prefix
backend/internal/riot/match.go
53-55
API Status: If the response code is not 200 OK, the client returns an error including the HTTP status code
backend/internal/riot/match.go
58-60
Parsing: Errors during io.ReadAll or json.Unmarshal are explicitly caught to identify malformed responses from the upstream API
backend/internal/riot/match.go
68-70
Sources:
backend/internal/riot/match.go
41-73

backend/internal/riot/match.go
95-127

## Match Processing Service

Match Processing Service
Relevant source files
backend/internal/service/match_service.go
The Match Processing Service is the core business logic layer of the backend, responsible for transforming raw data from the Riot Games API into actionable analytics for the frontend. It orchestrates the ingestion of match timelines and metadata, performs gold aggregation, calculates real-time win probabilities using logistic regression, and persists the results to the database.

Service Orchestration: ProcessAndSaveMatch
The ProcessAndSaveMatch function in backend/internal/service/match_service.go acts as the primary pipeline. It coordinates between the RiotClient and the database layer to ensure a match is fully indexed and analyzed.

Execution Pipeline
Timeline Retrieval: Fetches the minute-by-minute event data using s.RiotClient.GetMatchTimeline
backend/internal/service/match_service.go
25-28
Metadata Retrieval: Fetches player and champion information using s.RiotClient.GetMatch
backend/internal/service/match_service.go
31-34
Data Transformation: Invokes processTimeline to aggregate team gold and filter critical events
backend/internal/service/match_service.go
36
Serialization: Converts raw and processed structures into JSON for storage
backend/internal/service/match_service.go
42-56
Persistence: Executes an UPSERT operation on the matches_data table
backend/internal/service/match_service.go
59-67
Data Flow Diagram
This diagram illustrates how the MatchService bridges the gap between the external Riot API and the internal PostgreSQL storage.

Sources:
backend/internal/service/match_service.go
13-71

Data Models
The service uses specialized Data Transfer Objects (DTOs) to optimize the payload sent to the frontend via WebSockets and stored in the database.

ProcessedFrame
Represents the state of the game at a specific minute.

Field Type Description
Minute int The game minute index.
BlueTeamGold int Total gold for participants 1-5.
RedTeamGold int Total gold for participants 6-10.
GoldDifference int BlueTeamGold - RedTeamGold.
WinProbability float64 Calculated probability of Blue Team winning (0.0 to 1.0).
Events []EventDTO Filtered list of critical events for that minute.
EventDTO
A stripped-down version of Riot's event model, containing only fields necessary for the UI log.

Type: "ITEM_PURCHASED", "CHAMPION_KILL", or "ELITE_MONSTER_KILL"
backend/internal/service/match_service.go
116
ParticipantID, ItemID, KillerID, VictimID: Optional fields depending on the event type
backend/internal/service/match_service.go
74-80
Sources:
backend/internal/service/match_service.go
74-89

Processing Logic
Team Gold Aggregation
The service calculates team-wide gold by iterating through ParticipantFrames. It follows the standard Riot API convention for team assignment:

Blue Team: Participants with IDs "1", "2", "3", "4", "5"
backend/internal/service/match_service.go
106-107
Red Team: Participants with IDs "6", "7", "8", "9", "10"
backend/internal/service/match_service.go
108-109
Win Probability Formula
The calculateWinProbability function uses a logistic (sigmoid) function to map gold difference to a probability percentage.

Constant k: 0.00027
backend/internal/service/match_service.go
92
Formula: $P(\text{BlueWin}) = \frac{1}{1 + e^{-k \cdot \text{goldDiff}}}$
backend/internal/service/match_service.go
93-94
A positive goldDiff (Blue lead) results in a probability $> 0.5$, while a negative diff (Red lead) results in $< 0.5$.

Logic Flow: processTimeline

Sources:
backend/internal/service/match_service.go
91-138

Database Schema: matches_data
The service interacts with the matches_data table using an INSERT ... ON CONFLICT (match_id) DO UPDATE pattern
backend/internal/service/match_service.go
59-62

Column Type Description
match_id TEXT Primary Key (e.g., "EUW1_12345").
region TEXT Riot region (e.g., "europe").
duration_minutes INT Total length based on frame count.
raw_timeline JSONB Unmodified Riot API response.
processed_timeline JSONB Array of ProcessedFrame objects.
match_info JSONB Metadata (participants, champions, etc).
Sources:
backend/internal/service/match_service.go
59-67

## Real-time Stats & WebSockets Layer

Real-Time Stats & WebSocket Layer
Relevant source files
backend/internal/stats/analyzer.go
backend/internal/stats/handler.go
backend/internal/stats/logger.go
backend/internal/stats/payload.go
backend/internal/stats/service.go
backend/internal/vod/handler.go
backend/internal/vod/service.go
The backend/internal/stats package provides the real-time communication infrastructure required to synchronize League of Legends match telemetry with the frontend VOD player. It manages stateful WebSocket connections, implements an in-memory caching strategy for high-performance timeline retrieval, and calculates live win probabilities based on game state.

WebSocket Lifecycle & Connection Management
The system utilizes the gorilla/websocket library to upgrade standard HTTP requests to persistent full-duplex connections.

WebSocketHandler
The WebSocketHandler
backend/internal/stats/handler.go
89-143
serves as the entry point for real-time data. It performs the following sequence:

Match Identification: Extracts the match_id from the URL query parameters
backend/internal/stats/handler.go
91-95
State Initialization: Triggers InitTimeline to ensure the match data is available in the memory cache
backend/internal/stats/handler.go
98-102
Protocol Upgrade: Upgrades the connection using an upgrader configured with a 1024-byte buffer and permissive CORS for development
backend/internal/stats/handler.go
21-27
Client Registration: Instantiates a Client struct and launches the writePump goroutine
backend/internal/stats/handler.go
110-123
Read Loop: Continuously listens for ClientMessage payloads containing the current VOD playback time
backend/internal/stats/handler.go
125-142
Client & writePump
Each connected user is represented by a Client struct
backend/internal/stats/handler.go
15-18
To prevent blocking the read loop, the writePump
backend/internal/stats/handler.go
145-157
runs in a dedicated goroutine, consuming frames from the Send channel and pushing them to the WebSocket.

Sources:
backend/internal/stats/handler.go
15-157

Memory Architecture: timelineCache
To avoid expensive database I/O during high-frequency time updates (scrubbing the video player), the system employs an in-memory caching layer.

Cache Structure
Storage: A map[string][]service.ProcessedFrame where the key is the matchID
backend/internal/stats/handler.go
30
Concurrency: Protected by sync.RWMutex (cacheMutex) to allow multiple concurrent readers while serializing writes during initial load
backend/internal/stats/handler.go
31
State Retrieval (getActiveState)
The getActiveState function
backend/internal/stats/handler.go
68-87
maps the requested playback time (in seconds) to the corresponding minute-indexed frame in the cache. It includes bounds checking to ensure requests beyond the match duration return the final available frame
backend/internal/stats/handler.go
79-84

Sources:
backend/internal/stats/handler.go
30-87

Win Probability Analyzer
The CalculateWinProbability function
backend/internal/stats/analyzer.go
9-25
implements a logistic regression model to estimate the Blue Team's likelihood of victory based on the current gold difference.

Mathematical Implementation
The analyzer uses a sigmoid function: $$P = \frac{1}{1 + e^{-k \cdot \Delta G}}$$

k (Weight Constant): Set to 0.0005
backend/internal/stats/analyzer.go
11
$\Delta G$: The gold difference (Blue Gold - Red Gold)
backend/internal/stats/analyzer.go
14
Output: A percentage value rounded to two decimal places for UI stability
backend/internal/stats/analyzer.go
21-24
Sources:
backend/internal/stats/analyzer.go
7-25

Data Transfer Objects (DTOs)
The package defines compact JSON structures to minimize bandwidth. Short keys are used to reduce the payload size of the frequent WebSocket updates.

Struct Field JSON Key Description
PlayerData Name n Player summoner name
PlayerData Champ c Champion name
PlayerData Items i List of item IDs/names
GameStats GoldDiff g_d Current gold lead
GameStats WinProb w_p Calculated win probability
GameStats Players p_d Array of PlayerData
Sources:
backend/internal/stats/payload.go
4-20

Data Flow & Entity Mapping
The following diagrams illustrate how the internal Go entities interact and how they map to the conceptual data flow.

WebSocket Communication Flow
This diagram shows the relationship between the WebSocketHandler, the Client goroutines, and the timelineCache.

Sources:
backend/internal/stats/handler.go
15-157

backend/internal/db/database.go
1-50

Logic & Payload Mapping
This diagram bridges the analyzer logic with the payload definitions used for transmission.

Sources:
backend/internal/stats/analyzer.go
7-25

backend/internal/stats/payload.go
4-26

Debugging Utilities
The LogTimelineStats utility
backend/internal/stats/logger.go
8-30
provides a structured console summary of the cached match data. It extracts the first (Minute 0) and last frames to verify the gold difference and win probability calculations during development
backend/internal/stats/logger.go
20-27

Sources:
backend/internal/stats/logger.go
1-30

## VOD Streeaming (HLS Handler)

VOD Streaming (HLS Handler)
Relevant source files
backend/data/partida-t1-geng.m3u8
backend/data/partida-t1-geng0.ts
backend/data/timeline.json
backend/internal/stats/service.go
backend/internal/vod/handler.go
backend/internal/vod/service.go
The VOD Streaming system is responsible for serving high-definition video content using the HTTP Live Streaming (HLS) protocol. It provides a specialized HTTP handler that serves .m3u8 playlists and .ts video segments from the local file system, ensuring efficient delivery with support for seek operations and proper browser caching.

Implementation Overview
The core of the streaming logic resides in the backend/internal/vod package. Unlike a standard file server, this handler implements specific security measures and protocol-compliant headers to optimize the streaming experience for HLS clients (such as hls.js used in the frontend).

The NewHandler Constructor
The NewHandler(dataDir string) function creates an http.Handler that maps incoming HTTP requests to files within a specific data directory
backend/internal/vod/handler.go
11

Request Processing Flow
Path Sanitization: The handler uses filepath.Clean on the request URL path to prevent directory traversal attacks
backend/internal/vod/handler.go
13
File Access: It joins the sanitized path with the dataDir and opens the file directly via os.Open
backend/internal/vod/handler.go
14-19
Metadata Extraction: It retrieves file information (size, modification time) and ensures the requested path is not a directory
backend/internal/vod/handler.go
29-33
HLS Content-Type Switching: The handler inspects the file extension to apply specific headers
backend/internal/vod/handler.go
36-43
Range Support: It utilizes http.ServeContent to stream the file. This is critical for VOD as it automatically handles Range requests, allowing users to jump to different timestamps in the video
backend/internal/vod/handler.go
47
Sources:

backend/internal/vod/handler.go
1-50
HLS Protocol Handling
The handler applies differentiated logic based on the file extension to comply with HLS requirements:

File Extension Content-Type Cache-Control Purpose
.m3u8 application/vnd.apple.mpegurl no-cache Index/Playlist file that directs the player to segments.
backend/internal/vod/handler.go
37-39
.ts video/mp2t public, max-age=3600 Transport Stream segments containing actual video/audio data.
backend/internal/vod/handler.go
40-43
Resource Management
To prevent memory leaks and file descriptor exhaustion, the handler explicitly defers file.Close() immediately after a successful open
backend/internal/vod/handler.go
26

Sources:

backend/internal/vod/handler.go
35-43
backend/internal/vod/handler.go
25-27
Data Architecture
The streaming system relies on a specific directory structure within backend/data/. This directory contains the HLS manifest and the corresponding encrypted or raw video segments.

Directory Structure Example
partida-t1-geng.m3u8: The master playlist containing metadata and the sequence of segments
backend/data/partida-t1-geng.m3u8
1-17
partida-t1-geng0.ts, partida-t1-geng1.ts, etc.: Binary MPEG-2 Transport Stream files
backend/data/partida-t1-geng0.ts
1-36
Streaming Component Diagram
This diagram illustrates how the vod.NewHandler interacts with the file system and the http standard library to serve HLS content.

HLS Streaming Logic

Sources:

backend/internal/vod/handler.go
11-50
backend/data/partida-t1-geng.m3u8
1-6
Code Entity Mapping
The following diagram bridges the natural language concepts of VOD streaming to the specific Go entities and file structures.

Entity Mapping: VOD Handler to File System

Sources:

backend/internal/vod/handler.go
11-12
backend/internal/vod/handler.go
47
backend/data/partida-t1-geng.m3u8
1-17

## DAtabase Layer

Database Layer
Relevant source files
.gitignore
backend/go.sum
backend/internal/db/database.go
The Database Layer provides the persistence backbone for the LoL VOD Platform, utilizing PostgreSQL (hosted via Supabase) to store processed match telemetry and user-specific data. It is implemented as a singleton pattern within the backend, ensuring a shared connection pool across the API, match processing, and real-time statistics services.

Implementation Details
The core of the database layer resides in backend/internal/db/database.go. It leverages the standard library database/sql package in conjunction with the lib/pq driver to manage connections to the PostgreSQL instance.

Global Singleton: db.DB
The package exports a global variable DB of type \*sql.DB
backend/internal/db/database.go
14
This pointer is initialized once during application startup and is subsequently used by other packages (such as service and stats) to execute queries and transactions.

Initialization Flow: InitDB()
The InitDB() function
backend/internal/db/database.go
17-48
handles the lifecycle of the database connection:

Environment Loading: It attempts to locate a .env file in the current working directory using godotenv.Load()
backend/internal/db/database.go
19-25
If the file is missing, it falls back to system environment variables.
Configuration: It retrieves the connection string from the DATABASE_URL environment variable
backend/internal/db/database.go
28-31
Connection Opening: It calls sql.Open("postgres", dbURL) to initialize the driver
backend/internal/db/database.go
34-37
Health Check: It executes a Ping() to verify that the remote Supabase instance is reachable and credentials are valid
backend/internal/db/database.go
40-43
Connection Setup Diagram
This diagram illustrates how the InitDB() function bridges the environment configuration to the live sql.DB object.

Database Initialization Sequence

Sources:
backend/internal/db/database.go
17-48

backend/go.sum
3-6

Data Schema & Table Contracts
While the database layer handles the connection, the schema is consumed by various internal services. The platform relies on two primary tables to manage match data and user personalization.

Table: matches_data
This table stores the results of the Riot API processing pipeline. It is primarily populated by the Match Processing Service.

Column Type Description
match_id TEXT (PK) Unique identifier from Riot (e.g., "LA1_12345")
processed_data JSONB Array of ProcessedFrame objects containing gold, kills, and positions.
vod_url TEXT URL to the HLS stream or YouTube VOD.
match_info JSONB Metadata including participants, champion IDs, and game version.
start_time_offset INT Milliseconds offset to sync VOD start with game time 0.
Table: user_saved_matches
This table manages the "Saved Matches" feature on the dashboard. It creates a many-to-many relationship between users (managed by Supabase Auth) and match IDs.

Column Type Description
user_id UUID (FK) Reference to auth.users in Supabase.
match_id TEXT (FK) Reference to matches_data.match_id.
created_at TIMESTAMPTZ Timestamp when the user saved the match.
Entity Relationship Mapping
The following diagram maps the Go code entities to the underlying PostgreSQL storage structures.

Code-to-Database Mapping

Sources:
backend/internal/db/database.go
14

backend/internal/db/database.go
45

Configuration Requirements
The database layer requires the following environment variables to be present either in a .env file at the project root or within the system environment:

DATABASE_URL: A standard PostgreSQL connection URI.
Format: postgres://[user]:[password]@[host]:[port]/[dbname]?sslmode=require
Example: Used in db.InitDB() to establish the connection
backend/internal/db/database.go
28-34
Dependencies
The layer utilizes two external libraries as defined in backend/go.sum:

github.com/lib/pq: The pure Go Postgres driver for database/sql
backend/go.sum
5-6
github.com/joho/godotenv: Used to load the .env configuration file into the process environment
backend/go.sum
3-4
Sources:
backend/internal/db/database.go
9-11

backend/go.sum
1-7

# Frontend

Frontend
Relevant source files
frontend/src/App.tsx
frontend/src/main.tsx
The LoL VOD Platform frontend is a React-based Single Page Application (SPA) built with TypeScript and Vite. It provides a real-time telemetry interface for League of Legends VOD analysis, integrating Supabase for authentication and data persistence, and utilizing WebSockets for live data synchronization.

System Architecture Overview
The frontend is structured around a centralized authentication provider and a protected routing system. It serves three primary views: a user dashboard for match selection, a specialized video player for analysis, and an authentication portal.

The following diagram illustrates the relationship between the core application shell and the underlying code entities:

Frontend Entry & Routing Structure

Sources:
frontend/src/main.tsx
1-18

frontend/src/App.tsx
8-100

Application Shell & Routing
The application entry point in main.tsx initializes the React root and wraps the entire tree in the AuthProvider to ensure session state is available globally
frontend/src/main.tsx
8-17

The App.tsx component serves as the layout controller and router. It implements a ProtectedRoute Higher-Order Component (HOC) that intercepts navigation attempts to restricted areas, redirecting unauthenticated users to the /auth route
frontend/src/App.tsx
9-25
The UI features a sticky header that provides navigation and displays the current user's email, alongside a handleLogout function that clears the Supabase session
frontend/src/App.tsx
31-70

For details, see Application Shell & Routing.

Authentication System
The platform leverages Supabase for identity management. The AuthContext.tsx manages the session lifecycle, exposing a useAuth hook for components to access the current user object and loading state
frontend/src/App.tsx
5-10
The AuthView.tsx provides a unified interface for both login and registration, while the supabaseClient.ts maintains a singleton connection to the backend services.

For details, see Authentication System.

Dashboard View
The DashboardView.tsx serves as the landing page for authenticated users. It performs concurrent queries to the Supabase matches_data and user_saved_matches tables to populate the match list. It supports client-side filtering via an activeTab state, allowing users to toggle between viewing all available matches or only their saved "favorites"
frontend/src/App.tsx
74-81

For details, see Dashboard View.

Watch View & VOD Analysis
The WatchView.tsx is the most complex view in the application, acting as a coordinator for real-time telemetry. It extracts the matchId from the URL parameters
frontend/src/App.tsx
84-90
and fetches the corresponding match metadata, including the YouTube VOD URL and start_time_offset. It orchestrates the synchronization between the video player and the Go backend's WebSocket stats feed.

Watch View Coordination Logic

Sources:
frontend/src/App.tsx
84-90

frontend/src/pages/WatchView.tsx
(referenced by context)

For details, see Watch View & VOD Analysis.

## Application Shell & Routing

Application Shell & Routing
Relevant source files
frontend/src/App.tsx
frontend/src/main.tsx
This section describes the architectural foundation of the frontend application, focusing on the root mounting process, the global authentication wrapper, and the declarative routing structure that governs navigation and access control.

Entry Point & Global Providers
The application initializes in frontend/src/main.tsx, which serves as the entry point for the Vite-based build system. It mounts the React application into the DOM element with the ID root
frontend/src/main.tsx
8

The component tree is wrapped in two critical providers:

AuthProvider: Manages the Supabase session state and provides authentication context to the entire application
frontend/src/main.tsx
11-15
BrowserRouter: Enables client-side routing using the react-router-dom library
frontend/src/main.tsx
12-14
Initialization Data Flow
The following diagram illustrates how the application bootstraps and establishes the security context before rendering the UI.

Application Bootstrap Flow

Sources:
frontend/src/main.tsx
8-17

frontend/src/App.tsx
9-25

Application Shell (App.tsx)
The App component defines the persistent visual structure (the "Shell") and the routing logic. It includes a sticky header that remains visible across all views, providing branding and session management controls
frontend/src/App.tsx
38-70

Global Header & Navigation
The header performs conditional rendering based on the user object retrieved from useAuth()
frontend/src/App.tsx
28
:

Authenticated State: Displays the user's email and a "Cerrar Sesión" (Logout) button
frontend/src/App.tsx
48-59
Unauthenticated State: Displays a link to the /auth route
frontend/src/App.tsx
60-67
The handleLogout function utilizes the supabase.auth.signOut() method and redirects the user to the authentication page using useNavigate
frontend/src/App.tsx
31-34

Route Table & Protection
The application uses a declarative route table. Access to data-sensitive views is gated by the ProtectedRoute Higher-Order Component (HOC).

Path Component Protection Description
/ DashboardView ProtectedRoute The main landing page listing available matches.
/watch/:matchId WatchView ProtectedRoute The VOD player and real-time telemetry interface.
/auth AuthView Public / Guest Login and registration forms. Redirects to / if already logged in.
Sources:
frontend/src/App.tsx
72-97

Route Guarding Logic
The ProtectedRoute component
frontend/src/App.tsx
9-25
is the primary mechanism for enforcing authentication. It monitors the loading and user states from the AuthContext.

Loading State: While the Supabase session is being recovered from local storage, it returns a pulse animation with the text "Validando sesión..."
frontend/src/App.tsx
12-18
Unauthenticated State: If loading is false and no user exists, it uses the <Navigate /> component to redirect to /auth
frontend/src/App.tsx
20-22
Authenticated State: If a user is present, it renders the children components (the protected view)
frontend/src/App.tsx
24
Routing Implementation Diagram
This diagram maps the logical routes to their specific component implementations and the guard mechanism.

Routing and Component Mapping

Sources:
frontend/src/App.tsx
9-25

frontend/src/App.tsx
74-97

View Definitions
DashboardView (/)
The root route serves as the entry point for authenticated users. It lists available LoL matches fetched from the backend database. Each match entry links to the /watch/:matchId route
frontend/src/App.tsx
74-81

WatchView (/watch/:matchId)
This route uses a dynamic parameter :matchId which is consumed by the component to fetch specific telemetry and VOD metadata. It is the primary interface for game analysis
frontend/src/App.tsx
83-90

AuthView (/auth)
Handles user identity. It contains logic to toggle between "Login" and "Sign Up" modes. If a user navigates here while already authenticated, App.tsx triggers an automatic redirect back to the Dashboard
frontend/src/App.tsx
93-96

Sources:
frontend/src/App.tsx
1-5

frontend/src/App.tsx
72-97

## Authentication System

Authentication System
Relevant source files
backend/internal/riot/client.go
frontend/src/core/AuthContext.tsx
frontend/src/core/supabaseClient.ts
frontend/src/features/auth/RegisterForm.tsx
frontend/src/features/auth/useAuth.ts
frontend/src/pages/AuthView.tsx
The LoL VOD Platform utilizes Supabase Auth for identity management, providing a secure foundation for user sessions and profile management. The system is built around a centralized React Context that manages the session lifecycle, a singleton client for API interactions, and a PostgreSQL trigger pattern to synchronize authentication events with application-specific user profiles.

Core Infrastructure
The authentication infrastructure relies on two primary entities: the supabaseClient which provides the underlying communication layer, and the AuthContext which exposes the authentication state to the React component tree.

Supabase Client Singleton
The system initializes a singleton instance of the Supabase client using environment variables. This client is used by both the context and individual hooks to interact with Supabase services.

Variable Source Description
VITE_SUPABASE_URL import.meta.env The project-specific Supabase API URL.
VITE_SUPABASE_ANON_KEY import.meta.env The public anonymous key for client-side requests.
Sources:
frontend/src/core/supabaseClient.ts
1-13

Authentication Context & Lifecycle
The AuthProvider component serves as the root of the authentication system. It maintains the Session and User objects in its local state and provides them via the useAuth hook.

The lifecycle is managed through two primary mechanisms in an useEffect block:

Initial Fetch: Calls supabase.auth.getSession() to check for existing sessions in local storage during the first mount
frontend/src/core/AuthContext.tsx
30-34
Subscription: Establishes a listener via supabase.auth.onAuthStateChange to react to login, logout, or session refresh events in real-time
frontend/src/core/AuthContext.tsx
36-42
Sources:
frontend/src/core/AuthContext.tsx
12-54

Authentication Flow Diagram
The following diagram illustrates the flow from the user interface through the AuthContext to the Supabase backend.

Sources:
frontend/src/core/AuthContext.tsx
36-42

frontend/src/pages/AuthView.tsx
23-45

frontend/src/features/auth/useAuth.ts
20-29

Implementation Details
Login and Registration (AuthView)
The AuthView component manages a combined interface for both login and registration, controlled by an isSignUp boolean toggle
frontend/src/pages/AuthView.tsx
12

Sign In: Executes supabase.auth.signInWithPassword using the email and password provided by the user
frontend/src/pages/AuthView.tsx
39-42
Sign Up: Executes supabase.auth.signUp. Crucially, it passes username and full_name within the options.data object (User Metadata). This metadata is required for the backend profile creation logic
frontend/src/pages/AuthView.tsx
23-31
Sources:
frontend/src/pages/AuthView.tsx
1-51

Profile Creation Pattern
The platform uses a PostgreSQL Trigger Pattern to ensure every authenticated user has a corresponding application profile. When a user registers, the metadata provided in the signUp call is captured by a database trigger in Supabase.

The useAuth hook (found in the features directory) specifically handles this metadata-heavy registration:

It accepts email, password, username, and fullName
frontend/src/features/auth/useAuth.ts
9-13
It sends these to the auth.signUp method
frontend/src/features/auth/useAuth.ts
20-29
The database trigger then automatically populates the internal application tables using this metadata
frontend/src/features/auth/useAuth.ts
33-35
Sources:
frontend/src/features/auth/useAuth.ts
9-44

frontend/src/features/auth/RegisterForm.tsx
13-26

Code Entity Mapping
This diagram maps the functional components of the authentication system to their specific file locations and responsibilities.

Sources:
frontend/src/core/supabaseClient.ts
1-13

frontend/src/core/AuthContext.tsx
12-22

frontend/src/features/auth/useAuth.ts
4-48

frontend/src/pages/AuthView.tsx
5-13

Error Handling and Feedback
Authentication states and errors are handled locally within the components and propagated via state:

Loading States: The AuthProvider maintains a global loading state to prevent flashes of unauthenticated content during session restoration
frontend/src/core/AuthContext.tsx
27-33
Form Validation: The RegisterForm enforces a minimum password length of 6 characters and requires all fields before submission
frontend/src/features/auth/RegisterForm.tsx
82-95
Error Display: Errors from the Supabase API are caught in try-catch blocks and displayed to the user via a dedicated error state in the UI
frontend/src/pages/AuthView.tsx
66-70
Sources:
frontend/src/pages/AuthView.tsx
46-50

frontend/src/features/auth/RegisterForm.tsx
97-101

## Dashboard View

Dashboard View
Relevant source files
frontend/src/pages/DashboardView.tsx
The DashboardView serves as the primary landing page for authenticated users. It provides a searchable and filterable catalog of processed League of Legends matches available for analysis. The view integrates data from both global match records and user-specific saved lists to provide a personalized experience.

Data Fetching and Synchronization
The component utilizes the useAuth hook to access the current user session and performs concurrent queries to Supabase upon mounting.

Concurrent Queries
The fetchData function
frontend/src/pages/DashboardView.tsx
20-47
executes two primary asynchronous operations:

Global Matches: Fetches all records from the matches_data table, ordered by creation date
frontend/src/pages/DashboardView.tsx
25-28
User Saved Matches: Fetches the IDs of matches that the specific user has bookmarked from the user_saved_matches table
frontend/src/pages/DashboardView.tsx
31-34
Optimization with Sets
To ensure high performance when filtering and rendering badges, the list of saved match IDs is transformed into a Set<string>
frontend/src/pages/DashboardView.tsx
42-43
This allows for $O(1)$ complexity lookups during the render cycle to determine if a specific match is "saved" by the user.

Data Flow: Dashboard Initialization Title: Dashboard Data Retrieval Flow

Sources:
frontend/src/pages/DashboardView.tsx
10-50

Client-Side Filtering (Tabs)
The view implements a tabbed interface to switch between the full catalog and the user's personal collection. This filtering is performed entirely on the client side to provide instantaneous UI updates.

Tab State (activeTab) Logic Empty State Message
all Returns the full allMatches array
frontend/src/pages/DashboardView.tsx
54-55
"No hay partidas procesadas en el servidor."
saved Filters allMatches using savedMatchIds.has(match.match_id)
frontend/src/pages/DashboardView.tsx
56
"No tienes partidas guardadas en tu perfil."
Sources:
frontend/src/pages/DashboardView.tsx
52-56

frontend/src/pages/DashboardView.tsx
101-104

Match Card Rendering
Each match is rendered as a card containing metadata and a navigation link to the analysis view.

Component Logic
Navigation: Uses the Link component to route the user to /watch/:matchId
frontend/src/pages/DashboardView.tsx
148-153
ID Parsing: The UI displays a truncated version of the Riot Match ID (splitting by underscores) for better readability
frontend/src/pages/DashboardView.tsx
136-138
Dynamic Badges:
If isSaved is true (lookup in savedMatchIds Set), a "⭐ Guardado" badge is displayed
frontend/src/pages/DashboardView.tsx
127-130
Otherwise, a "Público" badge is shown
frontend/src/pages/DashboardView.tsx
132-134
Entity Mapping: Dashboard UI to Code Title: Dashboard View Entity Mapping

Sources:
frontend/src/pages/DashboardView.tsx
6-162

UI States
The component handles three distinct UI states to ensure a smooth user experience:

Loading State: While loading is true, an animated pulse message "Sincronizando base de datos..." is displayed
frontend/src/pages/DashboardView.tsx
95-98
Empty States: Context-aware messages are shown if the displayedMatches array is empty, differing based on whether the user is looking at the global list or their saved list
frontend/src/pages/DashboardView.tsx
99-105
Grid View: A responsive CSS grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) displays the match cards when data is available
frontend/src/pages/DashboardView.tsx
106
Sources:
frontend/src/pages/DashboardView.tsx
95-106

## Watch View & VOD Analysis

Watch View & VOD Analysis
Relevant source files
frontend/src/features/player/useGameStats.ts
frontend/src/pages/WatchView.tsx
The WatchView component serves as the central coordinator for the VOD analysis experience. It integrates video playback, real-time telemetry via WebSockets, and match metadata fetched from Supabase to provide a synchronized interface for reviewing League of Legends matches.

Implementation Overview
WatchView.tsx orchestrates the data flow by extracting the matchId from the URL, fetching match configuration (VOD URLs and offsets), and establishing a WebSocket connection for frame-by-second game statistics. It manages the layout using a responsive grid that balances the video player and telemetry overlays with a persistent scoreboard.

Data Flow Diagram
The following diagram illustrates how WatchView coordinates data from multiple sources to hydrate the UI components.

WatchView Coordination Flow

Sources:
frontend/src/pages/WatchView.tsx
12-30

frontend/src/pages/WatchView.tsx
152-176

frontend/src/features/player/useGameStats.ts
15-27

Core Implementation Details
Match Initialization & YouTube Extraction
Upon mounting, the component performs a single-row query to the matches_data table using the matchId parameter
frontend/src/pages/WatchView.tsx
37-41

The vod_url is parsed to extract the YouTube video ID. It supports both standard URL formats (v=ID) and shortened share links
frontend/src/pages/WatchView.tsx
46-52
The start_time_offset is retrieved to calibrate the synchronization between the YouTube player's current time and the Riot API timeline
frontend/src/pages/WatchView.tsx
51-52

Champion Map Construction
To display human-readable names in logs and overlays, WatchView builds a championMap. It parses the match_info JSON blob (stored in Supabase from the Riot Match-V5 API) to map participantId integers to championName strings
frontend/src/pages/WatchView.tsx
54-66

WebSocket Integration
The view utilizes the useGameStats hook to maintain a bidirectional connection with the Go backend
frontend/src/pages/WatchView.tsx
28-30

Outgoing: As the VideoPlayer polls the current time, it triggers updateServerTime
frontend/src/features/player/useGameStats.ts
40-50
Throttling: The hook ensures updates are only sent once per second by comparing Math.floor(currentTime) against lastSentTimeRef
frontend/src/features/player/useGameStats.ts
43-49
Incoming: The backend responds with MatchFrameData, which is stored in the stats state and propagated to all telemetry components
frontend/src/features/player/useGameStats.ts
24-27
Sources:
frontend/src/pages/WatchView.tsx
13-66

frontend/src/features/player/useGameStats.ts
40-50

User Interactions
Match Saving Flow
Users can persist matches to their profile via the user_saved_matches table. WatchView manages this state through the toggleSaveMatch function.

Action Logic Database Operation
Check Status On load, queries if a record exists for user.id and matchId maybeSingle() on user_saved_matches
Save If isSaved is false, inserts a new relation insert([{ user_id, match_id }])
Remove If isSaved is true, deletes the existing relation delete().eq(user_id).eq(match_id)
Sources:
frontend/src/pages/WatchView.tsx
69-80

frontend/src/pages/WatchView.tsx
88-111

Layout & Responsive Grid
The view uses a Tailwind CSS grid to handle complex overlays and scrolling behavior.

Primary Column (lg:col-span-2):
Video Container: An aspect-video relative container holding the VideoPlayer and the NotificationFeed overlay
frontend/src/pages/WatchView.tsx
151-160
Timeline & Logs: Below the video, the MatchTimeline (visual chart) and MatchEventLog (scrollable text events) are rendered
frontend/src/pages/WatchView.tsx
162-165
Secondary Column (Sticky Sidebar):
Telemetry Panel: A fixed-height (h-[600px]) container that stays in view (sticky top-20) while the user scrolls through the logs. It houses the MatchScoreboard
frontend/src/pages/WatchView.tsx
168-176
Component Entity Map

Sources:
frontend/src/pages/WatchView.tsx
149-177

frontend/src/pages/WatchView.tsx
16-30

# Player Feature & Components

Player Feature Components
Relevant source files
backend/data/reporte_probabilidades.csv
frontend/src/features/player/PlayerPanel.tsx
frontend/src/features/player/VideoPlayer.tsx
frontend/src/features/player/useSmartUI.ts
The frontend/src/features/player/ module contains the core UI logic and components responsible for the interactive VOD analysis experience. This module bridges the gap between static video playback and real-time telemetry data received from the backend, providing users with a synchronized view of game states, win probabilities, and event logs.

Component Architecture
The feature is organized into three main functional groups: playback synchronization, telemetry visualization, and historical event tracking. These components rely on a WebSocket connection to fetch frame-accurate data based on the current timestamp of the video player.

System Mapping: UI to Code Entities
The following diagram maps the visual elements of the VOD player to their respective code implementations and data sources.

VOD Player Entity Map

Sources:
frontend/src/features/player/VideoPlayer.tsx
1-60

frontend/src/features/player/PlayerPanel.tsx
1-93

Feature Groups
The player features are divided into the following specialized areas:

1. Video Player & Time Synchronization
   This group handles the core playback engine and the synchronization logic. It uses a 1000ms polling interval to determine the current gameTime by subtracting the startTimeOffset from the YouTube player's current time. This time is then propagated to the WebSocket hook to fetch the corresponding telemetry frame.

Key Entities: VideoPlayer, useGameStats, VODWebSocketClient.
For details, see Video Player & Time Synchronization. 2. Telemetry Overlay Components
These components render real-time data directly over the video stream. It includes an expandable "Glass Panel" for player stats and an intelligent UI controller (useSmartUI) that hides overlays after 2500ms of inactivity to provide an unobstructed viewing experience.

Key Entities: PlayerPanel, WinProbabilityBar, DragonTimer, useSmartUI.
For details, see Telemetry Overlay Components. 3. Match Event Log & Scoreboard
This group manages the historical data of the match. It processes raw events (kills, item purchases) into a readable log and displays team-wide statistics in a tabular format. It includes logic for deduplicating events and auto-scrolling the feed as new events occur.

Key Entities: MatchEventLog, MatchScoreboard, MatchTimeline, NotificationFeed.
For details, see Match Event Log & Scoreboard.
Data Synchronization Flow
The synchronization between the video and the telemetry data is the most critical aspect of the feature. The following diagram illustrates how the frontend ensures that the UI matches the action on screen.

Synchronization Pipeline

Sources:
frontend/src/features/player/VideoPlayer.tsx
18-32

frontend/src/features/player/useSmartUI.ts
3-44

Implementation Details
Component/Hook Responsibility Key Logic
VideoPlayer.tsx Wraps react-youtube and calculates game time. Uses playerRef to poll getCurrentTime
frontend/src/features/player/VideoPlayer.tsx
21-23
PlayerPanel.tsx Displays player-specific stats (KDA, Items). Detects team via t1/t2 prefix and fetches assets from DataDragon
frontend/src/features/player/PlayerPanel.tsx
23-56
useSmartUI.ts Manages overlay visibility. Implements 2500ms timeout; remains visible if isPlaying is false
frontend/src/features/player/useSmartUI.ts
19-23
Sources:
frontend/src/features/player/VideoPlayer.tsx
1-60

frontend/src/features/player/PlayerPanel.tsx
1-93

frontend/src/features/player/useSmartUI.ts
1-45

## Video Player & Time Synchronization

Video Player & Time Synchronization
Relevant source files
frontend/src/core/websocket.ts
frontend/src/features/player/VideoPlayer.tsx
frontend/src/features/player/useGameStats.ts
This section details the implementation of the core synchronization engine that aligns YouTube VOD playback with real-time match telemetry. The system utilizes a polling mechanism to calculate game-relative time and a WebSocket-based communication layer to fetch corresponding match statistics from the Go backend.

Video Player Implementation
The VideoPlayer component acts as the primary visual interface and time source for the application. It leverages the react-youtube library to wrap the YouTube IFrame Player API.

Calibration and Offsets
Because VODs often contain intro segments or pre-game footage, the component uses a startTimeOffset prop
frontend/src/features/player/VideoPlayer.tsx
7-14
This offset is used in two ways:

Initial Seek: The player starts at the offset time using the YouTube start parameter
frontend/src/features/player/VideoPlayer.tsx
49
Game Time Calculation: The absolute YouTube player time is converted to match-relative time by subtracting the offset: gameTime = Math.floor(currentTime - startTimeOffset)
frontend/src/features/player/VideoPlayer.tsx
23
Polling Mechanism
The component maintains a 1000ms interval to track playback progress
frontend/src/features/player/VideoPlayer.tsx
19-29
Every second, it queries the playerRef for the current time and executes the onTimeUpdate callback provided by the parent coordinator (WatchView).

Component Structure & Data Flow
The following diagram illustrates how the VideoPlayer interacts with the YouTube API and propagates time updates.

Diagram: VideoPlayer Time Propagation

Sources:
frontend/src/features/player/VideoPlayer.tsx
10-60

Real-Time Stats Hook (useGameStats)
The useGameStats hook manages the lifecycle of the WebSocket connection and provides a throttled interface for updating the server on the current playback position.

State and Lifecycle
VODWebSocketClient: A reference to the WebSocket manager is stored in wsClientRef
frontend/src/features/player/useGameStats.ts
17
Throttling: To prevent flooding the backend with redundant requests, the hook uses lastSentTimeRef to ensure the sendMessage call only triggers once per unique second of game time
frontend/src/features/player/useGameStats.ts
46-49
MatchFrameData Interface
The hook defines the MatchFrameData interface, which is a TypeScript mirror of the Go backend's ProcessedFrame struct
frontend/src/features/player/useGameStats.ts
7-13

Field Type Description
minute number The current minute of the match.
blueTeamGold number Cumulative gold for the Blue team.
redTeamGold number Cumulative gold for the Red team.
goldDifference number Net difference (Blue - Red).
winProbability number Calculated probability (0.0 to 1.0).
Sources:
frontend/src/features/player/useGameStats.ts
7-53

WebSocket Communication Layer
The VODWebSocketClient class handles the low-level WebSocket API interactions, including connection persistence and message parsing.

Connection Management
Auto-Reconnect: If the connection is lost, the client logs a warning and attempts to reconnect after 3 seconds using setTimeout
frontend/src/core/websocket.ts
42-46
Notifications: The client uses the sileo library to provide visual feedback to the user via toast notifications upon successful connection or connection failure
frontend/src/core/websocket.ts
25-44
Data Handling
When a message is received, the client parses the raw JSON directly into a MatchFrameData object and notifies subscribers
frontend/src/core/websocket.ts
28-40

Diagram: WebSocket Data Flow (Code Entities)

Key Methods
connect(): Initializes the WebSocket instance and sets up event listeners (onopen, onmessage, onclose, onerror)
frontend/src/core/websocket.ts
20-51
subscribe(callback): Registers a listener for incoming MatchFrameData
frontend/src/core/websocket.ts
16-18
sendMessage(payload): Sends a JSON-stringified object to the server if the socket state is OPEN
frontend/src/core/websocket.ts
53-57
Sources:
frontend/src/core/websocket.ts
7-58

frontend/src/features/player/useGameStats.ts
15-37

## Telemetry Overlay Components

Telemetry Overlay Components
Relevant source files
backend/data/reporte_probabilidades.csv
frontend/src/core/decoder.ts
frontend/src/features/player/DragonTimer.tsx
frontend/src/features/player/PlayerPanel.tsx
frontend/src/features/player/WinProbabilityBar.tsx
frontend/src/features/player/useSmartUI.ts
The Telemetry Overlay components provide a real-time, interactive data layer on top of the VOD stream. These components consume decoded WebSocket payloads to visualize player statistics, objective timers, and match analytics without obstructing the viewing experience.

Player Panel and Inventory
The PlayerPanel.tsx component renders a vertical stack of player avatars on the right side of the video player. It utilizes a "glass panel" design that expands to reveal detailed player information and inventory.

Key Features
Team Detection: It identifies the player's team by checking if the player.id starts with "t1" (Blue) or "t2" (Red)
frontend/src/features/player/PlayerPanel.tsx
23
Expandable UI: A state-driven expansion mechanism (expandedPlayerId) toggles a detailed info panel
frontend/src/features/player/PlayerPanel.tsx
10-13
Asset Integration: Champion and item images are fetched dynamically from DataDragon using utility functions
frontend/src/features/player/PlayerPanel.tsx
56

frontend/src/features/player/PlayerPanel.tsx
82
Data Flow: Player Data to UI
The following diagram illustrates how raw player data from the decoder is mapped to the interactive panel.

Figure 1: Player Panel Data Mapping

Sources:
frontend/src/features/player/PlayerPanel.tsx
9-93

frontend/src/core/decoder.ts
20-26

Smart UI Visibility
The useSmartUI.ts hook manages the visibility of the telemetry overlays based on user activity and the playback state of the video.

Implementation Logic
Activity Monitoring: Listens for mousemove and click events to trigger handleActivity
frontend/src/features/player/useSmartUI.ts
27-28
Conditional Auto-Hide: If the video is playing (isPlaying === true), a 2500ms timeout is set to hide the UI (setIsUIVisible(false))
frontend/src/features/player/useSmartUI.ts
19-23
Pause Persistence: If the video is paused, the timeout is cleared or never started, allowing analysts to inspect stats indefinitely
frontend/src/features/player/useSmartUI.ts
17-18
Sources:
frontend/src/features/player/useSmartUI.ts
3-44

Win Probability Visualization
The WinProbabilityBar.tsx component provides a real-time visual representation of the match's momentum, derived from the winProbability field in the GameStats payload.

UI Styling and Transitions
Dynamic Widths: The bar uses CSS transition-[width] with a 1000ms duration to smoothly animate shifts in probability
frontend/src/features/player/WinProbabilityBar.tsx
25-31
Conditional Shadows: The component applies specific shadow colors (rgba(37,99,235,0.3) for Blue, rgba(220,38,38,0.3) for Red) depending on which team is currently favored
frontend/src/features/player/WinProbabilityBar.tsx
20-22
Probability Component Structure
Figure 2: Win Probability Logic

Sources:
frontend/src/features/player/WinProbabilityBar.tsx
1-44

frontend/src/core/decoder.ts
57

Objective Timers
The DragonTimer.tsx component displays a countdown for the next dragon objective. It combines server-side synchronization with client-side interpolation to ensure smooth updates.

Interpolation Engine
Master Sync: When the backend sends a new serverTimer value via WebSocket, the displayTimer state is updated immediately
frontend/src/features/player/DragonTimer.tsx
12-16
Local Interpolation: An internal setInterval runs every 1000ms to decrement the displayTimer
frontend/src/features/player/DragonTimer.tsx
23-30
Playback Awareness: The interval is only active if isPlaying is true. If the video pauses, the interval is cleared to prevent the timer from drifting away from the VOD timestamp
frontend/src/features/player/DragonTimer.tsx
21-33
Data Structure Comparison
The following table shows how telemetry data is represented across different layers.

Field Decoder Key UI Component Description
winProbability w_p WinProbabilityBar Logistic win prob (0-100)
dragonTimer d_t DragonTimer Seconds until next Dragon
goldDifference g_d MatchScoreboard Net gold lead (Blue - Red)
players p_d PlayerPanel Array of participant stats
Sources:
frontend/src/features/player/DragonTimer.tsx
8-44

frontend/src/core/decoder.ts
10-17

backend/data/reporte_probabilidades.csv
1-2

## Match Event Log & Scoreboard

Match Event Log & Scoreboard
Relevant source files
frontend/src/features/player/MatchEventLog.tsx
frontend/src/features/player/MatchScoreboard.tsx
frontend/src/features/player/MatchTimeline.tsx
frontend/src/features/player/NotificationFeed.tsx
frontend/src/index.css
This section covers the telemetry and event visualization components of the VOD platform. These components process real-time data received via WebSockets to provide a historical log of match events, a tabular scoreboard of team gold, a minute-by-minute advantage chart, and an on-video notification feed.

MatchEventLog Component
The MatchEventLog component is responsible for transforming raw game events into a human-readable chronological list. It handles data normalization, team assignment, and automatic scrolling to ensure the most recent events are always visible to the user
frontend/src/features/player/MatchEventLog.tsx
33-36

Data Transformation & Deduplication
The component consumes currentStats which contains a RawEvent array
frontend/src/features/player/MatchEventLog.tsx
4-15
It transforms these into UIEvent objects by:

Mapping Actions: Converting CHAMPION_KILL to "Asesinato ⚔️" and ITEM_PURCHASED to "Compra 💰"
frontend/src/features/player/MatchEventLog.tsx
56-67
Resolving Entities: Using the championMap (provided via props) to resolve killerId or participantId to champion names, and getGameItem for item IDs
frontend/src/features/player/MatchEventLog.tsx
59-71
Team Assignment: Using getSide(), which assigns participants 1-5 to "blue" and 6-10 to "red"
frontend/src/features/player/MatchEventLog.tsx
31
Deduplication: Since the component receives updates frequently, it uses a Set of unique IDs (constructed from minute, type, and participant IDs) to filter out events already present in the local state
frontend/src/features/player/MatchEventLog.tsx
85-91
UI Implementation
Auto-Scroll: A useEffect hook monitors the eventLog state and adjusts the scrollTop of the scrollRef container to the bottom whenever new events are added
frontend/src/features/player/MatchEventLog.tsx
94-98
Empty State: If no events have been recorded for the current match time, it displays "Esperando eventos de la partida..."
frontend/src/features/player/MatchEventLog.tsx
131-139
Event Processing Flow

Sources:
frontend/src/features/player/MatchEventLog.tsx
4-98

MatchScoreboard Component
The MatchScoreboard provides a high-level summary of the current match state, focusing on gold accumulation and team advantage
frontend/src/features/player/MatchScoreboard.tsx
11

Gold Formatting: It converts raw numeric values (e.g., 7500) into "k" notation (7.5k) using a formatGold utility
frontend/src/features/player/MatchScoreboard.tsx
21
Advantage Logic: It calculates the absolute gold difference and applies conditional styling (text-blue-400 or text-red-400) based on which team leads
frontend/src/features/player/MatchScoreboard.tsx
24-25
Loading State: Displays an animated "Esperando telemetría..." message if the stats prop is null
frontend/src/features/player/MatchScoreboard.tsx
12-18
Sources:
frontend/src/features/player/MatchScoreboard.tsx
11-76

MatchTimeline Component
The MatchTimeline visualizes the gold progression of both teams over time using a line chart
frontend/src/features/player/MatchTimeline.tsx
26

Accumulative State: Unlike other components that only care about the "current" frame, MatchTimeline maintains an array of chartData. It appends the currentStats to this array only if the minute doesn't already exist, ensuring a clean chronological line even if the video is scrubbed or paused
frontend/src/features/player/MatchTimeline.tsx
33-45
Recharts Integration: It uses ResponsiveContainer and LineChart to render two lines: one for blueTeamGold (Blue) and one for redTeamGold (Red)
frontend/src/features/player/MatchTimeline.tsx
89-107
Formatting: The Y-Axis uses a tick formatter to display gold in "k" units for better readability
frontend/src/features/player/MatchTimeline.tsx
75
Sources:
frontend/src/features/player/MatchTimeline.tsx
1-112

NotificationFeed Component
The NotificationFeed acts as an overlay on the video player, providing immediate visual feedback for critical game events
frontend/src/features/player/NotificationFeed.tsx
16

Transient Display: When new events arrive, they are stored in activeNotifications. A setTimeout is triggered to clear the notifications after 5000ms, creating a "toast" effect
frontend/src/features/player/NotificationFeed.tsx
22-32
Visual Styling:
Purchases: Displayed with an amber border and a shopping cart icon
frontend/src/features/player/NotificationFeed.tsx
40-59
Kills: Displayed with a red background and a sword icon
frontend/src/features/player/NotificationFeed.tsx
61-80
Interactivity: The container uses pointer-events-none to ensure it does not interfere with video player controls
frontend/src/features/player/NotificationFeed.tsx
38
Telemetry to UI Mapping

Sources:
frontend/src/features/player/MatchScoreboard.tsx
2-8

frontend/src/features/player/MatchEventLog.tsx
12-15

frontend/src/features/player/MatchTimeline.tsx
14-20

frontend/src/features/player/NotificationFeed.tsx
4-10

CSS & Layout Integration
The components are styled using Tailwind CSS and integrated into the global scroll behavior.

Global Scroll: The body is configured with overflow-y: auto to allow users to scroll down from the video player to view the MatchTimeline and MatchEventLog
frontend/src/index.css
12
Custom Scrollbars: A custom scrollbar theme is applied to the MatchEventLog to match the dark IDE-like aesthetic of the platform
frontend/src/index.css
17-29
Sources:
frontend/src/index.css
1-30

# Core Utilities & Data layer

Core Utilities & Data Layer
Relevant source files
frontend/src/core/decoder.ts
frontend/src/core/riotDictionary.ts
frontend/src/features/player/WinProbabilityBar.tsx
The Core Utilities & Data Layer encompasses the shared logic used by the frontend to interpret telemetry data and the physical data assets stored on the backend. This layer bridges the gap between raw Riot Games API responses (JSON/CSV) and the domain-specific interfaces used by the React application to render the VOD analysis experience.

System Mapping: Data to Code
The following diagram illustrates how raw data from the backend assets and WebSocket streams is transformed into usable frontend domain entities.

Data Transformation Pipeline

Sources:
frontend/src/core/decoder.ts
1-64

frontend/src/core/riotDictionary.ts
1-46

frontend/src/features/player/WinProbabilityBar.tsx
1-44

5.1 Payload Decoder & Game Dictionaries
The frontend utilizes a specialized decoding layer to handle the high-frequency telemetry data sent over WebSockets. To minimize bandwidth, the backend sends payloads with "short keys" (e.g., g_d for gold difference), which are then mapped to human-readable interfaces.

Key Components
Component File Path Role
Payload Decoder frontend/src/core/decoder.ts Translates RawStatsPayload with short keys into the GameStats domain interface.
Riot Dictionary frontend/src/core/riotDictionary.ts Static mappings for Item IDs and Participant IDs to Spanish names (e.g., "Botas de Velocidad").
DataDragon Utils frontend/src/core/datadragon.ts Logic for constructing image URLs for champions and items using Riot's CDN.
Domain Models
The system relies on two primary data structures for telemetry:

RawStatsPayload: The wire format containing keys like t (timestamp), w_p (win probability), and p_d (player data)
frontend/src/core/decoder.ts
10-17
GameStats: The clean interface used by React components, featuring full property names like goldDifference and winProbability
frontend/src/core/decoder.ts
28-35
For details, see Payload Decoder & Game Dictionaries.

Sources:
frontend/src/core/decoder.ts
1-64

frontend/src/core/riotDictionary.ts
1-46

5.2 Backend Data Assets
The platform includes a set of static and semi-static data assets located in the backend/data/ directory. These assets provide the source material for the sample match (T1 vs GenG) and the predictive analytics used in the dashboard.

Asset Categories
HLS Stream Assets: Contains the .m3u8 playlist and .ts video segments for the sample match.
Raw Telemetry: The timeline.json file represents the direct output from the Riot Games API, containing every frame and event of the match.
Analytics CSV: The reporte_probabilidades.csv file provides pre-calculated win probabilities and gold differences at 1-second intervals.
Relationship between Assets and Components

Sources:
frontend/src/features/player/WinProbabilityBar.tsx
5-43

frontend/src/core/decoder.ts
52-59

For details, see Backend Data Assets.

Technical Implementation Details
Win Probability Logic
The WinProbabilityBar component consumes the winProbability field decoded from the payload
frontend/src/core/decoder.ts
57
It calculates the relative percentage for both teams and applies conditional styling (shadows and widths) based on which team is currently leading
frontend/src/features/player/WinProbabilityBar.tsx
20-31

Dictionary Lookups
The riotDictionary.ts provides utility functions like getGameItem and getParticipantName
frontend/src/core/riotDictionary.ts
37-45
These functions handle missing IDs gracefully by returning a placeholder string (e.g., Ítem [ID])
frontend/src/core/riotDictionary.ts
39

Sources:
frontend/src/core/decoder.ts
38-64

frontend/src/core/riotDictionary.ts
1-46

frontend/src/features/player/WinProbabilityBar.tsx
1-44

## Payload Decoder & Game Dictionaries

Payload Decoder & Game Dictionaries
Relevant source files
frontend/src/core/decoder.ts
frontend/src/core/riotDictionary.ts
frontend/src/features/player/WinProbabilityBar.tsx
This section covers the core data transformation layer and static game assets within the frontend. It explains how raw, compressed payloads received from the Go backend via WebSocket are normalized into domain-specific interfaces, and how numeric Riot Games IDs are mapped to human-readable strings and visual assets using DataDragon.

1. Payload Decoder
   The decoder.ts utility is responsible for transforming the high-density, short-key JSON payloads sent by the backend into a structured format used by React components. This mapping minimizes bandwidth by using single-letter keys for real-time transmission.

Data Flow: Raw to Domain
The transformation follows a strict pipeline where RawStatsPayload (short keys) is converted into GameStats (descriptive keys).

Raw Key Domain Key Type Description
t timestamp number Current game time in seconds.
g_d goldDifference number Relative gold lead (Blue - Red).
d_t dragonTimer number Seconds until next Dragon spawn.
b_t baronTimer number Seconds until next Baron spawn.
w_p winProbability number Calculated win chance for Blue team.
p_d players PlayerData[] Array of participant-specific statistics.
Implementation Details
The core function decodePayload
frontend/src/core/decoder.ts
38-64
parses the incoming string. It maps the RawPlayerData
frontend/src/core/decoder.ts
2-8
fields (such as n for name, c for champion, and i for items) into the normalized PlayerData
frontend/src/core/decoder.ts
20-26
interface.

Payload Transformation Diagram This diagram bridges the "Natural Language Space" of the UI to the "Code Entity Space" of the decoder.

Sources:
frontend/src/core/decoder.ts
1-64

frontend/src/features/player/WinProbabilityBar.tsx
1-44

2. Riot Dictionaries
   The riotDictionary.ts file acts as a translation layer between the numeric IDs provided by the Riot API and the Spanish localization used in the platform's UI.

Key Mappings
ITEM_MAP: A record mapping numeric item IDs (e.g., 1038) to Spanish names (e.g., "Espadón")
frontend/src/core/riotDictionary.ts
2-16
CHAMPION_MAP: A mapping of participantId (1-10) to a string containing the Champion name and their assigned Role
frontend/src/core/riotDictionary.ts
21-34
This is currently used as a mock for testing specific VODs but is designed to be replaced by dynamic draft data.
Utility Functions
The module provides two primary helper functions to ensure the UI handles missing or unknown data gracefully:

getGameItem(id): Returns the item name or a fallback string Ítem [ID] if the ID is not in the dictionary
frontend/src/core/riotDictionary.ts
37-40
getParticipantName(id): Returns the Champion/Role string or Jugador [ID] as a fallback
frontend/src/core/riotDictionary.ts
42-45
Sources:
frontend/src/core/riotDictionary.ts
1-46

3. DataDragon & Asset Integration
   The platform utilizes Riot's DataDragon service to fetch high-quality game assets (champion icons, item images) without hosting them locally.

Configuration
The D_DRAGON_VERSION constant (typically set to a specific patch version like 14.1.1) is used to construct URLs, ensuring that the assets match the game state being analyzed.

Asset URL Construction
While specific implementation functions like getChampionImageUrl are referenced in the architecture, they rely on the logic of combining the DataDragon base URL with IDs resolved via riotDictionary.ts.

Asset Resolution Flow This diagram shows how the system resolves a numeric ID into a visual element in the PlayerPanel.

Sources:
frontend/src/core/riotDictionary.ts
2-16

frontend/src/core/decoder.ts
20-26

4. Summary of Data Structures
   The following table summarizes the relationship between the raw websocket data and the final domain objects used by the React frontend.

Interface Source Role
RawStatsPayload decoder.ts Matches the Go backend's GameStats struct for JSON unmarshaling.
GameStats decoder.ts The "Source of Truth" for the WatchView and its child components.
PlayerData decoder.ts Normalized player stats including KDA and item lists.
ITEM_MAP riotDictionary.ts Static lookup for item names.
CHAMPION_MAP riotDictionary.ts Static lookup for participant roles.
Sources:
frontend/src/core/decoder.ts
1-35

frontend/src/core/riotDictionary.ts
1-34

## Backend Data Assets

Backend Data Assets
Relevant source files
backend/data/partida-t1-geng.m3u8
backend/data/reporte_probabilidades.csv
backend/data/timeline.json
frontend/src/features/player/PlayerPanel.tsx
frontend/src/features/player/useSmartUI.ts
The backend/data/ directory serves as the storage hub for static assets, sample telemetry, and video streaming segments. These files provide the foundational data required for the VOD analysis features, including the HLS video stream, time-series win probability analytics, and raw game state snapshots used by the WebSocket synchronization layer.

HLS Video Stream Assets
The platform uses HTTP Live Streaming (HLS) to deliver video content. This allows for adaptive bitrate streaming and efficient seeking within the VOD. The assets consist of a playlist file and multiple transport stream (.ts) segments.

Playlist Structure (partida-t1-geng.m3u8)
The .m3u8 file acts as the manifest for the video player (e.g., hls.js in the frontend). It defines the version, target duration for segments, and the sequence of files to be fetched.

Directive Value Description
#EXT-X-VERSION 3 Compatibility version.
#EXT-X-TARGETDURATION 12 Maximum duration of any single segment (seconds).
#EXTINF Variable The actual duration of the following .ts file.
Video Segments
The video is split into segments such as partida-t1-geng0.ts through partida-t1-geng5.ts. These are binary files containing MPEG-2 Transport Stream data, served with the video/mp2t Content-Type by the backend.

Sources:

backend/data/partida-t1-geng.m3u8
1-17
Analytics & Probability Data
The reporte_probabilidades.csv file contains processed time-series data used to generate the win probability visualizations and timeline charts. This data represents the output of the backend's analysis engine.

CSV Schema
The file uses a comma-separated format with the following fields:

Field Description
Segundo_Partida The timestamp in seconds from the start of the match.
Diferencia_Oro Gold difference between Blue and Red teams (positive favors Blue).
Dragon_Timer Seconds remaining until the next Dragon spawn.
Baron_Timer Seconds remaining until the next Baron Nashor spawn.
WinProb_Azul_Porcentaje The calculated win probability for the Blue team (0-100).
Sources:

backend/data/reporte_probabilidades.csv
1-6
Game State Timeline
The timeline.json file provides a high-fidelity snapshot of the game state at specific intervals (every 5 seconds). This file is utilized by the backend to populate the timelineCache and serve real-time updates via WebSockets.

Data Model Mapping
The JSON structure uses minified keys to optimize payload size during transmission.

JSON Key Code Entity / Field Description
t Timestamp Seconds elapsed in-game.
g_d GoldDiff Current gold lead/deficit.
d_t DragonTimer Countdown for Dragon.
b_t BaronTimer Countdown for Baron.
p_d PlayerData Array of participant states.
p_d.id ID Unique identifier (e.g., t1_faker).
p_d.kda KDA Kill/Death/Assist string.
p_d.i Items List of item names currently held.
Code Entity Association
The following diagram illustrates how the raw JSON assets map to the internal data structures used by the frontend components.

Data to UI Mapping

Sources:

backend/data/timeline.json
1-90
frontend/src/features/player/PlayerPanel.tsx
5-7
frontend/src/features/player/PlayerPanel.tsx
21-23
Data Flow: Asset to Viewport
The lifecycle of these assets involves the backend serving them via specific handlers and the frontend consuming them to synchronize the UI with the VOD playback.

Synchronization Logic
VOD Playback: The VideoPlayer.tsx tracks the current gameTime.
Request: The useGameStats hook sends the current time to the backend.
Lookup: The backend queries the timelineCache (populated from timeline.json).
Response: The backend sends the corresponding p_d (Player Data) and g_d (Gold Diff).
Render: Components like PlayerPanel.tsx and WinProbabilityBar.tsx update based on the decoded payload.
System Data Flow

Smart UI Interaction
The visibility of the data derived from these assets is managed by useSmartUI.ts. If the video is playing, the UI elements (populated by timeline.json data) will automatically hide after 2500ms of inactivity to provide an unobstructed view of the VOD.

Sources:

frontend/src/features/player/useSmartUI.ts
3-23
frontend/src/features/player/PlayerPanel.tsx
31-37
backend/data/timeline.json
46-67

## Glosary

Glossary
Relevant source files
backend/cmd/api/main.go
backend/data/reporte_probabilidades.csv
backend/internal/service/match_service.go
backend/internal/stats/handler.go
frontend/src/App.tsx
frontend/src/core/decoder.ts
frontend/src/features/player/MatchEventLog.tsx
frontend/src/features/player/PlayerPanel.tsx
frontend/src/features/player/WinProbabilityBar.tsx
frontend/src/features/player/useSmartUI.ts
frontend/src/index.css
frontend/src/pages/WatchView.tsx
This page provides a comprehensive reference for technical terms, abbreviations, and domain-specific concepts used throughout the LoL VOD Platform codebase. It serves as a bridge between League of Legends domain knowledge and the implementation details in the Go backend and React frontend.

Domain & System Terms
Win Probability (Probabilidad de Victoria)
The system calculates the likelihood of the Blue team winning based on the current gold difference between teams.

Implementation: In the backend, calculateWinProbability uses a logistic sigmoid function: $1 / (1 + e^{-k \cdot \text{goldDiff}})$.
Constant ($k$): The backend uses $k = 0.00027$ for historical data processing
backend/internal/service/match_service.go
91-95
Visualization: Displayed in the frontend via the WinProbabilityBar component
frontend/src/features/player/WinProbabilityBar.tsx
5-43
Processed Frame
A snapshot of game state at a specific minute, containing aggregated data derived from the raw Riot Games API timeline.

Data Model: Defined as ProcessedFrame struct in Go
backend/internal/service/match_service.go
82-89
Aggregation: Gold is summed for participants 1-5 (Blue) and 6-10 (Red)
backend/internal/service/match_service.go
104-111
Timeline Cache
An in-memory storage mechanism in the backend to prevent repeated database queries for the same match during WebSocket sessions.

Structure: A map where the key is the matchID and the value is a slice of ProcessedFrame
backend/internal/stats/handler.go
30
Concurrency: Protected by a sync.RWMutex named cacheMutex to allow multiple concurrent readers but only one writer
backend/internal/stats/handler.go
31
Smart UI
A frontend UX pattern that hides telemetry overlays during video playback to reduce visual clutter, while keeping them visible when the video is paused for analysis.

Logic: Implemented in the useSmartUI hook with a 2500ms inactivity timeout
frontend/src/features/player/useSmartUI.ts
3-23
Technical Mapping: Natural Language to Code
The following diagrams map conceptual entities to their specific identifiers and locations in the codebase.

Data Processing Pipeline
This diagram shows how raw Riot API data is transformed into the platform's internal formats.

Sources:
backend/internal/service/match_service.go
21-71

backend/internal/service/match_service.go
82-89

backend/internal/service/match_service.go
97-138

Frontend State & Decoding
This diagram shows how raw WebSocket payloads are converted into UI-ready domain interfaces.

Sources:
frontend/src/core/decoder.ts
1-64

frontend/src/features/player/useGameStats.ts
28-30

Spanish UI Strings & Localized Terms
The application uses Spanish for its user interface. Below is a mapping of UI strings to their functional purpose.

UI String Code Reference Description
Asesinato ⚔️
frontend/src/features/player/MatchEventLog.tsx
57
Displayed when a CHAMPION_KILL event is detected.
Compra 💰
frontend/src/features/player/MatchEventLog.tsx
67
Displayed when an ITEM_PURCHASED event is detected.
Validando sesión...
frontend/src/App.tsx
15
Loading state in ProtectedRoute while checking Supabase auth.
Guardar VOD
frontend/src/pages/WatchView.tsx
145
Button label for adding a match to user_saved_matches.
Panel de Telemetría
frontend/src/pages/WatchView.tsx
171
Header for the sidebar containing MatchScoreboard.
Key Components & Data Flow
WebSocket Synchronization
The synchronization between the YouTube video time and the telemetry data is handled by the interaction between VideoPlayer and useGameStats.

Sources:
frontend/src/features/player/VideoPlayer.tsx
155-160

backend/internal/stats/handler.go
125-142

backend/internal/stats/handler.go
68-87

Database Schema Contracts
The system relies on two primary tables in Supabase/PostgreSQL:

matches_data: Stores the heavy lifting.

match_id: Primary key (e.g., LA1_1654100537).
raw_timeline: Original JSON from Riot.
processed_timeline: Array of ProcessedFrame objects
backend/internal/service/match_service.go
59-62
match_info: Metadata for participants and champions
backend/internal/service/match_service.go
53-57
user_saved_matches: Relational table for user bookmarks.

user_id: UUID from Supabase Auth.
match_id: Foreign key to matches_data.
Logic: Managed via toggleSaveMatch in the frontend
frontend/src/pages/WatchView.tsx
88-111
Abbreviations
VOD: Video on Demand. In this project, it refers to the YouTube recording of a professional match.
HLS: HTTP Live Streaming. Protocol used for serving local video segments
backend/cmd/api/main.go
56-57
KDA: Kill/Death/Assist ratio for players
frontend/src/features/player/PlayerPanel.tsx
49
DTO: Data Transfer Object. Simplified structures used for network transmission (e.g., EventDTO)
backend/internal/service/match_service.go
74-80
CORS: Cross-Origin Resource Sharing. Middleware implemented in Go to allow the React frontend to communicate with the API
backend/cmd/api/main.go
104-116
Sources:

backend/internal/service/match_service.go
backend/internal/stats/handler.go
frontend/src/core/decoder.ts
frontend/src/pages/WatchView.tsx
frontend/src/features/player/MatchEventLog.tsx
frontend/src/features/player/PlayerPanel.tsx
backend/cmd/api/main.go
