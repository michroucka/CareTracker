.PHONY: up down start stop restart build rebuild clean logs compile test test-frontend test-backend demo-up demo-down demo-build demo-reset demo-logs

# Start všech služeb
up:
	docker-compose up -d

# Stop všech služeb
down:
	docker-compose down

start:
	docker-compose start

stop:
	docker-compose stop

# Restart služby
restart:
	docker-compose restart $(service)

# Restart jedné služby
restart-%:
	docker-compose restart $*

# Build bez cache
build:
	docker-compose build --no-cache

# Rebuild a restart (použít při změně package.json)
rebuild:
	docker-compose up --build -d $(s)

# Vyčistit volumes a rebuild
clean:
	docker-compose down -v
	docker-compose up --build -d

# Zobrazit logy
logs:
	docker-compose logs -f $(service)

# Zkompilovat backend (DevTools automaticky restartuje aplikaci)
compile:
	docker exec caretracker-backend ./mvnw compile -q

# Spustit všechny testy
test: test-backend test-frontend

test-backend:
	docker exec caretracker-backend chmod +x ./mvnw
	docker exec caretracker-backend ./mvnw test

test-frontend:
	docker exec caretracker-frontend npm test -- --run

# Demo commands
demo-up:
	docker compose -f docker-compose.demo.yml up -d

demo-down:
	docker compose -f docker-compose.demo.yml down

demo-build:
	docker compose -f docker-compose.demo.yml build --no-cache

demo-reset:
	docker compose -f docker-compose.demo.yml down -v
	docker compose -f docker-compose.demo.yml up --build -d

demo-logs:
	docker compose -f docker-compose.demo.yml logs -f $(service)
