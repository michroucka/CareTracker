# Rebranding CareTracker – plán a podklady

Živý dokument pro přechod na novou vizuální identitu a nové UI. Při každém kroku migrace se sem vrať: co platí pro brand, jaké jsou tokeny, v jakém pořadí se migruje a co je hotovo.

- **Brand board:** [`brand-board.html`](brand-board.html) (otevři v prohlížeči). Online verze: https://claude.ai/artifact/JbAvNfiupW1hqn5U7EUoQg
- **Assety:** [`assets/`](assets/) – SVG loga, favicon, ikony aplikace, PNG

---

## 1. Rozhodnutí

| Téma | Rozhodnutí | Proč |
| --- | --- | --- |
| Název | Zůstává **CareTracker** | Funkční a popisný. Symbol na názvu nezávisí, takže jméno lze kdykoliv změnit bez nového loga. |
| Symbol | **Buňka** – mřížka 2×2, kde jedna buňka je kruh | Tři čtverce jsou evidence (úkony, plány, výkazy), kruh je klient. Spojuje „care“ i „tracker“, funguje v 16 px a v jedné barvě. |
| Wordmark | `caretracker` malými písmeny, Bricolage Grotesque 600, převedeno na křivky | Přátelské, ne dětské. V textu UI se dál píše „CareTracker“. |
| Barvy | **Švestka + meruňka** místo modrozelené | Odklon od zdravotnického klišé, kterým mluví celá kategorie. |
| Písma | **Bricolage Grotesque** (nadpisy) + **Figtree** (text, UI) | Obě SIL OFL, plná čeština. Nahrazují Nunito. |
| UI knihovna | **shadcn/ui** na Tailwind v4, postupně místo HeroUI v2 | Kód komponent je náš, styluje se přímo Tailwindem, menší bundle. HeroUI v2 se těžko přizpůsobuje (viz workaroundy v `table.css` a `index.css`). |
| Animace | `motion` (už je v závislostech) | Jedna knihovna pro přechody stránek, layout animace a gesta. |
| Postup | **Postupná migrace**, HeroUI a shadcn běží chvíli vedle sebe | Aplikace je funkční po každém kroku, žádný velký přepis naráz. |

---

## 2. Brand – specifikace

### 2.1 Logo

**Konstrukce** (plátno 256 × 256):

- buňka 96, mezera 16, okraj 24, zaoblení rohů 28
- kruh vpravo nahoře, střed (184, 72), poloměr **50** (o 2 víc než polovina buňky – optická korekce, kruh vedle čtverce působí menší)
- **malý řez** pro 32 px a méně (`symbol-small-color.svg`, favicon, ikony): buňka 100, mezera 24, okraj 16, zaoblení 30, kruh r 52

**Barevnost:**

| Varianta | Čtverce | Kruh | Wordmark | Kdy |
| --- | --- | --- | --- | --- |
| Primární (`*-color.svg`) | Švestka | Meruňka | Inkoust | Světlé podklady, výchozí |
| Inverzní (`*-reversed.svg`) | Papír | Meruňka | Papír | Tmavý režim, tmavé podklady |
| Jedna barva (`*-plum.svg`) | Švestka | Švestka | Švestka | Jednobarevný tisk, razítka |
| Černá / bílá (`*-black.svg`, `*-white.svg`) | – | – | – | Fax, gravírování, bílá na švestkové |

**Pravidla:**

- Ochranná zóna kolem loga = 1 buňka symbolu v dané velikosti.
- Minimální šířka horizontálního loga **96 px**. Pod tím jen symbol.
- Symbol pod 32 px vždy v malém řezu.
- Barevný je jen kruh. Žádné jiné barvy, přechody, stíny, obrysy.
- Kruh je vždy vpravo nahoře. Logo neotáčet, nedeformovat, nepřeskládávat.

**Soubory v `assets/`:**

| Soubor | Použití |
| --- | --- |
| `symbol-{color,reversed,plum,black,white}.svg` | Samotný symbol |
| `symbol-small-color.svg` | Symbol pro ≤ 32 px |
| `lockup-horizontal-*.svg` | Navbar/sidebar, hlavička PDF, e-maily, README |
| `lockup-stacked-*.svg` | Přihlašovací obrazovka, čtvercové plochy |
| `favicon.svg` | Favicon, sám se přepne na světlé čtverce v tmavém režimu prohlížeče |
| `favicon.ico` | Fallback favicon (16, 32, 48) |
| `app-icon.svg`, `png/icon-{180,192,512}.png` | PWA manifest, apple-touch-icon |
| `png/icon-{16,32,48}.png` | Rastrové malé ikony |
| `png/lockup-horizontal-{color,reversed}.png` | E-maily (klienti často neumí SVG) |

### 2.2 Barvy

| Název | HEX | Úkol | Kontrast |
| --- | --- | --- | --- |
| Švestka | `#4A2B5E` | Primární: značka, hlavní tlačítka, aktivní navigace, odkazy | bílý text 11,7 : 1 |
| Meruňka | `#E26A35` | Akcent: kruh v logu, focus ring, zvýraznění, stav „čeká“ | inkoustový text 5,2 : 1 · na bílé 3,3 : 1 (jen grafika, **nikdy text na bílé**) |
| Levandule | `#ECE3F2` | Měkké plochy: vybraný řádek, aktivní položka menu, štítky, sekundární tlačítko | švestkový text 9,4 : 1 |
| Inkoust | `#1E1A24` | Text, wordmark | na papíře 15,8 : 1 |
| Papír | `#F7F5F9` | Pozadí aplikace. Karty, tabulky a dialogy jsou bílé. | – |

Pomocné odvozené hodnoty (nejsou to nové brand barvy, jen odstíny):

| Token | Světlý | Tmavý |
| --- | --- | --- |
| Pozadí | `#F7F5F9` | `#17131C` |
| Povrch (karta, dialog) | `#FFFFFF` | `#211B28` |
| Povrch 2 (hover, zebra) | `#F7F3F9` | `#2A2332` |
| Text | `#1E1A24` | `#F1EDF5` |
| Tlumený text | `#645C6E` (5,9 : 1) | `#A79EB2` (7,1 : 1) |
| Linka / border | `#E2DCE8` | `#352D3E` |
| Primární | `#4A2B5E` + bílý text | `#C2A4D6` + inkoustový text (7,8 : 1) |

**Škála švestky** (Tailwind `plum-*`, HeroUI `primary`):

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | **700** | 800 | 900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#F7F3F9` | `#ECE3F2` | `#DAC7E6` | `#C2A4D6` | `#A679C3` | `#8A4FB0` | `#6E3F8D` | `#4A2B5E` | `#372046` | `#24152E` |

**Škála meruňky** (Tailwind `apricot-*`):

| 50 | 100 | 200 | 300 | 400 | **500** | 600 | 700 | 800 | 900 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `#FCEFE9` | `#F8DBCE` | `#F2BDA6` | `#EDA07E` | `#E78255` | `#E26A35` | `#CD531D` | `#A54318` | `#783111` | `#4C1F0B` |

**Sémantické barvy** (nejsou součást brandu, slouží stavům):

| Stav | DEFAULT | Měkké pozadí / text | Poznámka |
| --- | --- | --- | --- |
| Success | `#1E8752` | `#E3F0E9` / `#145835` | beze změny |
| Warning | `#E6B325` | `#FCF6E4` / `#6D5512` | beze změny, text na ní inkoustový |
| Danger | `#C9364F` | `#FAEBED` / `#892436` | **posun z `#D64545`** do malinové, aby se nepletla s meruňkou |

### 2.3 Typografie

| Role | Písmo | Řezy | Fallback |
| --- | --- | --- | --- |
| Nadpisy, wordmark, velká čísla | Bricolage Grotesque | 500, 600, 700 | `"Figtree", ui-sans-serif, system-ui, sans-serif` |
| Text, formuláře, tabulky | Figtree | 400, 500, 600, 700 | `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` |

Google Fonts odkaz (do `frontend/index.html` místo Nunito):

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..700&family=Figtree:wght@400..700&display=swap" rel="stylesheet">
```

Velikostní škála, poměr 1,25, základ 16 px:

| Token | px | Použití |
| --- | --- | --- |
| `text-xs` | 12,8 | popisky, meta, štítky (uppercase + `tracking-wide`) |
| `text-base` | 16 | text, inputy, tabulky (tabulky můžou 14) |
| `text-xl` | 20 | h4, nadpis karty |
| `text-2xl` | 25 | h3, nadpis stránky na mobilu |
| `text-3xl` | 31 | h2, nadpis stránky |
| `text-4xl` | 39 | h1, velká čísla v přehledu |

Pravidla:

- Nadpisy `font-display font-semibold`, `text-wrap: balance`, `tracking-tight`.
- Všechna čísla v tabulkách a částky `tabular-nums`.
- Formát: `24. 10. 2026`, `1 240,00 Kč`, `0,5 h` (české locale přes `Intl`).

### 2.4 Tvar, prostor, stín

| Token | Hodnota | Použití |
| --- | --- | --- |
| `--radius-sm` | 8px | checkbox, malé štítky |
| `--radius-md` | 10px | tlačítka, inputy, položky menu |
| `--radius-lg` | 14px | karty, tabulky, dropdowny |
| `--radius-xl` | 18px | dialogy, přihlašovací karta |
| pill | 999px | stavové pilulky, filtry |
| `--shadow-sm` | `0 1px 2px rgb(30 26 36 / 0.06)` | karty |
| `--shadow-md` | `0 8px 24px rgb(30 26 36 / 0.10)` | dropdowny, popovery |
| `--shadow-lg` | `0 20px 50px rgb(30 26 36 / 0.18)` | dialogy |

Prostor: Tailwind škála po 4 px. Stránka `px-4 md:px-6 lg:px-8`, mezery mezi sekcemi `gap-6`, uvnitř karty `p-5`.

Stíny jsou jemné a tónované do inkoustu, ne šedé. Karty oddělovat spíš linkou `border` než stínem.

### 2.5 Pohyb

| Token | Hodnota | Použití |
| --- | --- | --- |
| `--duration-fast` | 120ms | hover, barva, focus |
| `--duration-base` | 200ms | dropdown, tooltip, toast |
| `--duration-slow` | 320ms | dialog, sheet, přechod stránky |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | vstupy |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | odchody (kratší než vstup) |

Pravidla:

- Animuje se jen `transform` a `opacity` (rychlé, bez přepočtu layoutu).
- Dialog: fade + scale z 0,96. Sheet/drawer: slide z okraje. Dropdown: fade + posun 4 px.
- Seznamy a tabulky při filtrování: `motion` `layout` + `AnimatePresence`, jen pro rozumný počet řádků (stovky ne).
- Přechod mezi stránkami: krátký fade + posun 8 px, žádné dlouhé efekty.
- Vždy respektovat `prefers-reduced-motion` (`useReducedMotion()` z motion, `motion-reduce:` v Tailwindu).
- Skeletony místo spinnerů tam, kde je známý tvar obsahu (tabulky, karty).

---

## 3. Design tokeny v kódu

Jediný zdroj pravdy budou CSS proměnné v `frontend/src/styles/index.css`. Názvy sémantických tokenů odpovídají konvenci shadcn (`--background`, `--primary`, …), takže komponenty ze shadcn fungují bez úprav. Brand barvy mají vlastní škály.

> Pozor na rozdíl v názvosloví: v **shadcn** je `secondary` měkké sekundární tlačítko (u nás levandule) a `accent` je hover pozadí. Meruňka má vlastní token `--highlight`. V **HeroUI** tématu (fáze 2) je `secondary` meruňka. Až HeroUI zmizí, platí jen shadcn význam.

Cílový stav (fáze 3):

```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

:root {
  --background: #F7F5F9;
  --foreground: #1E1A24;
  --card: #FFFFFF;
  --card-foreground: #1E1A24;
  --popover: #FFFFFF;
  --popover-foreground: #1E1A24;
  --primary: #4A2B5E;
  --primary-foreground: #FFFFFF;
  --secondary: #ECE3F2;
  --secondary-foreground: #4A2B5E;
  --muted: #F7F3F9;
  --muted-foreground: #645C6E;
  --accent: #F7F3F9;
  --accent-foreground: #1E1A24;
  --highlight: #E26A35;
  --highlight-foreground: #1E1A24;
  --destructive: #C9364F;
  --destructive-foreground: #FFFFFF;
  --success: #1E8752;
  --warning: #E6B325;
  --border: #E2DCE8;
  --input: #E2DCE8;
  --ring: #E26A35;
  --radius: 10px;

  --sidebar: #F7F5F9;
  --sidebar-foreground: #4D4557;
  --sidebar-primary: #4A2B5E;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #ECE3F2;
  --sidebar-accent-foreground: #4A2B5E;
  --sidebar-border: #E2DCE8;
  --sidebar-ring: #E26A35;
}

.dark {
  --background: #17131C;
  --foreground: #F1EDF5;
  --card: #211B28;
  --card-foreground: #F1EDF5;
  --popover: #211B28;
  --popover-foreground: #F1EDF5;
  --primary: #C2A4D6;
  --primary-foreground: #1E1A24;
  --secondary: #2A2332;
  --secondary-foreground: #F1EDF5;
  --muted: #2A2332;
  --muted-foreground: #A79EB2;
  --accent: #2A2332;
  --accent-foreground: #F1EDF5;
  --highlight: #E78255;
  --highlight-foreground: #1E1A24;
  --destructive: #DE8292;
  --destructive-foreground: #1E1A24;
  --success: #6DB18F;
  --warning: #EFCE71;
  --border: #352D3E;
  --input: #352D3E;
  --ring: #E78255;

  --sidebar: #1C1722;
  --sidebar-foreground: #C9C0D3;
  --sidebar-primary: #C2A4D6;
  --sidebar-primary-foreground: #1E1A24;
  --sidebar-accent: #2A2332;
  --sidebar-accent-foreground: #F1EDF5;
  --sidebar-border: #352D3E;
  --sidebar-ring: #E78255;
}

@theme inline {
  --font-sans: "Figtree", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: "Bricolage Grotesque", "Figtree", ui-sans-serif, system-ui, sans-serif;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --color-plum-50: #F7F3F9;
  --color-plum-100: #ECE3F2;
  --color-plum-200: #DAC7E6;
  --color-plum-300: #C2A4D6;
  --color-plum-400: #A679C3;
  --color-plum-500: #8A4FB0;
  --color-plum-600: #6E3F8D;
  --color-plum-700: #4A2B5E;
  --color-plum-800: #372046;
  --color-plum-900: #24152E;

  --color-apricot-50: #FCEFE9;
  --color-apricot-100: #F8DBCE;
  --color-apricot-200: #F2BDA6;
  --color-apricot-300: #EDA07E;
  --color-apricot-400: #E78255;
  --color-apricot-500: #E26A35;
  --color-apricot-600: #CD531D;
  --color-apricot-700: #A54318;
  --color-apricot-800: #783111;
  --color-apricot-900: #4C1F0B;

  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
  --radius-xl: calc(var(--radius) + 8px);

  --shadow-sm: 0 1px 2px rgb(30 26 36 / 0.06);
  --shadow-md: 0 8px 24px rgb(30 26 36 / 0.10);
  --shadow-lg: 0 20px 50px rgb(30 26 36 / 0.18);

  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans antialiased; }
  h1, h2, h3, h4 { @apply font-display font-semibold tracking-tight text-balance; }
}
```

Dark mode se dál přepíná třídou `.dark` na `<html>` (stávající `ThemeContext` a `@custom-variant dark`).

---

## 4. Plán migrace

Pracuj na větvi `feature/rebranding` z `develop`. Každá fáze končí funkční aplikací, dá se mergovat samostatně.

### Fáze 0 – Příprava
- [ ] Větev `feature/rebranding`.
- [ ] Projít brand board a tenhle dokument, případně doladit otevřené otázky (sekce 7).
- [ ] Udělat screenshoty klíčových stránek před změnou (pro porovnání a do README).

### Fáze 1 – Statické body značky (bez změny UI knihovny)
Rychlá viditelná změna, žádné riziko.

- [ ] `frontend/public/`: nahradit `ct_icon*.svg`, `ct_icon_pwa.png` za `favicon.svg`, `favicon.ico`, `icon-180.png`, `icon-192.png`, `icon-512.png`.
- [ ] `frontend/index.html`: favicon odkazy, `apple-touch-icon`, `theme-color` (`#F7F5F9` světlý, `#17131C` tmavý přes `media`), Google Fonts (sekce 2.3), `lang="cs"`.
- [ ] `frontend/public/manifest.json`: ikony 192 a 512 (+ `"purpose": "maskable"` varianta), `theme_color`, `background_color`.
- [ ] `frontend/src/assets/`: nové `logo_light.svg` / `logo_dark.svg` = `lockup-horizontal-color.svg` / `lockup-horizontal-reversed.svg`, `ct_icon.svg` = `symbol-color.svg`.
- [ ] `CareTrackerLogo.jsx` a `Login.jsx`: přepnout na nové soubory, zvážit inline SVG komponentu s `currentColor`, aby se logo samo přebarvilo v dark mode (pak stačí jeden soubor).
- [ ] `.github/assets/` + `README.md`, `README.en.md`: nová loga (`<picture>` se `prefers-color-scheme` pro světlé/tmavé GitHub téma).
- [ ] E-maily `backend/src/main/resources/templates/email/*.html`: barvy (`#21a35e` → `#4A2B5E`, hover `#372046`, světlé pozadí `#F7F5F9`, text `#1E1A24`), písmo Figtree s fallbackem, logo jako PNG (absolutní URL).
- [ ] PDF `templates/receipt/performed-task-receipt.html` + `ReceiptService.java`: Figtree TTF (Regular + Bold, případně Bricolage pro nadpis) do `backend/src/main/resources/fonts/`, registrace v `ReceiptService` místo Nunito. Hlavička se švestkovou linkou podle mockupu, logo jako SVG/PNG.

### Fáze 2 – Tokeny a přebarvení HeroUI (most mezi starým a novým)
Cíl: celá aplikace má nové barvy a písma ještě před výměnou komponent, takže během migrace nebude vypadat napůl.

- [ ] `index.css`: přidat tokeny ze sekce 3 (sémantické + škály + písma + radius + stíny). `--font-sans` na Figtree.
- [ ] `hero.ts`: přebarvit podle brand boardu (sekce „Téma pro HeroUI“):
  - `primary` = škála švestky, `DEFAULT: #4A2B5E`, v dark `DEFAULT: #C2A4D6` + `foreground: #1E1A24`
  - `secondary` = škála meruňky, `foreground: #1E1A24`
  - `danger` = malinová škála (`#C9364F`)
  - `background`, `foreground`, `content1–4`, `default` škála do švestkově tónovaných neutrálů
  - `focus: #E26A35`
- [ ] Projít použití `bg-secondary` / `text-secondary` (dnes modrá, nově meruňka) – na bílé nesmí být meruňkový text.
- [ ] Nadpisy h1–h4 na `font-display`.
- [ ] Kontrola obou režimů na všech stránkách.

### Fáze 3 – Setup shadcn/ui
- [ ] Alias `@` → `src`: `resolve.alias` ve `vite.config` + `paths` v `tsconfig.json` (a `jsconfig.json` pro JSX soubory).
- [ ] `npx shadcn@latest init` – Vite, Tailwind v4, CSS proměnné. Projekt je většinou JSX, takže `"tsx": false` v `components.json` (nebo nové komponenty psát v TSX, rozhodnout jednou a držet).
- [ ] Ověřit, že `init` nepřepsal tokeny ze sekce 3 (shadcn generuje vlastní `:root` – nahradit našimi).
- [ ] Základní komponenty: `button`, `input`, `label`, `textarea`, `checkbox`, `select`, `dialog`, `alert-dialog`, `dropdown-menu`, `popover`, `tooltip`, `table`, `card`, `badge`, `separator`, `skeleton`, `sheet`, `sidebar`, `sonner`.
- [ ] Doladit varianty v `src/components/ui/*` podle brandu (radius, výšky 40 px, focus ring meruňkový, `active:scale-[0.98]` u tlačítek).
- [ ] HeroUI zatím nechat (`HeroUIProvider`, `@plugin`, `@source`). Obě knihovny čtou stejné tokeny.

### Fáze 4 – Kostra aplikace (app shell)
Nejvíc viditelná změna, nezávislá na formulářích.

- [ ] Rozhodnout layout (doporučení: **sidebar na desktopu**, na mobilu horní lišta + `Sheet` s menu, viz sekce 7).
- [ ] Nový `AppLayout` se shadcn `Sidebar`: logo nahoře, položky podle role (stávající logika z `Navbar.jsx` a `ProtectedRoute`), aktivní položka levandule + meruňková tečka, dole účet a `ThemeSwitcher`.
- [ ] Hlavička stránky: nadpis (Bricolage) + akce vpravo (primární tlačítko „Zapsat úkon“ atd.).
- [ ] Přechod mezi stránkami přes `motion` (sekce 2.5).
- [ ] Nahradit `Navbar.jsx`, `Footer.jsx`, `BackToTopButton.jsx` (zvážit, jestli jsou v novém layoutu potřeba).

### Fáze 5 – Migrace stránek
Pořadí od nejjednodušší a nejsamostatnější:

1. [ ] `Login.jsx`, `Activate.jsx`, `ResetPassword.jsx` – samostatné, vyzkouší se Form, Input, Button, toasty.
2. [ ] `Account.jsx`
3. [ ] `Home.jsx` (přehled, Recharts – jen přebarvit grafy na tokeny)
4. [ ] `Organizations.jsx`, `Departments.jsx`, `Tasks.jsx` – jednodušší tabulky + formulářové modaly
5. [ ] `Employees.jsx`, `Clients.jsx` – tabulky s filtry (`useFilterMetadata`, `useRoleBasedFilters` zůstávají, mění se jen UI)
6. [ ] `PerformedTasks.jsx` – hlavní obrazovka, tabulka, filtry, nejvíc dialogů
7. [ ] `ClientDetail.jsx`, `ClientCreate.jsx`, `IndividualPlan.jsx`, `MonthlyReport.jsx`
8. [ ] Sdílené: `components/forms/*`, `components/modals/*`, `MonthYearPicker.jsx`, `ImageUpload.jsx`, `ReadOnlyField.jsx`, `MyToast.jsx`

Každou stránku dokončit podle checklistu v sekci 6.

### Fáze 6 – Odstranění HeroUI
- [ ] `grep -r "@heroui" src` vrací nic.
- [ ] Odebrat `@heroui/react`, `@heroui/toast`, `@heroui/use-theme`, `framer-motion` (pokud ho nic jiného nepoužívá; `motion` zůstává).
- [ ] `index.css`: smazat `@plugin "./hero.ts"`, `@source ../../node_modules/@heroui…`, workaroundy pro toasty. Smazat `hero.ts`, `table.css` (pokud už nic nepoužívá).
- [ ] `providers.tsx`: odstranit `HeroUIProvider`.
- [ ] `npm run build` a porovnat velikost bundlu s velikostí před migrací.

### Fáze 7 – Doladění
- [ ] Prázdné stavy (žádní klienti, žádné úkony v měsíci) s motivem symbolu.
- [ ] Skeletony pro tabulky a karty.
- [ ] Přístupnost: klávesnice ve všech dialozích a menu, viditelný focus, kontrast v obou režimech.
- [ ] Responzivita: 360 px, 768 px, 1280 px; tabulky na mobilu jako karty nebo horizontální scroll.
- [ ] Lighthouse (výkon, přístupnost) na Login a PerformedTasks.
- [ ] Nové screenshoty do README.

---

## 5. Mapa komponent HeroUI → nová řešení

Počty = výskyty importů v `src` (stav říjen 2026, 55 souborů).

| HeroUI | Počet | Náhrada | Poznámka |
| --- | --- | --- | --- |
| `Button` | 45 | shadcn `button` | Varianty: `default` (švestka), `secondary` (levandule), `outline`, `ghost`, `destructive`, `link`. `isLoading` → `disabled` + spinner ikona. `onPress` → `onClick`. |
| `Modal`, `ModalContent/Header/Body/Footer` | 24 | shadcn `dialog` | Potvrzení mazání (`DeleteConfirmationModal`) → `alert-dialog`. Na mobilu zvážit `sheet` / `drawer`. |
| `Spinner` | 20 | `Loader2` z lucide + `animate-spin`, nebo `skeleton` | Kde je známý tvar obsahu, použít skeleton. |
| `Input` | 17 | shadcn `input` + `label` | HeroUI má label a chybu v sobě, tady se skládá. Udělat si malou `FormField` komponentu. |
| `Form` | 15 | nativní `<form>` (nebo shadcn `form` s react-hook-form) | Rozhodnout jednou (sekce 7). Validace dnes řeší HeroUI `validationErrors`. |
| `Dropdown*` | 9 | shadcn `dropdown-menu` | `DropdownSection` → `DropdownMenuGroup` + `DropdownMenuLabel`. |
| `Table*` | 7 | shadcn `table` (+ TanStack Table pro řazení/stránkování) | Odpadnou workaroundy z `table.css`. Výběr řádku = levandule. |
| `Select`, `SelectItem` | 6 | shadcn `select` | Vícenásobný výběr (filtry) → `popover` + `command` s checkboxy. |
| `Autocomplete*` | 6 | shadcn combobox (`popover` + `command`) | Vyhledávání klientů/pečovatelů. |
| `Textarea` | 5 | shadcn `textarea` | |
| `DatePicker` | 5 | shadcn `calendar` (react-day-picker, locale `cs`) + `popover` | Formát `d. M. yyyy`, týden od pondělí. Alternativa: `DatePicker` z React Aria Components. |
| `Card*` | 5 | shadcn `card` | |
| `NumberInput` | 4 | `input` s `inputMode="decimal"` + parsování čárky, nebo `NumberField` z React Aria Components | Množství `0,5 h`, `3,5 kg`. |
| `Checkbox` | 4 | shadcn `checkbox` | |
| `Tooltip` | 4 | shadcn `tooltip` | |
| `addToast`, `@heroui/toast` | 2 | `sonner` (`toast.success`, `toast.error`) | `MyToast.jsx` přepsat na tenký wrapper nad sonner. |
| `Divider` | 7 | shadcn `separator` | |
| `Popover*` | 1 | shadcn `popover` | |
| `Navbar*` | 1 | shadcn `sidebar` + `sheet` | Fáze 4. |
| `User` | 1 | shadcn `avatar` + text | |
| `Link` | 2 | React Router `Link` s Tailwind třídami | |
| `Image` | 1 | `<img>` | |
| `Alert` | 1 | shadcn `alert` | |
| `HeroUIProvider` | 1 | – | Smazat ve fázi 6. Pozor: poskytuje i `navigate` pro routing a locale. |

---

## 6. Checklist „stránka hotová“

- [ ] Žádný import z `@heroui/*`.
- [ ] Barvy jen přes tokeny (`bg-primary`, `text-muted-foreground`, `border-border`…), žádné HEX v JSX.
- [ ] Nadpis stránky `font-display`, čísla `tabular-nums`, české formáty dat a částek.
- [ ] Funguje ve světlém i tmavém režimu.
- [ ] Funguje na 360 px šířky bez horizontálního scrollu stránky.
- [ ] Ovladatelné klávesnicí, focus je vidět (meruňkový ring).
- [ ] Loading stav (skeleton/spinner), prázdný stav, chybový stav s toastem.
- [ ] Animace jen `transform`/`opacity`, respektují `prefers-reduced-motion`.
- [ ] Chování podle rolí beze změny (SUPERADMIN / ADMIN / COORDINATOR / CAREGIVER / CLIENT).
- [ ] `npm run lint` a `npm test` prochází.

---

## 7. Otevřené otázky

| Otázka | Doporučení |
| --- | --- |
| Horní navbar, nebo sidebar? | Sidebar na desktopu (mockup), na mobilu horní lišta + výsuvné menu. Aplikace má hodně sekcí a sidebar je škáluje líp. |
| Formuláře: nativní `<form>`, nebo react-hook-form + zod? | react-hook-form + zod: shadcn `form` na ně počítá, validace bude na jednom místě a sdílená mezi formuláři. |
| Nové komponenty v JSX, nebo TSX? | Držet JSX jako zbytek projektu, pokud neplánuješ převod na TS. |
| Datumy: react-day-picker, nebo React Aria? | react-day-picker (shadcn `calendar`), React Aria jen pokud bude potřeba psaní data z klávesnice po segmentech. |
| Ochranná známka / doména | Před veřejným spuštěním ověřit „CareTracker“ v databázích ÚPV a EUIPO. |

---

## 8. Odkazy

- shadcn/ui: https://ui.shadcn.com (Vite: https://ui.shadcn.com/docs/installation/vite, theming: https://ui.shadcn.com/docs/theming)
- Tailwind v4 `@theme`: https://tailwindcss.com/docs/theme
- motion pro React: https://motion.dev/docs/react
- React Aria Components (NumberField, DatePicker): https://react-spectrum.adobe.com/react-aria/components.html
- react-day-picker (české locale): https://daypicker.dev
- Písma: https://fonts.google.com/specimen/Bricolage+Grotesque, https://fonts.google.com/specimen/Figtree (SIL OFL 1.1)

---

## Log změn

| Datum | Změna |
| --- | --- |
| 2026-10-25 | Rozhodnutí o brandu (Buňka, švestka + meruňka, Bricolage + Figtree), plán migrace na shadcn/ui |
| 2026-10-25 | Typografická studie (7 variant, https://claude.ai/artifact/ViUmMKLE4DSua5oJ8KQapf): potvrzeno Bricolage + Figtree. Atkinson Hyperlegible zamítnut kvůli přeškrtnuté nule. |
