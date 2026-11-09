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
| Ikony | **Tabler** (`@tabler/icons-react`) místo Lucide | Vybráno 2026-11-08 po srovnání v katalogu. Nové komponenty v `ui/` už ho používají, stránky přejdou ve fázi 5, Lucide se odinstaluje ve fázi 6. Pozor: tloušťka čáry je prop `stroke`, ne `strokeWidth`. Plné varianty (`…Filled`) nejsou u všech ikon, aktivní stav proto dělat barvou, ne výplní. |
| Animace | `motion` (už je v závislostech) | Jedna knihovna pro přechody stránek, layout animace a gesta. |
| Postup | **Postupná migrace**, HeroUI a shadcn běží chvíli vedle sebe | Aplikace je funkční po každém kroku, žádný velký přepis naráz. |
| Detaily záznamů | **Sheet zprava** (na mobilu přes celou obrazovku), stav v URL. Klient a individuální plán zůstávají jako stránky. | Seznam zůstává vidět, detail jde sdílet odkazem, tlačítko zpět ho zavře. Modal zakrývá kontext a vede k vnořeným modalům. Viz sekce 2.6. |
| Úprava záznamu | **Přímo v sheetu** – přepnutí zobrazení na formulář | Žádný další modal nad detailem, uživatel neztratí kontext. |

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

Jediný zdroj pravdy: CSS proměnné v `index.css` (`--duration-*`, `--ease-*`) a stejné hodnoty pro `motion` v `src/lib/motion.js` (`DURATION`, `EASE_OUT`, `EASE_IN`). V kódu **nikdy** `duration-150`, `duration-[250ms]` ani vlastní `cubic-bezier`, jen tokeny.

| Token | Hodnota | Tailwind / motion | Použití |
| --- | --- | --- | --- |
| `--duration-fast` | 150ms | `duration-fast` / `DURATION.fast` | focus ring a rámeček inputu, barva labelu, stisk, odchod drobností (odkreslení checkboxu) |
| `--duration-base` | 200ms | `duration-base` / `DURATION.base` | hover barvy tlačítek, dropdown, select, popover, tooltip, toast, chybová hláška, zavření dialogu a sheetu, kreslení checkboxu |
| `--duration-slow` | 300ms | `duration-slow` / `DURATION.slow` | otevření dialogu a sheetu, přechod stránky, zatřesení pole |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | `ease-out` / `EASE_OUT` | výchozí pro všechno: vstupy, hover, změny stavu |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | `ease-in` / `EASE_IN` | jen odchody, které mají „odjet“ (odkreslení fajfky, mizení prvku) |

Overlaye (dialog, sheet): `data-[state=open]:duration-slow data-[state=closed]:duration-base` – odchod je vždy kratší než vstup.

Pravidla:

- Animuje se jen `transform` a `opacity` (rychlé, bez přepočtu layoutu).
- Dialog: fade + scale z 0,96. Sheet/drawer: slide z okraje. Dropdown: fade + posun 4 px.
- Seznamy a tabulky při filtrování: `motion` `layout` + `AnimatePresence`, jen pro rozumný počet řádků (stovky ne).
- Přechod mezi stránkami: krátký fade + posun 8 px, žádné dlouhé efekty.
- Vždy respektovat `prefers-reduced-motion` (`useReducedMotion()` z motion, `motion-reduce:` v Tailwindu).
- Skeletony místo spinnerů tam, kde je známý tvar obsahu (tabulky, karty).

**Co čím animovat:**

| Vrstva | Nástroj | Na co |
| --- | --- | --- |
| Mikrointerakce | Tailwind `transition-*` + tokeny délek | hover, focus, stisk tlačítka (`active:scale-[0.98]`), změny barev |
| Otevření / zavření overlayů | `tw-animate-css` přes Radix `data-[state=open/closed]` (shadcn ho přidává) | dialog, sheet, dropdown, popover, tooltip |
| Odchody, layout, výška `auto`, gesta | `motion` (`AnimatePresence`, `layout`, `layoutId`, `drag`) | mazání řádku, přeskládání filtrované tabulky, posuvný indikátor aktivní položky v sidebaru, rozbalení sekce, stažení sheetu na mobilu, počítadla čísel na přehledu |
| Přechod mezi stránkami | View Transitions API (`viewTransition` na `<Link>` / `navigate` v React Router 7) | krátké prolnutí stránek bez vlastního kódu |

Cíl je, aby aplikace působila „živě“ díky konzistenci (všude stejné délky a křivky), ne díky efektům.

### 2.6 Vzory zobrazení

| Vzor | Kdy | Kde |
| --- | --- | --- |
| **Sheet zprava** (na mobilu přes celou obrazovku nebo zespodu) | Prohlížení a úprava záznamu ze seznamu | Detail provedeného úkonu, úkonu z katalogu, střediska, organizace, zaměstnance. Zápis nového úkonu (nejčastější akce, často z mobilu). |
| **Stránka** | Bohatá entita s podsekcemi | Klient, individuální plán, měsíční výkaz |
| **Dialog** | Krátká soustředěná akce | Vytvoření střediska / úkonu / organizace, generování výkazu, filtry na mobilu |
| **Potvrzovací dialog (`alert-dialog`)** | Potvrzení nevratné akce | Smazání, ukončení, deaktivace |

Pravidla pro sheet s detailem:

- Stav v URL přes search param (`/performed-tasks?detail=123`). Otevření = `setSearchParams`, zavření = odebrání parametru, takže tlačítko zpět sheet zavře a odkaz jde sdílet.
- Otevřený řádek je v tabulce zvýrazněný levandulí.
- Klik na jiný řádek sheet nezavírá, jen prolne obsah (`AnimatePresence` s `key` podle id).
- Úprava přímo v sheetu: tlačítko „Upravit“ přepne zobrazení na formulář, „Uložit“ / „Zrušit“ ho vrátí zpět. Žádný další modal.
- Smazání z detailu otevře `alert-dialog` nad sheetem (jediný povolený vnořený overlay).

**Rozložení detailu (schválený vzor: `src/components/catalog/TaskDetailSheetExample.jsx`, v katalogu „Sheet – detail úkonu“):**

- Šířka `sm:max-w-md`, na mobilu celá šířka. Hlavička stojí, tělo se posouvá.
- Hlavička: štítek s typem záznamu + tlumená meta (datum, středisko), velký nadpis `font-display`.
- Akce **v patičce** (od 2026-11-08, původně pod nadpisem): vlevo menu „⋯“ (smazání, deaktivace…), vpravo „Upravit“. Při úpravě je na stejném místě „Zrušit / Uložit změny“, takže akce jsou vždy dole a na mobilu pod palcem. Řeší `RecordSheet` přes `onEdit` a `moreActions`.
- Nahoře souhrn: 2 tlumené dlaždice s klíčovými čísly (množství, cena) v `tabular-nums`.
- Pod tím sekce s malými uppercase popisky oddělené `Separator`. Lidé jako iniciály + jméno + detail.
- Úprava na místě: obsah se prolne na formulář z `FormField`, patička „Zrušit / Uložit změny“ jen v režimu úpravy.

---

## 3. Design tokeny v kódu

Jediný zdroj pravdy budou CSS proměnné v `frontend/src/styles/index.css`. Názvy sémantických tokenů odpovídají konvenci shadcn (`--background`, `--primary`, …), takže komponenty ze shadcn fungují bez úprav. Brand barvy mají vlastní škály.

> Pozor na rozdíl v názvosloví: v **shadcn** je `secondary` měkké sekundární tlačítko (u nás levandule) a `accent` je hover pozadí. Meruňka má vlastní token `--highlight`. Od fáze 3 má i **HeroUI** `secondary` levanduli: utility z `@theme inline` mají přednost před HeroUI pluginem, takže obě knihovny musí mít stejné hodnoty u sdílených názvů (`primary`, `secondary`, `background`, `foreground`, `success`, `warning`).

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
  --primary-hover: #372046;
  --secondary: #ECE3F2;
  --secondary-foreground: #4A2B5E;
  --secondary-hover: #DAC7E6;
  --muted: #F7F3F9;
  --muted-foreground: #645C6E;
  --accent: #EFE9F3;
  --accent-foreground: #1E1A24;
  --highlight: #E26A35;
  --highlight-foreground: #1E1A24;
  --destructive: #C9364F;
  --destructive-foreground: #FFFFFF;
  --destructive-hover: #AF3249;
  --success: #1E8752;
  --warning: #E6B325;
  --success-soft: #E3F0E9;
  --success-soft-foreground: #145835;
  --warning-soft: #FCF6E4;
  --warning-soft-foreground: #6D5512;
  --danger-soft: #FAEBED;
  --danger-soft-foreground: #892436;
  --pending-soft: #FCEFE9;
  --pending-soft-foreground: #A54318;
  --border: #E2DCE8;
  --input: #E2DCE8;
  --ring: #E26A35;
  --radius: 10px;

  --sidebar: #EDE8F1;
  --sidebar-foreground: #4D4557;
  --sidebar-primary: #4A2B5E;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #E2DAE9;
  --sidebar-accent-foreground: #1E1A24;
  --sidebar-active: #FFFFFF;
  --sidebar-active-foreground: #4A2B5E;
  --sidebar-border: #DDD5E4;
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
  --primary-hover: #DAC7E6;
  --secondary: #3B2D4A;
  --secondary-foreground: #F1EDF5;
  --secondary-hover: #4A3A5C;
  --muted: #2A2332;
  --muted-foreground: #A79EB2;
  --accent: #332A3D;
  --accent-foreground: #F1EDF5;
  --highlight: #E78255;
  --highlight-foreground: #1E1A24;
  --destructive: #DE8292;
  --destructive-foreground: #1E1A24;
  --destructive-hover: #E7A5B0;
  --success: #6DB18F;
  --warning: #EFCE71;
  --success-soft: #2D3338;
  --success-soft-foreground: #6DB18F;
  --warning-soft: #423834;
  --warning-soft-foreground: #EFCE71;
  --danger-soft: #3F2B39;
  --danger-soft-foreground: #DE8292;
  --pending-soft: #412B2F;
  --pending-soft-foreground: #E78255;
  --border: #352D3E;
  --input: #352D3E;
  --ring: #E78255;

  --sidebar: #110D15;
  --sidebar-foreground: #C9C0D3;
  --sidebar-primary: #C2A4D6;
  --sidebar-primary-foreground: #1E1A24;
  --sidebar-accent: #211B28;
  --sidebar-accent-foreground: #F1EDF5;
  --sidebar-active: #2A2332;
  --sidebar-active-foreground: #F1EDF5;
  --sidebar-border: #2A2332;
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
  --color-primary-hover: var(--primary-hover);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary-hover: var(--secondary-hover);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-highlight: var(--highlight);
  --color-highlight-foreground: var(--highlight-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-destructive-hover: var(--destructive-hover);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-success-soft: var(--success-soft);
  --color-success-soft-foreground: var(--success-soft-foreground);
  --color-warning-soft: var(--warning-soft);
  --color-warning-soft-foreground: var(--warning-soft-foreground);
  --color-danger-soft: var(--danger-soft);
  --color-danger-soft-foreground: var(--danger-soft-foreground);
  --color-pending-soft: var(--pending-soft);
  --color-pending-soft-foreground: var(--pending-soft-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-active: var(--sidebar-active);
  --color-sidebar-active-foreground: var(--sidebar-active-foreground);
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
- [x] Větev `feature/rebranding`.
- [ ] Projít brand board a tenhle dokument, případně doladit otevřené otázky (sekce 7).
- [x] Udělat screenshoty klíčových stránek před změnou (pro porovnání a do README).

### Fáze 1 – Statické body značky (bez změny UI knihovny)
Rychlá viditelná změna, žádné riziko.

- [x] `frontend/public/`: nahradit `ct_icon*.svg`, `ct_icon_pwa.png` za `favicon.svg`, `favicon.ico`, `icon-180.png`, `icon-192.png`, `icon-512.png`.
- [x] `frontend/index.html`: favicon odkazy, `apple-touch-icon`, `theme-color` (`#F7F5F9` světlý, `#17131C` tmavý přes `media`), Google Fonts (sekce 2.3), `lang="cs"`.
- [x] `frontend/public/manifest.json`: ikony 192 a 512 (+ `"purpose": "maskable"` varianta), `theme_color`, `background_color`.
- [x] `frontend/src/assets/`: nové `logo_light.svg` / `logo_dark.svg` = `lockup-horizontal-color.svg` / `lockup-horizontal-reversed.svg`, `ct_icon.svg` = `symbol-color.svg`.
- [x] `CareTrackerLogo.jsx` a `Login.jsx`: přepnout na nové soubory, zvážit inline SVG komponentu s `currentColor`, aby se logo samo přebarvilo v dark mode (pak stačí jeden soubor).
- [x] `.github/assets/` + `README.md`, `README.en.md`: nová loga (`<picture>` se `prefers-color-scheme` pro světlé/tmavé GitHub téma).
- [x] E-maily `backend/src/main/resources/templates/email/*.html`: barvy (`#21a35e` → `#4A2B5E`, hover `#372046`, světlé pozadí `#F7F5F9`, text `#1E1A24`), písmo Figtree s fallbackem, logo jako PNG (absolutní URL).
- [x] PDF `templates/receipt/performed-task-receipt.html` + `ReceiptService.java`: Figtree TTF (Regular + Bold, případně Bricolage pro nadpis) do `backend/src/main/resources/fonts/`, registrace v `ReceiptService` místo Nunito. Hlavička se švestkovou linkou podle mockupu, logo jako SVG/PNG.

### Fáze 2 – Tokeny a přebarvení HeroUI (most mezi starým a novým)
Cíl: celá aplikace má nové barvy a písma ještě před výměnou komponent, takže během migrace nebude vypadat napůl.

- [x] `index.css`: přidat tokeny ze sekce 3 (škály + písma + radius + stíny + easing). `--font-sans` na Figtree.
  - Sémantické tokeny (`--primary`, `--secondary`, …) se přidají až ve fázi 3 se shadcn: utility `bg-primary`, `bg-secondary`, `text-foreground` teď generuje HeroUI plugin a `secondary` má v obou knihovnách jiný význam (sekce 3).
  - Pozor: `--radius-xl` (18px) je teď větší než výchozí `rounded-2xl` (16px).
- [x] `hero.ts`: přebarvit podle brand boardu (sekce „Téma pro HeroUI“):
  - `primary` = škála švestky, `DEFAULT: #4A2B5E`, v dark `DEFAULT: #C2A4D6` + `foreground: #1E1A24`
  - `secondary` = škála meruňky, `foreground: #1E1A24`
  - `danger` = malinová škála (`#C9364F`)
  - `background`, `foreground`, `content1–4`, `default` škála do švestkově tónovaných neutrálů
  - `focus: #E26A35`
- [x] Projít použití `bg-secondary` / `text-secondary` (dnes modrá, nově meruňka) – na bílé nesmí být meruňkový text.
- [x] Nadpisy h1–h4 na `font-display`.
- [ ] Kontrola obou režimů na všech stránkách.

### Fáze 3 – Setup shadcn/ui
- [x] Alias `@` → `src`: `resolve.alias` ve `vite.config` + `paths` v `tsconfig.json` (a `jsconfig.json` pro JSX soubory).
- [x] `components.json` napsaný ručně (`"tsx": false`, styl new-york), `init` se nespouštěl, aby nepřepsal tokeny. Pozor: CLI `add` vložil `import { cn } from "cn"` a balíček `next-themes`; opraveno na `@/lib/utils` a náš `ThemeContext`. Po dalším `shadcn add` zkontrolovat importy.
- [x] ~~`npx shadcn@latest init`~~ – Vite, Tailwind v4, CSS proměnné. Projekt je většinou JSX, takže `"tsx": false` v `components.json` (nebo nové komponenty psát v TSX, rozhodnout jednou a držet).
- [x] Ověřit, že `init` nepřepsal tokeny ze sekce 3 (shadcn generuje vlastní `:root` – nahradit našimi).
- [x] Základní komponenty: `button`, `input`, `label`, `textarea`, `checkbox`, `select`, `dialog`, `alert-dialog`, `dropdown-menu`, `popover`, `tooltip`, `table`, `card`, `badge`, `separator`, `skeleton`, `sheet`, `sidebar`, `sonner`.
- [x] `FormField` (`src/components/FormField.jsx`): **label nad polem** s živým focusem, chyba plynule vyjede, po odeslání s chybou pole zatřese. Ovládací prvek přes `children(controlProps)`.
- [x] Katalog komponent `/dev/components` (`src/pages/ComponentCatalog.jsx`, jen v dev režimu) – při úpravě komponent v `ui/` zkontrolovat tady.
- [x] Doladit varianty v `src/components/ui/*` podle brandu (radius, výšky 40 px, focus ring meruňkový, `active:scale-[0.98]` u tlačítek).
- [x] HeroUI zatím nechat (`HeroUIProvider`, `@plugin`, `@source`). Obě knihovny čtou stejné tokeny.

### Fáze 4 – Kostra aplikace (app shell)
Nejvíc viditelná změna, nezávislá na formulářích.

- [x] Layout: **A – plovoucí okno** (shadcn `Sidebar variant="inset"`): sidebar na tónovaném podkladu `--sidebar`, obsah jako papírové okno se zaoblením. Zvažováno i C (švestkový sidebar) a plochý layout; A vybráno kvůli klidu při celodenní práci a tomu, že švestka zůstává vyhrazená pro hlavní akce.
- [x] `AppSidebar` (`src/components/layout/`): logo, položky podle role (`navigation.js`), aktivní položka = bílá dlaždice (`--sidebar-active`), která mezi položkami klouže (`motion` `layoutId`; meruňková tečka odebrána ve fázi 6b). Dole přepínač organizace (SUPERADMIN), účet, `ThemeSwitcher`, odhlášení.
- [x] Sbalení na lištu ikon (`collapsible="icon"`, tlačítko v hlavičce nebo `Ctrl+B`, stav v cookie `sidebar_state`). Na mobilu se menu otevírá jako sheet.
- [x] `AppHeader`: přepínač menu + drobečková navigace (`getBreadcrumbs` v `navigation.js`), na mobilu logo. Lepkavá hlavička nad obsahem.
- [x] Přechod mezi stránkami: `motion` – obsah je obalený `motion.div` s `key={pathname}`, při každé změně stránky se prolne a vyjede o 8 px (`DURATION.slow`), sidebar stojí. Jen vstup, bez odchodu, aby nová stránka nečekala. Pozor: `viewTransition` z React Routeru s `<BrowserRouter>` nefunguje (jen data router), proto ne View Transitions. Při změně stránky se obsah posune nahoru.
- [x] `Navbar.jsx` a `Footer.jsx` smazány, `ThemeSwitcher` přepsaný na shadcn + Tabler.
- [x] Hledání `Ctrl+K` / `⌘K` (`CommandPalette.jsx`, shadcn `command`): tlačítko „Hledat…“ v hlavičce, klienti a zaměstnanci (staff), organizace (SUPERADMIN, bez klientů), stránky podle role; hledání bez ohledu na diakritiku, data se načtou při prvním otevření.
- [x] `PageHeader` (`src/components/layout/PageHeader.jsx`): nadpis Bricolage + popis + akce vpravo.
- [x] `BackToTopButton.jsx` poslouchá scroll obsahu (`data-scroll-root` v `App.tsx`) i okna, vykresluje se přes portál (obal stránky má transform).

### Fáze 5 – Migrace stránek
Pořadí od nejjednodušší a nejsamostatnější:

1. [x] `Login.jsx`, `Activate.jsx`, `ResetPassword.jsx` – společný `AuthLayout` (karta na švestce s přepínačem motivu v rohu, pozadí = jemná mřížka buněk 44 × 26, kruh asi v každé 50. buňce, nikdy u okraje ani vedle sebe, ke středu mizí, kruhy při načtení naskočí ve vlně; v tmavém režimu hlubší `--brand-panel` a karta s obrysem; zvažováno i rozdělení panel/formulář a „mřížka buněk“ jako levý panel), `PasswordInput`, hook `useTokenValidation`, demo účty klikem vyplní přihlášení. Route guardy a odhlášení převedeny na Sonner a `PageLoader`.
2. [x] `Account.jsx` – karty Profil / Přihlašovací údaje (úprava na místě) / Heslo, skeleton při načítání
3. [x] `Home.jsx` – redesign nástěnky: pozdrav + „Zapsat úkon“, 3 dlaždice s minigrafem a minulým měsícem, „Individuální plány“ (štítky po termínu / za X dní) a „Klienti bez záznamu 14+ dní“, graf vývoje za 12 měsíců, nedávné záznamy, vytížení pečovatelů (koordinátor), střediska s příjmem (admin). SUPERADMIN má vlastní „Přehled aplikace“ jen se souhrnnými čísly (organizace, účty podle rolí, pozvánky, úkony napříč aplikací) – žádné údaje o klientech. Backend: `DashboardService` rozšířen (dnešní úkony, klienti bez záznamu, vytížení, příjem středisek, přehled pro SUPERADMINa); opravena chyba, kdy admin viděl plány jen svého střediska.
4. [x] `Organizations.jsx`, `Departments.jsx`, `Tasks.jsx` – tabulka + `ListToolbar` (hledání, stav, počet), detail v `RecordSheet` s úpravou na místě (`?detail=ID`), vytvoření v dialogu, (de)aktivace přes `ConfirmDialog`. Společné: `useListFilters`, `useDetailParam`, `useRecordForm`, `Combobox`, `StatusBadge`. Opraveno: úprava organizace mazala bankovní účet (nově se dá zadat), výběr vedoucího nabízel zaměstnance všech organizací a bez jmen, hledání úkonů nefungovalo.
5. [x] `Employees.jsx` hotovo (filtr středisek `MultiSelectFilter` + `useMultiSelectParam`, stav účtu v tabulce, detail se zařazením a účtem, znovu poslání aktivace), `Clients.jsx` hotovo (filtry středisek a pečovatelů, stav účtu, dialogy ukončení smlouvy a účtu klienta; klik vede na stránku detailu)
6. [x] `PerformedTasks.jsx` – tabulka (datum s řazením, množství a cena `tabular-nums`, pečovatelé), filtry měsíc / středisko / pečovatel v URL (`useMonthParam`, `useMultiSelectParam` s ID, hledání přes `useTextParam`), počet a součet ceny nad tabulkou. Detail v `PerformedTaskSheet` (`?detail=ID`, dlaždice množství a ceny, klient s odkazem, pečovatelé, poznámka, úprava na místě), zápis v `PerformedTaskCreateSheet` (`?openCreate=true` z nástěnky), smazání přes `ConfirmDialog`, stvrzenka v `ReceiptDialog`. Nové `MultiCombobox` a `MonthYearPicker` na shadcn (šipky na předchozí/další měsíc, `value` místo `defaultValue`). Smazány `PerformedTaskCreateModal`, `GenerateReceiptModal`, `FiltersModal`. `PerformedTaskDetailModal` + `PerformedTaskForm` zůstávají jen pro `MonthlyReport` (krok 7).
7. [x] `ClientDetail.jsx` a `ClientCreate.jsx` hotovo (stránka s kartami Osobní údaje / Adresa a kontakt / Poznámky / Péče / Úkony / Ukončení smlouvy, úprava na místě přes sdílené `ClientFields` + `clientForm.js`, posun na první chybu po odeslání, `ClientAvatar`, `ClientPhotoInput`, mapa v `ClientMapDialog`; smazány `ClientForm` a `MapModal`). `IndividualPlan.jsx` hotovo (sekce plánu jako karty s ikonami, vpravo Platnost se štítkem termínu a souhrn klienta, výběr verze + pruh „starší verze“, nová verze ve formuláři s datem plánované aktualizace, prázdný stav, denní záznamy jako karty, `DailyRecordDialog`, smazání přes `ConfirmDialog`; smazány `ImageUpload`, `DailyRecord*Modal`, `DeleteConfirmationModal`). `MonthlyReport.jsx` hotovo (pohled klienta: dlaždice Úkony / K úhradě s QR platbou v dialogu, tabulka seskupená po dnech přes sdílené `DayRow` + `dayGroups.js`, detail v `PerformedTaskSheet` jen pro čtení s `linkClient={false}`; smazány `PerformedTaskForm`, `PerformedTaskDetailModal`, `ReadOnlyField`)
8. [x] Sdílené: `components/forms/*`, `components/modals/*`, `MonthYearPicker.jsx`, `ImageUpload.jsx`, `ReadOnlyField.jsx`, `MyToast.jsx`

Každou stránku dokončit podle checklistu v sekci 6.

### Fáze 6 – Odstranění HeroUI
- [x] `grep -r "@heroui" src` vrací nic.
- [x] Odebrat `lucide-react` (`grep -r lucide-react src` nic nevrací), v `components.json` přepnout `iconLibrary` a po každém `shadcn add` převést ikony na Tabler.
- [x] Odebrat `@heroui/react`, `@heroui/toast`, `@heroui/use-theme`, `framer-motion` (pokud ho nic jiného nepoužívá; `motion` zůstává).
- [x] `index.css`: smazat `@plugin "./hero.ts"`, `@source ../../node_modules/@heroui…`, workaroundy pro toasty. Smazat `hero.ts`, `table.css` (pokud už nic nepoužívá).
- [x] `providers.tsx`: odstranit `HeroUIProvider`.
- [x] `npm run build` a porovnat velikost bundlu s velikostí před migrací.
- [x] Po odstranění HeroUI chyběla barva textu na `body` (dával ji HeroUI plugin) – sheety, dialogy a menu v portálu měly v tmavém režimu černý text. `body` má teď `bg-background text-foreground` v `index.css`.

### Fáze 6b – Doladění UI podle poznámek
Poznámky a otázky z procházení aplikace po migraci. Každá jako jeden bod, odškrtnout po vyřešení.
- [x] Sidebar: odebrána meruňková tečka u aktivní položky – působila jako stav/notifikace, aktivní položku už značí dlaždice.
- [x] Sidebar: větší položky – výška 44 px (dřív 40), text 16 px (dřív 14), sbalený sidebar 60 px, aby položky zůstaly čtvercové.
- [x] Sidebar: ve sbaleném stavu ikony, avatar i logo přesně na středu. Odsazení je v obou stavech stejné (ikony 13 px, avatar a logo 7 px), jinak ikony při animaci sbalení poskočí – nepoužívat `justify-center` ani jiné přepínání odsazení podle `collapsible=icon`.
- [x] Sidebar: sbalený – stejná mezera vlevo i vpravo od ikon (16 px, mezera `sidebar-gap` u varianty inset užší o 6 px).
- [x] Sidebar: wordmark v logu o něco větší (výška 18 px místo 16 px vedle 32px symbolu).
- [x] Sheet zaměstnance: avatar u jména, pod jménem role · středisko a štítek Admin (horní lišta jen typ záznamu a „Neaktivní“; sekce Zařazení zrušena – duplicita), dlaždice „Klíčový pracovník“ (počet aktivních klientů) a „Tento měsíc“ (úkony + čas u klientů), seznam klientů s odkazy (prvních 5, pak „Všichni klienti“ → filtr na stránce Klienti), účet se štítkem nad hodnotou. Data z existujících endpointů (`useEmployeeOverview`). `RecordSheet` má prop `avatar` a sdílené `SheetSummaryTile` a `SheetPerson` (dřív zvlášť v sheetu úkonu a provedeného úkonu).
- [x] Sheet úkonu z katalogu: dvojité setkání jako sekce „Setkání s klientem“ s ikonou (jeden / dva lidé), názvem a vysvětlením místo šedé věty pod dlaždicemi.
- [x] Tabulka úkonů: sloupec „Setkání“ s ikonou a textem „Dvojité“ / „Jedno“ (tlumeně) místo štítku „Ano“ a pomlčky; cena přesunuta na konec řádku (před ⋯), aby se pravě zarovnaná cena nelepila na další sloupec.
- [x] Ikony v sidebaru: Nástěnka `IconLayoutDashboard`, Klienti `IconHeartHandshake`, Zaměstnanci `IconIdBadge2` (dřív `IconUsers` / `IconUser` – skoro k nerozeznání), Úkony `IconListDetails` (dřív skoro stejné jako Provedené úkony), Měsíční přehled `IconCalendarStats`. Stejné ikony pro klienty a zaměstnance v hledání Ctrl+K.
- [x] Provedené úkony: filtr „Den“ vedle měsíce (`DayFilter`) – kalendář zvoleného měsíce, vybrat jde jen den se záznamy, šipky skáčou mezi dny se záznamy, křížek vrátí celý měsíc; den v URL (`?day=2026-10-15`), změna měsíce ho vynuluje. Stránka má 50 řádků místo 25 (říjen: 28 stránek místo 55). Fokus po otevření kalendáře: vybraný den; bez výběru při otevření klávesnicí první povolený den (šipky fungují), při kliknutí myší samotný kalendář bez kroužku (kroužek na 1. dni vypadal jako výběr), Tab pak vede do dnů.
- [x] Provedené úkony: řazení podle sloupce „Datum“ (dřív „Čas“) obrací celé pořadí – dny i časy chronologicky. Dřív zůstávaly dny vždy sestupně a šipka řadila jen časy uvnitř dne; s filtrem „Den“ už to není potřeba a vzestupné pořadí slouží ke kontrole měsíce od začátku.

### Fáze 6c – Profilové fotky (klienti i zaměstnanci)
Rozhodnuto 2026-11-09. Fotka zůstává v databázi (`bytea`), ale zmenšená a s cache.

- [x] Bezpečnost: endpointy fotek kontrolují přístup ke klientovi (dnes jen role – pečovatel jiné organizace mohl fotku stáhnout, přepsat i smazat podle ID).
- [x] Schéma: obecná tabulka `picture` (`data` 512 px, `thumbnail` 128 px, `content_type`, `uploaded_at`, `size`), cizí klíč `client.picture_id` a `employee.picture_id` (vlastnící strana, `LAZY` – seznam klientů nenačítá bloby). Nová fotka = nový řádek, `picture_id` slouží jako verze do URL.
- [x] Server: dekódovat, srovnat otočení podle EXIF, oříznout na čtverec, uložit 512 px + 128 px jako JPEG q85 bez metadat. Limit 5 MB a 30 Mpx (kontrola rozměrů před dekódováním kvůli paměti). Čtení WebP přes TwelveMonkeys. Starší fotky se převedou při prvním načtení.
- [x] Prohlížeč: fotku před nahráním zmenší přes `canvas` na max 1600 px JPEG, takže jde vybrat i velká fotka z mobilu. Neznámý formát (HEIC v Chrome) = srozumitelná hláška.
- [x] Zobrazení: `<img src="/api/clients/{id}/picture?size=thumb&v={pictureId}">` s `Cache-Control: private, max-age=31536000, immutable`, bez `fetchImage` a blob URL. Fotky v tabulce klientů.
- [x] Zaměstnanci: fotka v tabulce, detailu a formuláři; vlastní fotka v Můj účet a v sidebaru.
- WebP jako výstup zamítnut: Java ho neumí zapsat bez nativních knihoven, úspora u avatarů ~1 kB.
- Ověřeno přes API (curl): náhled 128 px / 3 kB, detail 512 px / 28 kB (původní 35 kB), cache hlavička, převod staré fotky, 403 pro pečovatele z jiného střediska i pro mazání pečovatelem, 400 pro neplatný soubor, nové `pictureId` po nahrání, stará fotka smazána. Frontend (nahrání v prohlížeči, fotky v tabulkách) ověřit ručně.
- Sdílené: `lib/pictures.js` (`pictureUrl`, `shrinkPhoto`, `savePicture`, `DELETE_PICTURE`), `PersonAvatar` (fotka nebo iniciály, i v `SheetPerson`), `PhotoInput` (dřív `ClientPhotoInput`). Endpointy `/api/clients/{id}/picture`, `/api/employees/{id}/picture` (čtení všichni zaměstnanci, zápis od koordinátora výš), `/api/user/me/picture` (vlastní fotka). `auth-status` vrací `pictureId`.

### Fáze 7 – Doladění
- [x] Prázdné stavy s motivem symbolu: `EmptyState` (prázdné buňky – tři přerušované čtverce a tlumený meruňkový kruh, nadpis, popis, akce) a `TableEmptyRow` pro tabulky. Ve všech seznamech (hledání bez výsledku s „Zrušit hledání“, prázdný seznam s akcí pro vytvoření, nevybraná organizace) a v individuálním plánu. Nahrazeny čtyři kopie `MessageRow`.
- [x] Nástěnka podle pohledu, ne podle role uživatele: přepínač „Organizace · Středisko · Moje práce“ vedle pozdravu (ikona + text, pod 640 px jen ikony s tooltipem a `aria-label`; ikony jako v sidebaru – Organizace `IconBuildingCommunity`, Středisko `IconBuilding`, Moje práce `IconUser`) (admin všechny tři, koordinátor Středisko a Moje práce, pečovatel jen Moje práce – přepínač skrytý). Výchozí pohled podle role zaměstnance (vedoucí → Organizace, koordinátor → Středisko, pečovatel → Moje práce), takže admin-pečovatel začíná na své práci. Volba v URL (`?view=mine`) a v `localStorage`. Během načítání je přepínač vidět neaktivní s pohledy odhadnutými podle role, aby po načtení nic neposkočilo. Backend: `GET /api/dashboard?view=` (`DashboardView`), nepovolený pohled spadne na výchozí; DTO vrací `view` a `availableViews`.
- [x] Skeletony: všechny stránky je mají (tabulky, nástěnka, detail klienta, plán, účet, sheety se spinnerem). Šest kopií `LoadingRows` nahradil `TableLoadingRows` – skeleton dostane stejné třídy sloupců jako hlavička, takže na úzké tabulce skryje stejné sloupce (dřív kreslil všechny a během načítání přetékal).
- [x] Přístupnost:
  - Kontrast tokenů změřen v obou režimech: vše ≥ 4,5:1 kromě `highlight` na kartě ve světlém režimu (3,31:1), použitý jen jako hvězdička povinného pole (`aria-hidden`, povinnost hlásí `aria-required`; jako grafický prvek stačí 3:1).
  - Klikací řádky tabulek (`TableRow` s `onClick`) otevírají detail Enterem / mezerníkem a mají viditelný fokus. Tabulka je jedna zastávka Tabu (roving tabindex v `Table`): Tab vstoupí na naposledy aktivní řádek a další Tab tabulku opustí, ↑ ↓ Home End mezi řádky, → na ⋯ řádku, ← zpět. Dřív šel detail klávesnicí otevřít jen přes menu ⋯ (pečovatel u klientů ani klient v měsíčním přehledu ho nemají) a krátce i Tabem přes každý řádek a jeho ⋯ (100 zastávek na stránku Provedených úkonů).
  - `RecordSheet` po zavření vrací fokus na řádek, ze kterého se otevřel (dřív skončil na `body`).
  - Odkaz „Přeskočit na obsah“ jako první prvek po Tabu.
  - Ikonová tlačítka mají `aria-label`, pole bez viditelného popisku (hledání) taky.
  - Segmentové ovladače (měsíc, den): fokusový kroužek nese celý ovladač zvenku kolem zaoblených rohů jako ostatní pole, fokusovaný segment je jen podbarvený (`lib/segmented.js`); dřív byl kroužek uvnitř segmentu přes rohy skupiny.
- [x] Responzivita: změřeno na 360 / 768 / 1024 / 1280 px – stránky nepřetékají. Tabulky skrývají sloupce podle své šířky (container queries: obal tabulky je `@container/table`, sloupce `@max-xl/table:hidden` (<576 px), `@max-3xl/table:hidden` (<768 px), `@max-4xl/table:hidden` (<896 px)), ne podle okna – s rozbaleným sidebarem na 768–1024 px dřív přetékaly až o 236 px. Hlavní sloupec (jméno) se zkracuje (`w-full max-w-0`), na mobilu tak zůstane vidět stav a menu ⋯.
- [x] Hlavička na mobilu (<640 px): vnořené stránky místo drobečků ukazují odkaz zpět na nadřazenou stránku („‹ Klienti“ na detailu klienta, „‹ Detail klienta“ v plánu); stránky první úrovně dál jen svůj název. Od 640 px celé drobečky.
- [x] Rozdělení bundlu: stránky za přihlášením přes `React.lazy` (vlastní chunky), mapový dialog až po kliknutí na „Na mapě“. Hlavní JS 2 252 → 610 kB; maplibre (923 kB) a recharts (nástěnka, 372 kB) mimo první načtení.
- [ ] Lighthouse (výkon, přístupnost) na Login a PerformedTasks.
  - Login, mobil (2026-11-09): výkon 99, přístupnost 98, best practices 100. Opraveno: přihlašovací stránky bez `<main>` (`AuthLayout`); mřížka na pozadí jako jeden SVG `<pattern>` místo 1 126 obdélníků (DOM 1 204 → 84 prvků, nejdelší úloha 181 ms). Bezpečnostní hlavičky zapsané v sekci 7b.
- [ ] Nové screenshoty do README.

---

## 5. Mapa komponent HeroUI → nová řešení

Počty = výskyty importů v `src` (stav říjen 2026, 55 souborů).

| HeroUI | Počet | Náhrada | Poznámka |
| --- | --- | --- | --- |
| `Button` | 45 | shadcn `button` | Varianty: `default` (švestka), `secondary` (levandule), `outline`, `ghost`, `destructive`, `link`. `isLoading` → `disabled` + spinner ikona. `onPress` → `onClick`. |
| `Modal`, `ModalContent/Header/Body/Footer` | 24 | shadcn `sheet` / `dialog` / `alert-dialog` | Podle sekce 2.6: `*DetailModal` a `PerformedTaskCreateModal` → `sheet` s úpravou uvnitř, ostatní `*CreateModal` a `GenerateReceiptModal` → `dialog`, `DeleteConfirmationModal` a `*TerminateModal` → `alert-dialog`. |
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

- [ ] Žádný import z `@heroui/*` ani `lucide-react` (ikony z `@tabler/icons-react`).
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
| ~~Horní navbar, nebo sidebar?~~ | **Rozhodnuto: sidebar, varianta A (plovoucí okno)** – viz fáze 4. |
| Formuláře: nativní `<form>`, nebo react-hook-form + zod? | react-hook-form + zod: shadcn `form` na ně počítá, validace bude na jednom místě a sdílená mezi formuláři. |
| ~~Nové komponenty v JSX, nebo TSX?~~ | **Rozhodnuto: JSX** (`components.json` → `"tsx": false`). |
| ~~Datumy: react-day-picker, nebo React Aria?~~ | **Rozhodnuto:** shadcn `calendar` (= react-day-picker s českou lokalizací, týden od pondělí) v `DatePicker.jsx` (popover s tlačítkem, hodnoty jako ISO `2026-11-08`, převody v `lib/dates.js`). |
| ~~Labely ve formulářích: plovoucí, nebo nad polem?~~ | **Rozhodnuto: nad polem s živým focusem** (obě varianty vyzkoušené, plovoucí smazaná). |
| Ochranná známka / doména | Před veřejným spuštěním ověřit „CareTracker“ v databázích ÚPV a EUIPO. |

---

## 7b. Před produkčním nasazením

Mimo rebranding, ale vyplynulo z Lighthouse (2026-11-09). Nastavit na serveru, který servíruje frontend (`frontend/nginx.demo.conf`, případně produkční nginx), a pro API v Spring Security (`SecurityConfig` → `http.headers(...)`).

- [ ] `Content-Security-Policy`: `default-src 'self'`; `connect-src` s adresou API; `font-src` a `style-src` pro Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`); `img-src 'self' data: blob:` + dlaždice Mapy.com (`api.mapy.com`); `frame-ancestors 'none'`. Otestovat přihlášení, mapu, fotky a PDF stvrzenky.
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains` (až běží HTTPS; začít s nižším `max-age`).
- [ ] `X-Frame-Options: DENY` (pro starší prohlížeče vedle `frame-ancestors`).
- [ ] `Cross-Origin-Opener-Policy: same-origin`.
- [ ] `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] Zvážit Trusted Types (`require-trusted-types-for 'script'`) – jen pokud nic nepoužívá `innerHTML` (pozor na `LogoControl` v `ClientMapDialog`).
- [ ] Source mapy do produkčního buildu nedávat veřejně (Lighthouse je hlásí jako chybějící – to je v pořádku).

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
| 2026-11-08 | Fáze 1 hotová: favicony, PWA ikony (+ maskable), Google Fonts (Bricolage + Figtree), `CareTrackerLogo` jako inline SVG (malý řez přes prop `small`), loga v README, e-maily přebarvené s PNG logem (`email-logo.png` z frontendu), PDF s Figtree a švestkovou linkou. `--font-sans` už je Figtree. Staré `ct_icon*`, `logo_*` a Nunito smazány. |
| 2026-11-08 | Rozhodnuto: detaily záznamů jako sheet se stavem v URL a úpravou uvnitř (klient a plán zůstávají stránky), vrstvy animací (CSS / tw-animate-css / motion / View Transitions). Nové sekce 2.6 a „Co čím animovat“. |
| 2026-11-08 | Fáze 2 (bez vizuální kontroly): `hero.ts` přebarvené (švestka / meruňka / malinová, neutrály tónované do švestky, focus meruňkový, radius 8/10/14), škály `plum-*` a `apricot-*`, `font-display`, stíny a easing v `@theme`, nadpisy Bricolage. Tlačítka „Záznamy péče“ na Home z `secondary` na `primary` + `flat`. |
| 2026-11-08 | Fáze 3: alias `@`, shadcn komponenty v JSX naladěné na brand (výška 40 px, `active:scale`, bílé inputy, dialog `rounded-xl`, sheet 300/200 ms), sémantické tokeny + `tw-animate-css` v `index.css`, HeroUI `secondary` sjednocené na levanduli, meruňkové akcenty na Home/Login přes `highlight`. Provider: `MotionConfig reducedMotion="user"`, `TooltipProvider`, sonner `Toaster`. `FormField` se dvěma variantami na `/dev/form-field`. Oprava `theme-color` v `ThemeContext`. |
| 2026-11-08 | Vybrán label nad polem, plovoucí varianta smazána. Zkušební stránka přejmenována na katalog komponent `/dev/components`. Fáze 3 hotová. |
| 2026-11-08 | Úpravy komponent podle katalogu: animovaný checkbox (kreslená fajfka, 20 px), výraznější hover (`--primary-hover`, `--secondary-hover`, `--destructive-hover`, silnější `--accent`), tmavý `--secondary` `#3B2D4A`, outline v tmavém režimu průhledný. Pohybové tokeny sjednocené: `duration-fast/base/slow` (150/200/300 ms) v CSS i `src/lib/motion.js`, všechny `ui/` komponenty přepnuté na ně. |
| 2026-11-08 | Schválen vzor detailu záznamu (sheet: hlavička s akcemi, souhrnné dlaždice, sekce, úprava na místě) – sekce 2.6. Nadpisy h1–h4 přesunuty do `@layer base`, aby je šlo přebít třídami. |
| 2026-11-08 | Měkké stavové štítky: `Badge` varianty `success` (schváleno, aktivní), `pending` (čeká – meruňka), `warning`, `danger` (ukončený) + tokeny `--*-soft` / `--*-soft-foreground` (kontrast ≥ 4,7 : 1 v obou režimech). Plný `destructive` jen výjimečně. |
| 2026-11-08 | Toasty: zaoblení `--radius-lg`, šířka 400 px, větší text, ikony v kroužcích stavových barev; vlastní `toast` z `@/components/ui/sonner` přidává ikonu i výchozímu toastu. Ikony: vybrán **Tabler** místo Lucide, `ui/` komponenty a katalog převedeny. |
| 2026-11-08 | Fáze 4: nová kostra (sidebar A – plovoucí okno, sbalitelný na ikony, klouzající aktivní položka, drobečková navigace, motion přechod mezi stránkami), tokeny `--sidebar-*` + `--sidebar-active`. Nástěnka v plánu jako samostatný redesign. |
| 2026-11-08 | Fáze 5, krok 1: přihlášení, aktivace účtu a reset hesla na nových komponentách (`AuthLayout`, `PasswordInput`, `useTokenValidation`), token `--brand-panel`. `ProtectedRoute`, `PublicOnlyRoute` a odhlášení v `AuthContext` na Sonner. |
| 2026-11-08 | Wordmark: vedle symbolu vždy `CareTrackerWordmark` (křivky z oficiálního loga, `caretracker` malými písmeny, výška ≈ 0,6 a mezera ≈ 0,4 viditelné výšky symbolu) – sidebar, přihlašovací karta. V běžném textu dál „CareTracker“. |
| 2026-11-08 | Fáze 5, krok 2: `Account.jsx`, `PageHeader`. `MyToast.showToast` a `showErrorToast` jsou teď tenký obal nad Sonnerem (barva → typ toastu, ikony ignoruje), HeroUI `ToastProvider` a CSS obezličky pro toasty odstraněny. Karta (`ui/card`) na `rounded-lg`, nadpis karty v Bricolage. |
| 2026-11-08 | Fáze 5, krok 3: nová nástěnka pro všechny role včetně SUPERADMINa, rozšířený backend nástěnky (nová DTO `ClientAttentionDTO`, `CaregiverWorkloadDTO`, `PlatformOverviewDTO`, `OrganizationOverviewDTO`). |
| 2026-11-08 | Nástěnka: odhad na konec měsíce (tempo za uplynulé pracovní dny × pracovní dny v měsíci, svátky se nepočítají) v dlaždicích a grafech – rozpracovaný měsíc je přerušovaná čára k odhadu místo propadu. Dlaždice úkonů s historií i pro koordinátora/admina. Mock data: `make seed-activity` / `clear-activity` / `demo-seed-activity`, `make up` a `make clean` je spouští automaticky. |
| 2026-11-08 | Otevřené body: migrace V22 (hodinové úkony z V18/V19 převedeny z hodin na minuty), generátor drží termíny individuálních plánů kolem dneška, součty nástěnky přesunuty do SQL (nástěnka 0,1–0,3 s místo až 1 s), hledání `Ctrl+K`. |
| 2026-11-08 | Fáze 5, krok 4: Organizace, Střediska, Úkony na nových komponentách se sheetem detailu; staré modaly a formuláře smazány. |
| 2026-11-08 | Fáze 5: Zaměstnanci na nových komponentách (filtr středisek, stav účtu, detail v sheetu); paleta hledání otevírá detail zaměstnance. |
| 2026-11-08 | Fáze 5: seznam Klientů (filtry středisek a pečovatelů v URL přes ID, stav účtu, ukončení smlouvy s datem a důvodem, účet klienta), nepoužívaný `ClientCreateModal` smazán. |
| 2026-11-08 | `DatePicker` (shadcn calendar) místo nativního data: měsíc a rok přes vlastní `Select` s plnými názvy a fade okrajů (`scroll-fade`), neaktivní šipky bez hoveru, `table.css` už nezvýrazňuje týdny kalendáře. Ikona „Otevřít detail“: panel vpravo (`IconLayoutSidebarRightExpand`) u sheetů, šipka u Klientů (vede na stránku). Položky menu a selectů a trigger selectu mají plynulý hover. |
| 2026-11-08 | Fáze 5, krok 6: Provedené úkony na nových komponentách (sheet detailu i zápisu, datum + čas zvlášť, množství s čárkou, náhled ceny, nabídka úkonů podle plánu klienta s přepínačem na celý katalog). Bez vizuální kontroly v prohlížeči. |
| 2026-11-08 | Provedené úkony po kontrole v prohlížeči: `MonthYearPicker` jako kompaktní skupina `‹ měsíc ›` v jednom rámečku, tabulka vykresluje po 100 řádcích (měsíc má až ~6000 záznamů, řazení trvalo 3–4 s), řádky v `React.memo`, řazení v `useTransition` se ztlumením tabulky. `useSearchParamsUpdater`: filtry v URL se přepisovaly navzájem (týkalo se i Klientů, Zaměstnanců, Úkonů). Klient bez úkonů v plánu dostane nabídku celého katalogu. |
| 2026-11-08 | Tabulky: nižší výchozí řádek (`TableCell` `py-2.5`, tlačítko akcí `size="icon-row"` 32 px). Provedené úkony: datum a čas na jednom řádku bez roku, stránkování po 25 (`TablePagination` v `components/data/`, přilepené ke spodku okna, stránka v URL přes `usePageParam`, při změně filtru/hledání/řazení zpět na 1) místo „Zobrazit další“. `MonthYearPicker` po otevření zaměří vybraný měsíc. |
| 2026-11-08 | Stránkování po 25 ve všech seznamech (Organizace, Střediska, Úkony, Zaměstnanci, Klienti, Provedené úkony) přes `usePagedList` (výřez stránky, stránka v URL, `withPageReset` pro filtry, `resetKey` při změně organizace, `tableRef` pro posun na začátek tabulky). Lišta se skryje, když se vše vejde na jednu stránku. |
| 2026-11-08 | `TimePicker` místo nativního `type="time"`: 24h pole, které jde psát (`1430`, `9.15`, `9` → `09:00`, parsování v `lib/dates.js` + testy) i vybrat z popoveru (hodiny 0–23, minuty po 5). Stvrzenka (PDF): nové rozvržení, české formáty čísel, sazba a počet záznamů, údaje k platbě vedle QR. Detail záznamu: dlaždice bez doplňkových řádků. |
| 2026-11-08 | Akce v detailu záznamu přesunuty do patičky sheetu (vlevo „⋯“, vpravo „Upravit“) centrálně v `RecordSheet` (`onEdit`, `moreActions`), platí pro Organizace, Střediska, Úkony, Zaměstnance i Provedené úkony. |
| 2026-11-08 | Stvrzenky: název souboru s klientem (`stvrzenka-marie-novakova-2026-11.pdf`), nový režim „Celé středisko“ – jedno PDF se stvrzenkami všech klientů střediska s úkony v měsíci, klient na stránku, podle příjmení (`GET /api/performed-tasks/receipts`, `ReceiptService.generateDepartmentReceipts`, QR kódy se stahují paralelně: 69 klientů za ~1,6 s). Sheet detailu: horní lišta 60 px s čarou přes celou šířku, sazba jako podtitulek pod názvem úkonu (`RecordSheet` prop `subtitle`). |
| 2026-11-08 | Provedené úkony: tabulka seskupená po dnech (řádek dne „Pátek 6. listopadu“ s počtem záznamů a denním součtem ve sloupci Cena, součty za celý den i přes stránky), v řádku jen čas, úkon a množství v jedné buňce, cena vpravo. Na mobilu úkon pod jménem klienta. Tabulky mají na úzkých displejích menší vodorovné odsazení buněk (`max-sm:px-2`), takže se vejdou bez scrollu. |
| 2026-11-08 | Výběr času převzat z `michroucka/time-picker` (`components/ui/time-picker.jsx`, převedeno z TSX, ikony Tabler) místo vlastní mřížky. Nové propy v obou repech: `fullWidth`, `iconPosition`. Kolečko myši posouvá kolo vždy o jednu položku (sčítání `deltaY` s prahem, plynulá animace), varianta s klikacími sloupci pro PC zkoušena a zamítnuta. Nový prop `loop`: nekonečné kolo (00 → 23, 55 → 00), hodnoty v lichém počtu kopií (aspoň 120 řádků, minuty 11 kopií), z krajní kopie skok do prostřední už během posunu, po doběhnutí dorovnání na střed řádku. Nový prop `commitDelay`: hodnota z kola se po klidu sama zapíše (popover zůstává otevřený, psaní se nezapisuje). Ve formuláři krok 5 min, `loop`, `commitDelay={700}`. Výběr více pečovatelů: počet v poli a jména jako odebíratelné štítky pod ním. |
| 2026-11-09 | Fáze 5, krok 7: detail a založení klienta na nových komponentách. Detail jako stránka (avatar, stav, středisko a pečovatel v hlavičce; akce Individuální plán / Upravit / ⋯ ukončit nebo aktivovat), formulář po kartách se sticky patičkou. Telefon a PSČ se při načtení do formuláře naformátují (seed data bez mezer neprošla validací). Nejstarší datum narození 1900 (dřív `MIN_YEAR` 1970). |
| 2026-11-09 | Fáze 5, krok 7: `IndividualPlan` na nových komponentách. `planStatus` přesunut z nástěnky do `individualPlan/planForm.js`. Opraveno: u denních záznamů se nezobrazoval autor (`createdBy.fullName`), bez plánu se stránka nevrací zpět s toastem, ale ukáže prázdný stav. |
| 2026-11-09 | Fáze 5, krok 7 hotový: `MonthlyReport` na nových komponentách, ověřeno jako klient (QR platba, detail úkonu). Řádky dnů z Provedených úkonů vytažené do `performedTasks/DayRow.jsx` a `dayGroups.js`. |
| 2026-11-09 | Krok 8 a fáze 6 hotové: hooky volají `toast` ze Sonneru přímo (`MyToast` smazán), HeroUI, Lucide, `framer-motion`, `@react-aria/i18n` a `@internationalized/date` odinstalovány, `hero.ts` a `table.css` smazány, `iconLibrary` v `components.json` na Tabler. Bundle: CSS 369 → 170 kB, JS 2 264 → 2 252 kB (JS tvoří hlavně maplibre a recharts). |
