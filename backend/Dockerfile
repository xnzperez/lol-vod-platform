# --- ETAPA 1: Builder ---
FROM golang:1.25-alpine AS builder

# Instalamos certificados de seguridad (necesarios para peticiones HTTPS a Riot API)
RUN apk add --no-cache ca-certificates git

WORKDIR /app

# Copiamos dependencias primero para aprovechar el cache de Docker
COPY go.mod go.sum ./
RUN go mod download

# Copiamos el resto del código
COPY . .

# Compilamos el binario (estático y optimizado)
# Ajusta la ruta './cmd/api/main.go' según donde esté tu archivo main
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/api/main.go

# --- ETAPA 2: Runtime ---
FROM alpine:latest

# Importamos los certificados desde el builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

WORKDIR /root/

# Copiamos solo el binario compilado
COPY --from=builder /app/server .

# Exponemos el puerto del backend
EXPOSE 8080

# Ejecutamos
CMD ["./server"]