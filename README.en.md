<div align="center">
  <img src=".github/assets/logo_light.svg" alt="CareTracker logo" width="400" />
</div>

<div align="center">

**A web application for home care services that replaces paper-based administration with a modern digital solution.**

[🌐 Live demo](https://demo.caretracker.cz) · [Česká verze](README.md)

</div>

> **Note:** CareTracker targets Czech care service providers and its user interface is available in Czech only. This English README exists purely to describe the project to an international audience.

---

## 🚀 Key Features

- **User management** – registration, login, and account management across roles (admin, coordinator, caregiver, client).
- **Client records** – personal data, individual care plans, and history of provided services.
- **Care logging** – caregivers log performed tasks and time spent, with the ability to edit existing entries.
- **Reports & overviews** – monthly report generation, PDF export, filtering by client and period.
- **Roles & permissions** – distinct access levels for admins, coordinators, caregivers, and clients.
- **Client billing** – monthly invoice overview and payment via QR code.
- **Multi-tenant organization structure** – organization → department → employee, with matching access restrictions.

---

## 🛠 Tech Stack

### Frontend
- [React](https://react.dev/) 19 + [Vite](https://vitejs.dev/) – fast, modern UI development
- [TailwindCSS](https://tailwindcss.com/) v4 – utility-first CSS framework
- [HeroUI](https://heroui.com/) – component library for a consistent, modern UI
- [React Router](https://reactrouter.com/) – client-side routing
- [Recharts](https://recharts.org/) – charts and visualizations in reports
- [Lucide](https://lucide.dev/) – open-source SVG icon library

### Backend
- [Spring Boot](https://spring.io/projects/spring-boot) 3 (Java 21) – REST API and application logic
- [Spring Security](https://spring.io/projects/spring-security) – session-based authentication and authorization
- [Spring Data JPA](https://spring.io/projects/spring-data-jpa) – database access
- [Flying Saucer](https://github.com/flyingsaucerproject/flyingsaucer) – PDF generation from HTML templates
- [Spring Mail](https://docs.spring.io/spring-framework/reference/integration/email.html) + [Thymeleaf](https://www.thymeleaf.org/) – email notifications

### Database
- [PostgreSQL](https://www.postgresql.org/) – relational database
- [Flyway](https://flywaydb.org/) – database migration management

### Testing
- [JUnit 5](https://junit.org/junit5/) – backend unit tests (entities, service layer)
- [Mockito](https://site.mockito.org/) – dependency mocking in service tests
- [Spring Boot Test](https://docs.spring.io/spring-boot/docs/current/reference/html/test-auto-configuration.html) – controller integration tests (`@WebMvcTest`)
- [Spring Security Test](https://docs.spring.io/spring-security/reference/servlet/test/index.html) – authorization testing (`@WithMockUser`)
- [Vitest](https://vitest.dev/) – frontend utility function unit tests

### Deployment
- [Docker](https://www.docker.com/) – containerization of backend, frontend, and database

---

## 🏁 Quick Start

### Requirements
- [Docker](https://www.docker.com/) and Docker Compose
- `make` (optional, but recommended — simplifies common commands)

### Running the app

```bash
git clone git@github.com:michroucka/CareTracker.git
cd CareTracker

cp .env.example .env
# edit .env – set POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
# and fill in backend/src/main/resources/secrets.properties for email notifications

make up
```

The app will be available at:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8080](http://localhost:8080)
- PostgreSQL: `localhost:5432`

### Useful commands

```bash
make down             # stop all services
make restart-backend  # restart the backend
make compile          # recompile the backend (DevTools auto-restarts the app)
make rebuild s=backend  # rebuild image + restart a specific service (after Dockerfile changes)
make clean              # wipe volumes and full rebuild (resets the database)
make logs service=backend  # tail logs for a given service
make test              # run backend and frontend tests
```

See the full list of commands in [`Makefile`](Makefile).

---

## 📁 Project Structure

```
backend/    Spring Boot application (REST API, business logic, DB migrations)
frontend/   React + Vite application (user interface)
doc/        Documentation (bachelor's thesis, specification, ER and use-case diagrams)
```

## 📚 Documentation

- [Bachelor's thesis](doc/bachelors_thesis.pdf) – full analysis, design, and user documentation of the system (in Czech)
- [Software specification](doc/software_specification.pdf) (in Czech)
- [ER diagram](doc/ERA_Model.pdf), [Use-case diagram](doc/UC_Diagram.png)

---

## 👥 Roles

```
SUPERADMIN > ADMIN > COORDINATOR > CAREGIVER
CLIENT (separate role, read-only access to own data)
```

Permissions are enforced both on the backend (`@PreAuthorize`) and on the frontend (protected routes and role-based filtering).

---

## 📄 License

All rights reserved. The source code is published for browsing and educational purposes; copying, modifying, or commercial use without the author's consent is not permitted. See [`LICENSE`](LICENSE).
