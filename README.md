<div align="center">
  <img src=".github/assets/logo_light.svg" alt="CareTracker logo" width="400" />
</div>

<div align="center">

**Webová aplikace pro pečovatelské služby, která nahrazuje papírovou administrativu moderním digitálním řešením.**

[🌐 Živé demo](https://demo.caretracker.cz) · [English version](README.en.md)

</div>

---

## 🚀 Hlavní funkce

- **Správa uživatelů** – registrace, přihlášení a správa účtů pro role (administrátor, koordinátor, pečovatel, klient).
- **Evidence klientů** – vedení osobních údajů, individuálních plánů a historie poskytnutých služeb.
- **Záznam péče** – pečovatelé zapisují provedené úkony a čas, možnost úpravy existujících záznamů.
- **Reporty a přehledy** – generování měsíčních výkazů, export do PDF, filtrování podle klienta a období.
- **Role a oprávnění** – různé přístupy pro administrátora, koordinátora, pečovatele a klienta.
- **Platby klientů** – zobrazení měsíčního vyúčtování a úhrada pomocí QR kódu.
- **Vícenájemná organizační struktura** – organizace → střediska → zaměstnanci, s odpovídajícím omezením přístupu.

---

## 🛠 Použité technologie

### Frontend

- [React](https://react.dev/) 19 + [Vite](https://vitejs.dev/) – rychlý a moderní vývoj uživatelského rozhraní
- [TailwindCSS](https://tailwindcss.com/) v4 – utilitární CSS framework
- [HeroUI](https://heroui.com/) – komponentová knihovna pro konzistentní a moderní UI
- [React Router](https://reactrouter.com/) – směrování na straně klienta
- [Recharts](https://recharts.org/) – grafy a vizualizace v přehledech
- [Lucide](https://lucide.dev/) – open-source knihovna SVG ikon pro moderní a konzistentní ikonografii

### Backend

- [Spring Boot](https://spring.io/projects/spring-boot) 3 (Java 21) – REST API a aplikační logika
- [Spring Security](https://spring.io/projects/spring-security) – autentizace a autorizace uživatelů (session-based)
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa) – práce s databází
- [Flying Saucer](https://github.com/flyingsaucerproject/flyingsaucer) – generování PDF dokumentů z HTML šablon
- [Spring Mail](https://docs.spring.io/spring-framework/reference/integration/email.html) + [Thymeleaf](https://www.thymeleaf.org/) – e-mailové notifikace

### Databáze

- [PostgreSQL](https://www.postgresql.org/) – relační databáze
- [Flyway](https://flywaydb.org/) – správa a verzování databázových migrací

### Testování

- [JUnit 5](https://junit.org/junit5/) – unit testy pro backend (entity, service vrstva)
- [Mockito](https://site.mockito.org/) – mockování závislostí v service testech
- [Spring Boot Test](https://docs.spring.io/spring-boot/docs/current/reference/html/test-auto-configuration.html) – integrační testy controlleru (`@WebMvcTest`)
- [Spring Security Test](https://docs.spring.io/spring-security/reference/servlet/test/index.html) – testování autorizace (`@WithMockUser`)
- [Vitest](https://vitest.dev/) – unit testy frontendových utility funkcí

### Nasazení

- [Docker](https://www.docker.com/) – kontejnerizace backendu, frontendu a databáze

---

## 🏁 Rychlý start

### Požadavky

- [Docker](https://www.docker.com/) a Docker Compose
- `make` (volitelné, ale doporučené – zjednodušuje běžné příkazy)

### Spuštění

```bash
git clone git@github.com:michroucka/CareTracker.git
cd CareTracker

cp .env.example .env
# uprav .env – nastav POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
# a doplň backend/src/main/resources/secrets.properties pro e-mailové notifikace

make up
```

Aplikace poběží na:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8080](http://localhost:8080)
- PostgreSQL: `localhost:5432`

### Užitečné příkazy

```bash
make down             # zastavit všechny služby
make restart-backend  # restart backendu
make compile          # rekompilace backendu (DevTools app automaticky restartuje)
make rebuild s=backend  # rebuild image + restart konkrétní služby (po změně Dockerfile)
make clean             # smazat volumes a kompletní rebuild (reset databáze)
make logs service=backend  # sledování logů dané služby
make test              # spustit backendové i frontendové testy
```

Kompletní přehled příkazů najdeš v [`Makefile`](Makefile).

---

## 📁 Struktura projektu

```
backend/    Spring Boot aplikace (REST API, business logika, DB migrace)
frontend/   React + Vite aplikace (uživatelské rozhraní)
doc/        Dokumentace (bakalářská práce, specifikace, ER a use-case diagramy)
```

## 📚 Dokumentace

- [Bakalářská práce](doc/bachelors_thesis.pdf) – kompletní analýza, návrh a uživatelská dokumentace systému
- [Softwarová specifikace](doc/software_specification.pdf)
- [ER diagram](doc/ERA_Model.pdf), [Use-case diagram](doc/UC_Diagram.png)

---

## 👥 Role v systému

```
SUPERADMIN > ADMIN > KOORDINÁTOR > PEČOVATEL
KLIENT (samostatná role s náhledem pouze na vlastní data)
```

Oprávnění jsou vynucována jak na backendu (`@PreAuthorize`), tak na frontendu (chráněné trasy a role-based filtrování).

---

## 📄 Licence

Veškerá práva vyhrazena. Zdrojový kód je zveřejněn pro účely prohlížení a studijní účely; jeho kopírování, úprava nebo komerční využití bez souhlasu autora nejsou povoleny. Viz [`LICENSE`](LICENSE).
