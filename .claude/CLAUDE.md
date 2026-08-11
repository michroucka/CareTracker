# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CareTracker is a full-stack care coordination system for managing elderly/disabled care services. It tracks clients, caregivers, performed care tasks, billing, and individual care plans. The primary language in the UI and codebase comments is **Czech**.

## Code Style

- Don't add comments unless specifically asked to or the code is difficult to understand.
- Comments, function names, variables are all in english, even when prompts are in different language, code is always english, except for text that gets printed to the user of the application (i.e. errors that get shown in toasts)
- Always use existing patterns, try to avoid duplicit code.
- Prefer simple solutions.

## Collaboration Style

- The user is learning and wants to write the implementation code themselves. Default to reviewing, explaining, and pointing out bugs/issues rather than jumping straight to editing files.
- When asked to "look at" or check code, give a review (what's wrong, why, what pattern to follow) instead of fixing it directly.
- Only edit files when explicitly asked to make the change, or for small mechanical/infrastructure tasks unrelated to what the user is actively learning (e.g. config, routing wiring, one-off renames) where they haven't indicated they want to do it themselves.
- If unsure whether the user wants a review or a fix, ask, or default to reviewing first.

## Development Commands

### Docker (primary workflow)

```bash
make up              # Start all services (backend, frontend, db, pgadmin)
make down            # Stop all services
make restart-backend # Restart a single service
make build           # Rebuild images without cache
make rebuild s=backend  # Rebuild and restart specific service (use after Dockerfile changes)
make clean           # Wipe volumes + full rebuild (resets database)
make logs service=backend  # Tail logs for a service
make compile         # Recompile backend inside container (DevTools auto-restarts)
```

Services:

- Frontend: http://localhost:3000 (Vite dev server proxied)
- Backend: http://localhost:8080
- PostgreSQL: localhost:5432
- PgAdmin: http://localhost:5050

### Backend hot-reload workflow

The backend uses Spring Boot DevTools. The recommended cycle for backend changes:

1. Edit Java source files
2. Run `make compile` — DevTools detects the recompiled classes and restarts automatically

## Architecture

### Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS v4, HeroUI (component library), React Router 7, Lucide icons
- **Backend**: Spring Boot 3 (Java 21), Spring Security (session-based), Spring Data JPA, Flyway migrations
- **Database**: PostgreSQL 15
- **PDF generation**: Flying Saucer
- **Email**: Spring Mail + Thymeleaf templates

### Frontend Structure (`frontend/src/`)

```
api/          # Fetch wrappers (getJSON, postJSON, putJSON, deleteJSON)
app/          # Root layout, router config
pages/        # One file per route/page
components/   # Reusable UI components
hooks/        # Custom data-fetching and filter hooks
contexts/     # AuthContext (global user state), ThemeContext (dark/light)
utils/        # Pure utility functions (formatters, filterUtils)
constants/    # Role enums and other constants
```

Key hooks:

- `useFilterMetadata.jsx` — loads organizations/departments/employees once, provides cascading filter options
- `useRoleBasedFilters.jsx` — computes permission flags and validates filters by role
- `filterUtils.js` — pure functions for converting filter state to API params

### Backend Structure (`backend/src/main/java/cz/zcu/kiv/caretracker/`)

```
controller/      # REST controllers (one per domain)
service/         # Business logic
entity/          # JPA entities
repository/      # Spring Data JPA repos
dto/             # Request/response DTOs
mapper/          # Entity ↔ DTO mapping
specification/   # JPA Criteria API specifications (dynamic filtering)
security/        # MyUserDetails, auth handlers
config/          # SecurityConfig, WebConfig
exception/       # Custom exception classes
```

Database schema is versioned via Flyway in `src/main/resources/db/migration/`.

### Authentication

- Session-based (Spring Security), no JWT
- 7-day remember-me cookie
- Frontend checks `/api/auth-status` on load; dispatches `auth:unauthorized` custom event on 401 responses to trigger auto-logout
- `MyUserDetails` carries `userId`, `organizationId`, and `active` flag alongside standard Spring Security fields

### Role Hierarchy

```
SUPERADMIN > ADMIN > COORDINATOR > CAREGIVER
CLIENT (separate, read-only access to own data)
```

Role-based filtering is enforced both in backend `@PreAuthorize` annotations and in frontend `ProtectedRoute` + `useRoleBasedFilters`.

### API Conventions

- All endpoints under `/api/`
- Vite proxy forwards `/api/*` → `http://backend:8080` in dev
- Login/logout use `application/x-www-form-urlencoded` (Spring Security form login); all other endpoints use JSON
- Error responses contain a `.message` string field
- Filter params for list endpoints: `organizationId`, `departmentIds`, `caregiverIds`, `clientId`, `month`, `year`, `status`

### Key Domain Entities

| Entity           | Purpose                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| `Organization`   | Top-level tenant                                                            |
| `Department`     | Regional office within an org                                               |
| `Employee`       | Staff (CAREGIVER / COORDINATOR / MANAGER roles)                             |
| `Client`         | Care recipient; has assigned caregiver, benefit level, termination tracking |
| `Task`           | Billable service catalog entry (HOUR / OCCURRENCE / KG / KM unit types)     |
| `PerformedTask`  | Record of a service provided; many-to-many with caregivers                  |
| `IndividualPlan` | Versioned care plan per client; contains `DailyRecord` entries              |
