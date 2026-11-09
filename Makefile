.PHONY: up down start stop restart build rebuild clean logs compile test test-frontend test-backend demo-up demo-down demo-build demo-reset demo-logs seed-activity clear-activity demo-seed-activity

# Start všech služeb + doplnění demo aktivity (provedené úkony až do teď)
up:
	docker-compose up -d
	@echo "Čekám na backend, pak doplním demo aktivitu…"
	@if for i in $$(seq 1 90); do curl -sf -o /dev/null http://localhost:8080/api/auth-status && break; sleep 2; done \
		&& curl -sf -o /dev/null http://localhost:8080/api/auth-status; then \
		$(MAKE) --no-print-directory seed-activity; \
	else \
		echo "Backend nenaběhl, demo aktivitu doplníš později přes: make seed-activity"; \
	fi

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
	docker-compose build
	@$(MAKE) --no-print-directory up

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

# Demo aktivita: doplní realistické provedené úkony za posledních 12 měsíců až do teď.
# Bezpečné spouštět opakovaně (např. jednou měsíčně), doplní jen to, co od minula chybí.
seed-activity:
	@docker-compose exec -T db sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' < backend/src/main/resources/demo-activity/seed.sql

# Smaže všechny úkony vygenerované přes seed-activity
clear-activity:
	@docker-compose exec -T db sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' < backend/src/main/resources/demo-activity/clear.sql

demo-seed-activity:
	@docker compose -f docker-compose.demo.yml exec -T db sh -c 'psql -q -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"' < backend/src/main/resources/demo-activity/seed.sql
