# 💚 CareTracker – Webová aplikace pro pečovatelskou službu

Webová aplikace pro pečovatelské služby, která nahrazuje papírovou administrativu moderním digitálním řešením.

---

## 🚀 Hlavní funkce
- **Správa uživatelů** – registrace, přihlášení a správa účtů pro role (vedoucí, koordinátor, pečovatel, klient).
- **Evidence klientů** – vedení osobních údajů, individuálních plánů a historie poskytnutých služeb.
- **Záznam péče** – pečovatelé zapisují provedené úkony a čas, možnost úpravy existujících záznamů.
- **Reporty a přehledy** – generování měsíčních výkazů, export do PDF/CSV, filtrování podle klienta, pečovatele a období.
- **Role a oprávnění** – různé přístupy pro vedoucího, koordinátora, pečovatele a klienta.
- **Platby klientů** – zobrazení měsíčního vyúčtování a úhrada pomocí QR kódu.

---

## 🛠 Použité technologie

### Frontend
- [React](https://react.dev/) + [Vite](https://vitejs.dev/) – rychlý a moderní vývoj uživatelského rozhraní  
- [TailwindCSS](https://tailwindcss.com/) – utilitární CSS framework  
- [HeroUI](https://heroui.com/) – komponentová knihovna pro konzistentní a moderní UI  

### Backend
- [Spring Boot](https://spring.io/projects/spring-boot) – Java framework pro REST API a aplikační logiku  
- [Spring Security](https://spring.io/projects/spring-security) – autentizace a autorizace uživatelů  
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa) – práce s databází  

### Databáze
- [PostgreSQL](https://www.postgresql.org/) – relační databáze  
- [Flyway](https://flywaydb.org/) – správa migrací databáze  

### Testování a build
- [JUnit 5](https://junit.org/junit5/) – testování backendu
- [Mockito](https://site.mockito.org/) – mockování závislostí  
- [Maven](https://maven.apache.org/) – build a správa závislostí backendu  
- [Vitest](https://vitest.dev/) / [Jest](https://jestjs.io/) – testování frontendu  

### DevOps a nasazení
- [Docker](https://www.docker.com/) – kontejnerizace backendu, frontendu a databáze  
- [Docker Compose](https://docs.docker.com/compose/) – orchestrace více služeb  
