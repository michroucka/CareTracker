.PHONY: up down start stop restart build rebuild clean logs compile

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
