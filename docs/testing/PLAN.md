# Testy a CI – plán

Rozhodnuto 2026-11-09. Cíl: aplikace pokrytá testy tak, aby šla dál rozvíjet bez strachu z regresí, a CI, které nepustí na `main` (a tím na demo) nic, co neprojde.

Dnešní stav: 4 backendové testy (`PerformedTaskTest`, `ClientServiceTest`, `PerformedTaskServiceTest`, `ClientControllerTest`), 2 frontendové (`formatters.test.js`, `sorting.test.js`). Deploy na demo (`deploy-demo.yml`) běží po pushi na `main` bez jakékoli kontroly.

---

## 1. Rozhodnutí

| Téma | Volba | Proč |
| --- | --- | --- |
| Databáze v testech | **Testcontainers + PostgreSQL 15** (stejná verze jako produkce) | Testy jdou přes skutečné Flyway migrace a skutečné SQL. H2 by schovala rozdíly (dotazy pro nástěnku, `bytea`, datumové funkce). |
| Unit vs. integrační testy na backendu | Unit: `*Test` (Surefire, `mvn test`). Integrační se Springem a DB: `*IT` (Failsafe, `mvn verify`). | Rychlé testy běží zvlášť a hned, pomalé jen ve `verify`. |
| Pokrytí backendu | JaCoCo, report v CI | Nejdřív jen report. Prahy až po fázi T2, pak se jen zvedají. |
| Frontend | Vitest + Testing Library + `user-event` + `jest-dom`, API přes **MSW** | Testuje se chování z pohledu uživatele, ne implementace. MSW mockuje síť, ne `api.js`, takže se testuje i ten. |
| E2E | Playwright, pár kritických toků | Proti skutečnému stacku (docker compose) s demo seedem. Jen to, co jinými testy nejde ověřit. |
| CI | GitHub Actions na `ubuntu-latest` (má Docker pro Testcontainers) | Deploy dál na self-hosted runneru, ale až po zeleném CI. |
| Nové funkce | Od teď test spolu s kódem (ideálně TDD) | Jinak dluh poroste znovu. |

## 2. Kdo co dělá

Změna 2026-11-09: testy píše Claude, uživatel je prochází v PR. Původní dělení (uživatel píše první test každého druhu) platilo jen pro `ClientAuthorizationIT`.

- **Claude:** infrastruktura, CI a všechny testy (**[claude]**). U nového konceptu (první test daného druhu) stručně vysvětlit v popisu PR, co a proč.
- **Ty:** review PR, rozhodnutí a opravy aplikačního kódu, které testy odhalí, nastavení na GitHubu (**[ty]**).
- Větve: krátká větev z `main` na každý kus (`test/client-authorization`, `test/receipt-service`…), jedno PR.

---

## 3. Konvence

- Struktura testů zrcadlí `main`: `service/ClientService` → `service/ClientServiceTest`.
- Název testu popisuje chování, ne metodu: `caregiverCannotReadClientFromOtherDepartment`, ne `testGetClientById2`. Na frontendu `it("hides create button for caregiver")`.
- Každý test má tři části: příprava → akce → ověření (Arrange / Act / Assert). Oddělit prázdným řádkem, žádné komentáře `// given`.
- Jeden test = jeden důvod selhání. Víc `assert` je v pořádku, pokud ověřují tutéž věc.
- Testovací data přes `TestData` (`testData.department(org)`, `testData.employee(dept, CAREGIVER)`), ne kopírovaný setup v každém testu. Metody vyplní povinná pole unikátními hodnotami, test mění jen to, na čem mu záleží.
- Mockovat jen hranice systému (e-mail, geokódování, QR API, čas). Vlastní repozitáře a služby v integračních testech nemockovat.
- Čas: kde logika závisí na „dnes“ (nástěnka, tento měsíc), injektovat `Clock` místo `LocalDate.now()`. Přidá se při psaní prvního takového testu.
- Testy jsou nezávislé na pořadí. Integrační testy po sobě uklízí (`DatabaseCleaner` před každým testem vyprázdní všechny tabulky včetně dummy dat z migrací).
- Na frontendu dotazy podle priority Testing Library: `getByRole` > `getByLabelText` > `getByText` > `getByTestId` (poslední možnost).

## 4. Co čím testovat

| Co | Typ testu | Nástroj |
| --- | --- | --- |
| Výpočty v entitách, formátování, čisté funkce | unit | JUnit / Vitest |
| Oprávnění podle role a organizace/střediska | integrační přes HTTP | `@SpringBootTest` + MockMvc + Testcontainers |
| Byznys pravidla služeb (životní cyklus, plány, tokeny) | integrační | `@SpringBootTest` + Testcontainers |
| JPA specifikace a vlastní dotazy | integrační, jen JPA vrstva | `@DataJpaTest` + Testcontainers |
| Validace vstupů, formát chyb, CSRF, login | web vrstva | `@WebMvcTest` nebo `@SpringBootTest` + MockMvc |
| Hooky, komponenty, stránky | integrační na frontendu | Vitest + Testing Library + MSW |
| Kritické toky přes celou aplikaci | E2E | Playwright |

---

## 5. Fáze

### Fáze T0 – CI kostra
Hned začne hlídat to, co už existuje.

- [x] **[claude]** Větev `feature/testing` z `main`.
- [x] **[claude]** `.github/workflows/ci.yml`: spouští se na `pull_request` a `push` do `main`. Dva paralelní joby:
  - backend: Java 21 (Temurin), cache Maven, `mvn -B verify`;
  - frontend: Node 22, cache npm, `npm ci`, `npm run lint`, `npm run coverage`, `npm run build`.
  - Reporty (Surefire, Failsafe, JaCoCo, Vitest coverage) jako artefakty běhu.
- [x] **[claude]** Frontend skripty `test:run` (`vitest run` – bez watch módu, jinak by CI viselo) a `coverage`.
- [x] **[claude]** `deploy-demo.yml`: spustí se až po úspěšném CI pro push na `main` (`workflow_run`), navíc ručně (`workflow_dispatch`). `workflow_run` se bere z výchozí větve, takže začne platit až po merge.
- [x] **[ty]** Na GitHubu ruleset `main`: merge jen přes PR, povinné checky Backend a Frontend, větev aktuální vůči `main`, zákaz force push a smazání, bez výjimek.
- [ ] Ověřit: PR s rozbitým testem nejde mergnout a nespustí deploy.
- [ ] **[ty]** Volitelně: Dockerfily frontendu jsou na `node:20`, CI na Node 22 (jsdom a jest-dom chtějí ≥ 22). Build v Dockeru funguje, jen hlásí varování o `engines` – zvážit přechod na `node:22`.

### Fáze T1 – Infrastruktura testů
Celé **[claude]**, ty review. Po této fázi jde napsat jakýkoli druh testu bez dalšího nastavování.

Backend:
- [x] Závislosti: `spring-boot-testcontainers`, `testcontainers:postgresql`, `testcontainers:junit-jupiter`. Failsafe plugin pro `*IT`. JaCoCo plugin (report z unit i IT testů dohromady, `target/site/jacoco/index.html`). Testcontainers přepnutý na 1.21.4 – verze ze Spring Boot 3.5.6 nefunguje s Docker Engine 29+.
- [x] `src/test/resources/application-test.properties`: profil `test`, Flyway zapnutý (migrace se tím testují), hodnoty ze `secrets.properties` nahrazené testovacími. `ApplicationContextIT` ověřuje, že kontext nastartuje.
- [ ] **[ty]** `ddl-auto=validate` v testech (kontrola, že entity sedí na schéma) zatím nejde: všechny sloupce `id` a `*_id` jsou v migracích `integer`, entity mají `Long` (Hibernate čeká `bigint`). Za běhu to nevadí, JDBC hodnoty převede. Rozhodnout: migrace na `bigint` (doporučeno, jedna Flyway migrace `ALTER COLUMN ... TYPE bigint` pro ID i cizí klíče), nebo `Integer` v entitách. Pak přepnout na `validate` – může odhalit další rozdíly.
- [x] Sdílený kontejner Postgresu pro všechny IT (`@ServiceConnection`), aby se nestartoval pro každou třídu zvlášť.
- [x] Základní třída `support/AbstractIntegrationTest` (Spring kontext, MockMvc, profil `test`, `DatabaseCleaner` před každým testem). Kontext je sdílený pro všechny IT – v podtřídách nepřidávat `@MockitoBean`, jinak vznikne nový kontext.
- [x] Hranice systému v testech: `JavaMailSender` a `GeocodingService` jako `@MockitoBean` v základní třídě. QR platba v `ReceiptService` volá externí API přímo přes `RestClient.create()` – vyřešit v T2b (vytáhnout klienta do beanu, který jde mockovat).
- [x] Pomocník na přihlášení: `.with(loggedInAs(employee))` – načte uživatele z DB stejně jako skutečný login (`MyUserDetails` s `userId`, `organizationId`), ne jen `@WithMockUser`, protože služby čtou organizaci a středisko z přihlášeného uživatele.
- [x] `support/TestData`: `organization()`, `department(org)`, `employee(dept, role)` (včetně přihlašovacího účtu, heslo `TestData.PASSWORD`), `superadmin()`. Klient, úkon, provedený úkon atd. se doplní, jak je testy budou potřebovat.
- [ ] Rozhodnout s tebou: přejmenovat/přesunout existující 4 testy podle konvencí (sekce 3), nebo je nechat.

Frontend:
- [x] Závislosti: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `msw`, `@vitest/coverage-v8`.
- [x] `vitest.config.js`: prostředí `jsdom` (existující `node` testy dál fungují), setup soubor (jest-dom matchery, MSW server start/reset/stop, úklid po testu).
- [x] `src/test/`: `server.js` (MSW server, `apiUrl()`, `authStatusHandler()`; výchozí je nepřihlášený uživatel, neošetřený request test shodí), `render.jsx` (`renderWithProviders(ui, { authStatus, route })` – router, skutečný `AuthProvider` nad mockovaným `/auth-status`, téma, tooltipy, toasty; vrací i `user` z `user-event`), `users.js` (`caregiver()`, `coordinator()`, `admin()`, `superadmin()`, `client()`).
- [x] Polyfilly pro jsdom, které Radix/shadcn potřebují (`matchMedia`, `ResizeObserver`, `scrollIntoView`, pointer capture).
- [x] Skript `coverage`.

### Fáze T2 – Backend

Pořadí podle rizika: nejdřív oprávnění (únik dat mezi organizacemi je nejhorší chyba, co aplikace může mít), pak byznys logika, pak zbytek.

#### T2a – Oprávnění (nejvyšší priorita)
Matice: role (SUPERADMIN, ADMIN, COORDINATOR, CAREGIVER, CLIENT, nepřihlášený) × záznam (vlastní středisko / jiné středisko stejné organizace / jiná organizace) × akce (číst seznam, číst detail, vytvořit, upravit, ukončit, smazat). Očekávání: 200 / 403 / 404 a hlavně **seznam neobsahuje cizí záznamy**.

- [x] **[ty → claude]** Vzor: `ClientAuthorizationIT` – detail klienta (`GET /api/clients/{id}`) pro pečovatele ze stejného a z jiného střediska a z jiné organizace. Naučí: Testcontainers, buildery, přihlášení jako konkrétní uživatel, parametrizovaný test (`@ParameterizedTest` + `@MethodSource`).
- [x] **[claude]** Seznam klientů (`GET /api/clients`) podle role – `ClientListAccessIT`: každý aktér vidí jen klienty ve svém rozsahu, cizí `organizationId` / `departmentIds` v parametru rozsah nerozšíří.
- [x] **[claude]** Zbytek klientů – `ClientAccessIT` (matice 11 aktérů × 19 endpointů): detail, vytvoření, úprava, ukončení/aktivace, účet klienta, fotka, individuální plán (čtení, historie, verze, úpravy, denní záznamy). Sdílený scénář `support/AccessScenario` (aktéři podle vztahu ke klientovi) půjde použít i pro další domény.
- [x] Nález (vysoká závažnost), opraveno: endpointy účtu klienta (`/account/create|deactivate|activate`) nekontrolovaly přístup. Teď jdou přes `ClientService.getClientForUpdate` jako úprava klienta.
- [x] Nález, opraveno podle Javadocu: pečovatel dostane ze `GET /api/clients` jen aktivní klienty bez ohledu na `status`; ve frontendu nevidí filtr stavu.
- [x] Nález z UI, opraveno: u ukončeného klienta šel vytvořit individuální plán. Plán i denní záznamy ukončeného klienta jsou teď jen ke čtení (API vrací 400, stránka nenabízí úpravy) – `InactiveClientPlanIT`, `IndividualPlan.test.jsx`.
- [x] Mazání denního záznamu sjednoceno podle frontendu: API ho dovolí jen autorovi a adminovi (SUPERADMIN, ADMIN), neexistující záznam vrací 404.
- Pozorováno, beze změny: individuální plán smí upravit jen pečovatel klienta a admin, koordinátor střediska ne (`validateIndividualPlanUpdateAccess`, odpovídá Javadocu). Superadmin nemůže přidat denní záznam (nemá zaměstnance).
- [x] **[claude]** Zaměstnanci, střediska, organizace, úkony (katalog), provedené úkony (včetně `receipt`, `receipts`, `payment-qr` – klient jen svoje), nástěnka (`view` nepovolený pro roli spadne na výchozí), `/api/user/me` a vlastní fotka. Třídy `EmployeeAccessIT`, `DepartmentAccessIT`, `OrganizationAccessIT`, `TaskAccessIT`, `PerformedTaskAccessIT` (matice) a k nim `*ListAccessIT` (rozsah seznamu), `DashboardAccessIT`, `DashboardScopeIT`, `OwnAccountIT`.
- [x] **[claude]** Nepřihlášený na každý chráněný endpoint → 401: `UnauthenticatedAccessIT`. Druhý test čte všechny endpointy ze Springu a selže, když nový endpoint v seznamu chybí.
- [x] Nálezy (opraveno, testy je hlídají):
  - Vysoká: koordinátor smí přes API přidělit roli koordinátora/vedoucího a příznak administrátora, i sám sobě. Teď jen admin (`EmployeeService.validateRoleAssignment`), koordinátor může zaměstnanci ponechat jeho současnou roli.
  - Vysoká: koordinátor smí upravit administrátora ve svém středisku (např. změnit e-mail a převzít účet přes reset hesla). Administrátora teď mění jen admin, ve frontendu koordinátor u admina nevidí úpravy ani akce.
  - Vysoká: admin smí jmenovat koordinátorem střediska zaměstnance jiné organizace (a tím mu zvýšit roli). Koordinátor musí patřit do organizace střediska (`DepartmentService.saveDepartment`).
  - Vysoká: klient získá QR platbu (částku a variabilní symbol z rodného čísla) jiného klienta přes `clientId`. QR teď jen pro vlastního klienta, neplatný měsíc → 400.
  - Střední: opětovné odeslání aktivace zaměstnance nekontrolovalo středisko ani organizaci.
  - Střední: vytvoření i úprava organizace z frontendu končila 400 (formulář neposílá `active`, mapper uložil null). Chybějící `active` teď ponechá současnou hodnotu.
  - Nízká: `PUT /api/user/me` dovolil e-mail jiného účtu (reset hesla podle e-mailu pak selže) a prázdné uživatelské jméno (zamkne účet). Teď 400.
  - Nízká: koordinátor a pečovatel viděli v katalogu i neaktivní úkony. Teď jen aktivní.
  - Nízká: neznámé `?view=` na nástěnce vracelo 400. Teď spadne na výchozí pohled jako nepovolený pohled.
  - E-mail bez `isAdmin` při vytvoření/úpravě zaměstnance spadl na 500 (`NullPointerException`).
- [x] Pozorování z T2a, rozhodnuto 2026-11-09:
  - Provedený úkon: nově přidaný pečovatel musí být ze střediska klienta (pečovatel, který mezitím přešel jinam, na starém záznamu zůstává). Pečovatel musí být mezi pečovateli svého záznamu, koordinátor a admin ne. Formulář to hlídá taky.
  - `PUT /api/departments/{id}` stav `active` nemění, deaktivace jen přes `/terminate` (s kontrolou aktivních klientů a zaměstnanců).
  - Vedoucí organizace musí patřit do té organizace (i u superadmina).
  - E-mail účtu se kontroluje na duplicitu (bez ohledu na velikost písmen) při vytvoření a úpravě účtu zaměstnance, klienta i v `PUT /api/user/me`. Unikátní index v DB odložen do kontroly dat.
  - Necháno beze změny: superadmin bez `organizationId` dostane prázdný seznam úkonů a středisek (frontend organizaci vždy posílá). Koordinátor a pečovatel vidí všechna střediska organizace včetně neaktivních (potřebují je filtry).

#### T2b – Doménová logika (unit)
- [x] **[claude]** `PerformedTaskTest` přepsaný na parametrizované testy (`@CsvSource`): nula, desetinné minuty i množství, zaokrouhlení na celé koruny.
- [x] **[claude]** `ReceiptService`: výpočty a formátování vytažené do čisté třídy `ReceiptFormatting` (`ReceiptFormattingTest`), volání Paylibo do beanu `PaymentQrClient`, který je v IT mockovaný (`AbstractIntegrationTest`). `ReceiptIT`: stvrzenka klienta a střediska, QR s částkou za měsíc a variabilním symbolem, stvrzenka i bez QR, `payment-qr` → 204 bez QR.
- [x] **[claude]** `PictureService` (`PictureServiceTest`): 512/128, ořez na čtverec, EXIF orientace, odstranění EXIF, průhlednost → bílá, limit 5 MB a 30 Mpx (odmítnuto před dekódováním), neplatný soubor, GIF a WebP (`src/test/resources/pictures/`).
- [x] **[claude]** `DashboardService`: pohledy podle role a pracovní pozice (`DashboardViewsTest`), součty za měsíc a 12 měsíců přes přelom roku, dnešek, seznamy „vyžaduje pozornost“ (`DashboardTotalsIT`). Čas přes bean `Clock` (`config/TimeConfig`), v testech `support/TestClock` – běží podle systémového času, `clock.fixAt(...)` ho zastaví, před každým testem se vrátí.
- [x] Nálezy, opraveno:
  - Střední: záznam přesně o půlnoci 1. dne měsíce se počítal do dvou měsíců (seznam, stvrzenky, QR platba – dvojí vyúčtování). `hasDateInMonth` dávalo horní mez `23:59:59.999999999`, PostgreSQL ji zaokrouhlí na půlnoc dalšího měsíce. Teď polouzavřený interval.
  - Nízká: nástěnka „moje práce“ počítala úkon o půlnoci dalšího dne do dneška a o půlnoci dalšího měsíce do minut za měsíc (`DateBetween` zahrnuje horní mez).
- [ ] **[ty]** Nálezy k rozhodnutí (testy jsou `@Disabled("Nález: ...")`):
  - Obrázky s paletou (každý GIF, PNG-8) ztratí barvy: Thumbnailator použije výchozí paletu místo vlastní, 1-4bitové vyjdou černobíle. Oprava: `.imageType(BufferedImage.TYPE_INT_ARGB)` v `PictureService.readUpright`.
  - `calculatePrice` násobí v `double`: 0,29 kg × 50 Kč = 14,4999… → 14 Kč místo 15. Oprava: `BigDecimal` (pozor, agregace pro nástěnku v SQL musí zaokrouhlovat stejně – T2d).
  - Variabilní symbol má nejvýš 10 číslic, ale u čísla klienta od 1 000 000 výš vyjde 11 (`RRMM` + číslo). Čísla klientů bez rodného čísla se generují z ID.

#### T2c – Služby a byznys pravidla (integrační)
- [ ] **[claude]** Vzor: životní cyklus klienta – ukončení (důvod, datum), aktivace, co se stane s jeho účtem. Naučí: `@SpringBootTest` bez HTTP, ověření stavu v DB.
- [ ] **[claude]** Individuální plán: vytvoření, úprava = nová verze, historie verzí, přidání a smazání denního záznamu, pečovatel jen u svého klienta.
- [ ] **[claude]** Provedené úkony: vytvoření a úprava (`validateCaregiverAssignment`), mazání, filtry měsíc/den.
- [ ] **[claude]** Zaměstnanci, střediska, organizace, úkony: vytvoření, úprava, ukončení, aktivace a jejich vedlejší efekty (uživatelský účet zaměstnance).
- [ ] **[claude]** Vzor: aktivační token – platný, prošlý, použitý podruhé. Naučí: testy s časem (`Clock`).
- [ ] **[claude]** Zbytek `UserService`: reset hesla (stejná odpověď pro existující i neexistující e-mail – žádné zjišťování účtů), dokončení aktivace, úprava vlastního účtu, opětovné odeslání aktivace.

#### T2d – Specifikace a dotazy (JPA na Postgresu)
- [ ] **[claude]** Vzor: `PerformedTaskSpecifications.hasDateInMonth` – první a poslední den měsíce, přelom roku (prosinec/leden), záznam o půlnoci. Naučí: `@DataJpaTest` s Testcontainers.
- [ ] **[claude]** `withFilters` u klientů, zaměstnanců a provedených úkonů – kombinace filtrů, prázdné filtry, neaktivní záznamy.
- [ ] **[claude]** Vlastní dotazy v repozitářích (agregace pro nástěnku – zaokrouhlení ceny stejné jako `calculatePrice`).

#### T2e – Web vrstva
- [ ] **[claude]** Vzor: neplatný vstup při vytvoření klienta → 400 a JSON s `.message`. Naučí: `@WebMvcTest`, ověření JSON odpovědi (`jsonPath`).
- [ ] **[claude]** `GlobalExceptionHandler`: každá výjimka → správný status a `.message` (404, 400, prošlý token, neočekávaná chyba bez úniku stack trace).
- [ ] **[ty]** Nález (2026-11-09): neexistující adresa (např. `/api/client/1`) vrací 500 místo 404. `@ExceptionHandler(Exception.class)` v `GlobalExceptionHandler` zachytí i `NoResourceFoundException` ze Springu. Opravit a pokrýt testem.
- [ ] **[claude]** Přihlášení formulářem (úspěch, špatné heslo, neaktivní účet), odhlášení, `auth-status`, remember-me cookie.
- [ ] **[ty]** Rozhodnout o CSRF: v `SecurityConfig` je `csrf.disable()`, přitom autentizace stojí na session cookie. Patří spíš do sekce 7b brandingového plánu (před produkcí), testy pak ověří, že zápis bez tokenu neprojde.
- [ ] **[claude]** E-mailové šablony: aktivace a reset hesla se vyrenderují a obsahují správný odkaz.

#### T2f – Prahy pokrytí
- [ ] **[claude]** Po T2 změřit pokrytí a nastavit JaCoCo práh těsně pod aktuální hodnotu (balíčky `service`, `controller`, `specification`). Práh se pak jen zvedá.

### Fáze T3 – Frontend

#### T3a – Čisté funkce
- [ ] **[claude]** Vzor: `lib/dates.js` (`fromIsoDate`, `toIsoDate` – přelom měsíce, časová zóna, neplatný vstup). Existující `formatters.test.js` a `sorting.test.js` jsou dobrý vzor struktury.
- [ ] **[claude]** `lib/pagination.js`, `lib/pictures.js` (`pictureUrl`; `shrinkPhoto` přes mock `canvas`), doplnit chybějící případy ve `formatters`.

#### T3b – API vrstva
- [ ] **[claude]** Vzor: `api/api.js` – odpověď 401 vyvolá událost `auth:unauthorized`, chybová odpověď vyhodí chybu s `.message` ze serveru. Naučí: MSW (`server.use(...)` pro jeden test).
- [ ] **[claude]** Zbytek funkcí v `api.js` (`postJSON`, `putJSON`, `deleteJSON`, `uploadFile`, prázdné tělo odpovědi, chyba sítě).

#### T3c – Hooky
- [ ] **[claude]** Vzor: `useListFilters` – změna měsíce vynuluje den a stránku, hodnoty se čtou z URL. Naučí: `renderHook` s `MemoryRouter`.
- [ ] **[claude]** `useSearchParamsUpdater`, `usePagedList` (reset stránky při změně `resetKey`), `useRecordForm`, `useDetailParam`, `useTokenValidation`, datové hooky (`useClients` apod.) proti MSW.

#### T3d – Komponenty
- [ ] **[claude]** Vzor: `ProtectedRoute` – nepřihlášený → přesměrování na login, nepovolená role → přesměrování, povolená → obsah. Naučí: `renderWithProviders` s rolí.
- [ ] **[claude]** Vzor interakce: `DayFilter` – vybrat jde jen den se záznamy, šipky skáčou mezi dny se záznamy, křížek vrátí celý měsíc. Naučí: `user-event`, klávesnice, `getByRole`.
- [ ] **[claude]** `DatePicker`, `MonthYearPicker`, `Combobox`, `MultiCombobox`, `PhotoInput` (neznámý formát → hláška), `PasswordInput`, `EmptyState`.
- [ ] **[claude]** `Table` – roving tabindex (Tab vstoupí na naposledy aktivní řádek, šipky, Home/End, → na ⋯), Enter otevře detail. `RecordSheet` – po zavření vrátí fokus na řádek.
- [ ] **[claude]** `AuthContext` – načtení `auth-status`, odhlášení po `auth:unauthorized`.

#### T3e – Stránky (integrační s MSW)
- [ ] **[claude]** Vzor: `Login` – úspěšné přihlášení přesměruje, špatné heslo ukáže chybu. Naučí: celá stránka proti MSW, ověření navigace.
- [ ] **[claude]** Pro každou seznamovou stránku (Klienti, Zaměstnanci, Provedené úkony, Úkony, Střediska, Organizace, Měsíční přehled): filtry → správné parametry v requestu, prázdný stav, chyba → toast, viditelnost akcí podle role (pečovatel nevidí „Nový klient“ atd.).
- [ ] **[claude]** Formuláře: vytvoření klienta, provedeného úkonu, zaměstnance – validace, odeslání, chyba ze serveru.
- [ ] **[claude]** Detail klienta, individuální plán, účet, aktivace a reset hesla, nástěnka (přepínač pohledů podle role).

### Fáze T4 – E2E (Playwright)
Jen toky přes celou aplikaci, které unit a integrační testy nepokryjí.

- [ ] **[claude]** Setup: Playwright ve `frontend/e2e/` (nebo samostatně `e2e/`), spuštění proti `docker-compose.yml` s demo seedem, job v CI (jen na PR do `main`, je pomalejší), screenshoty a trace při selhání jako artefakt.
- [ ] **[claude]** Vzor: přihlášení koordinátora a vytvoření provedeného úkonu, který se pak objeví v seznamu. Naučí: Playwright lokátory, `expect` s čekáním, page objects jen pokud se opakují.
- [ ] **[claude]** Přihlášení za každou roli a co vidí v sidebaru; stažení stvrzenky (PDF se stáhne a není prázdné); úprava individuálního plánu; nahrání fotky; odhlášení po vypršení session.

### Fáze T5 – Dotažení CI
- [ ] **[claude]** Pokrytí do souhrnu PR (JaCoCo + Vitest coverage v `$GITHUB_STEP_SUMMARY`).
- [ ] **[claude]** Prahy pokrytí na frontendu (stejně jako T2f: těsně pod aktuální stav, pak jen nahoru).
- [ ] **[claude]** Dependabot pro Maven, npm a GitHub Actions (týdně, seskupené PR).
- [ ] **[claude]** Volitelně CodeQL (Java + JS) – zdarma pro veřejné repo.
- [ ] **[ty]** Branch protection doplnit o E2E check.
- [ ] Do checklistu „stránka/funkce hotová“ přidat: „má testy, CI je zelené“.

---

## 6. Odkazy

- Spring Boot – Testing: https://docs.spring.io/spring-boot/reference/testing/index.html (sekce „Testing Spring Boot Applications“ a „Testcontainers“)
- Spring Security – Testing: https://docs.spring.io/spring-security/reference/servlet/test/index.html (sekce „Testing Method Security“ a „MockMvc Support“)
- Testcontainers – PostgreSQL modul: https://java.testcontainers.org/modules/databases/postgres/
- JUnit 5 – Parameterized Tests: https://junit.org/junit5/docs/current/user-guide/#writing-tests-parameterized-tests
- AssertJ: https://assertj.github.io/doc/
- Vitest: https://vitest.dev/guide/
- Testing Library – priorita dotazů: https://testing-library.com/docs/queries/about#priority
- user-event: https://testing-library.com/docs/user-event/intro
- MSW: https://mswjs.io/docs/
- Playwright: https://playwright.dev/docs/intro
- GitHub Actions – `workflow_run`: https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#workflow_run

---

## Log změn

- 2026-11-09: T2a hotová: zaměstnanci, střediska, organizace, úkony, provedené úkony, nástěnka, vlastní účet, 401 pro nepřihlášeného (865 testů). Testy psali paralelně subagenti po doménách, nálezy rovnou opraveny (viz T2a).
- 2026-11-09: opraveny nálezy z T2a (účet klienta bez kontroly přístupu, pečovatel a ukončení klienti, plán ukončeného klienta). První test stránky s MSW (`IndividualPlan.test.jsx`), `renderWithProviders` čeká na načtení přihlášení.
- 2026-11-09: T2a klienti hotoví (`ClientAccessIT`, `ClientListAccessIT`, nahrazují `ClientAuthorizationIT`), dva nálezy v T2a.
- 2026-11-09: testy přebírá Claude, uživatel dělá review a opravy aplikace. `ClientAuthorizationIT` hotový (detail klienta pro pečovatele: vlastní středisko, jiné středisko, jiná organizace).
- 2026-11-09: T0 a T1 hotové na `feature/testing` (kromě branch protection a rozhodnutí o existujících testech). Lokálně ověřeno: `mvnw verify` (19 unit + 1 IT), `npm run coverage`, `npm run build`, lint.
- 2026-11-09: plán založen. 
