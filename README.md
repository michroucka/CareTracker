<div align="center">
  <img src=".github/assets/logo_light.svg" alt="CareTracker logo" width="400" />
</div>

# CareTracker

**Webová aplikace pro pečovatelské služby, která nahrazuje papírovou administrativu moderním digitálním řešením.**

## 🚀 Hlavní funkce
- **Správa uživatelů** – registrace, přihlášení a správa účtů pro role (administrátor, koordinátor, pečovatel, klient).
- **Evidence klientů** – vedení osobních údajů, individuálních plánů a historie poskytnutých služeb.
- **Záznam péče** – pečovatelé zapisují provedené úkony a čas, možnost úpravy existujících záznamů.
- **Reporty a přehledy** – generování měsíčních výkazů, export do PDF, filtrování podle klienta a období.
- **Role a oprávnění** – různé přístupy pro administrátora, koordinátora, pečovatele a klienta.
- **Platby klientů** – zobrazení měsíčního vyúčtování a úhrada pomocí QR kódu.

---

## 🛠 Použité technologie

### Frontend
- [React](https://react.dev/) + [Vite](https://vitejs.dev/) – rychlý a moderní vývoj uživatelského rozhraní  
- [TailwindCSS](https://tailwindcss.com/) – utilitární CSS framework  
- [HeroUI](https://heroui.com/) – komponentová knihovna pro konzistentní a moderní UI
- [Lucide](https://lucide.dev/) – open-source knihovna SVG ikon pro moderní a konzistentní ikonografii 

### Backend
- [Spring Boot](https://spring.io/projects/spring-boot) – Java framework pro REST API a aplikační logiku  
- [Spring Security](https://spring.io/projects/spring-security) – autentizace a autorizace uživatelů  
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa) – práce s databází
- [Flying Saucer](https://github.com/flyingsaucerproject/flyingsaucer) – generování PDF dokumentů z HTML
  šablon

### Databáze
- [PostgreSQL](https://www.postgresql.org/) – relační databáze  
- [Flyway](https://flywaydb.org/) – správa a verzování databázových migrací
### Testování a build
- TBD

### Nasazení
- [Docker](https://www.docker.com/) – kontejnerizace backendu, frontendu a databáze  
