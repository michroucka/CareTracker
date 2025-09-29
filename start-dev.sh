#!/bin/bash
set -e

echo "🚀 Spouštím vývojové prostředí CareTracker..."

# 1. Spuštění databáze
echo "📦 Spouštím databázi v Dockeru..."
docker compose -f db/docker-compose.yml up -d

# 2. Backend
echo "☕ Spouštím backend (Spring Boot)..."
(cd backend && nohup ./mvnw spring-boot:run > .log 2>&1 &)
BACKEND_PID=$!

# 3. Frontend
echo "🌐 Spouštím frontend (Vite)..."
(cd frontend && npm install > /dev/null 2>&1 && nohup npm run dev > .log 2>&1 &)
FRONTEND_PID=$!

# Funkce pro ukončení
cleanup() {
  echo -e "\n🛑 Ukončuji vývojové prostředí..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  docker compose -f db/docker-compose.yml down
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "✅ Backend běží"
echo "✅ Frontend běží"
echo "Stiskni Ctrl+C pro ukončení všeho."

# Drží skript aktivní
tail -f /dev/null
