FROM maven:3.9.11-eclipse-temurin-21

WORKDIR /app

# Zkopíruj Maven wrapper a POM pro cachování závislostí
COPY pom.xml mvnw ./
COPY .mvn .mvn

# Spusť aplikaci přes spring-boot:run (ne přes jar)
CMD ["./mvnw", "spring-boot:run"]
