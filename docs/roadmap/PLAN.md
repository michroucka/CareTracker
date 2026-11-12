# Nové funkce – plán

Živý dokument pro funkce, které chceme přidat. Zatím jen hrubý obrys, jednotlivé části se budou dál upřesňovat (datový model, API, obrazovky).

**Zaměření:** menší terénní pečovatelské služby (jednotky až nízké desítky pečovatelek). Neusilujeme o rozsah velkých systémů pro sociální služby (docházka, stravování, sklady), ale o to, aby každodenní práce terénní služby šla od plánu po vyúčtování bez papíru a Excelu.

---

## 1. Přehled a pořadí

| # | Funkce | Stav | Závisí na |
| --- | --- | --- | --- |
| 1 | Plánování – šablony, generování návštěv, týdenní tabulka, tisk | návrh | – |
| 2 | Plánování – nepřítomnosti a přeřazování | návrh | 1 |
| 3 | Mobilní pohled „Můj den“ a odškrtávání návštěv | návrh | 1 |
| 4 | Záznam z návštěvy | návrh | 3 |
| 5 | Kniha jízd | návrh | 1, 3 |

---

## 2. Plánování práce pečovatelek

**Výchozí situace (pilotní organizace):** rozpis je na papíře na nástěnce, 8–10 pečovatelek, plán se mění často (měnící se potřeby klientů, noví a odcházející klienti, dovolené a nemoci pečovatelek). Řešení proto nemá být minimalistické, musí změny unést.

### 2.1 Šablona péče u klienta
- Opakované návštěvy: den v týdnu, čas, úkony, preferovaná pečovatelka.
- Platnost od–do. Změna potřeb klienta = nová verze šablony, ne přepis staré.
- Vazba na individuální plán (úkony převzít z plánu, verze šablony k verzi plánu).

### 2.2 Konkrétní návštěvy
- Generují se ze šablon na 1–2 týdny dopředu, dál se pracuje s nimi.
- Výjimky: jednorázová změna času nebo pečovatelky, zrušení návštěvy (klient v nemocnici, odhlášená péče).
- Činnosti mimo péči: přejezdy, předávání klíčů, porady, školení.

### 2.3 Nepřítomnost pečovatelky
- Zadání dovolené nebo nemoci.
- Dotčené návštěvy se označí jako nepřiřazené, koordinátorka je přeřadí. Žádná návštěva nesmí propadnout.

### 2.4 Kontroly
- Kolize dvou návštěv v jednom čase.
- Nereálný přejezd mezi návštěvami (adresy a geokódování už máme).
- Přetížení pečovatelky.

### 2.5 Pohledy
- Týdenní tabulka pečovatelky × dny (náhrada nástěnky).
- Denní rozpis pečovatelky.
- Tisk do PDF – přechod z nástěnky nebude ze dne na den.

### 2.6 Plán → skutečnost
- Odškrtnutá naplánovaná návštěva vytvoří `PerformedTask`. Plán tak přímo navazuje na vyúčtování.

---

## 3. Mobilní pohled „Můj den“

- Seznam dnešních návštěv pečovatelky, odškrtnutí úkonů, start a stop času.
- Responzivní web / PWA, ne nativní aplikace.

---

## 4. Záznam z návštěvy

- Krátká poznámka ke každé návštěvě (stav klienta, co se dělo).
- Podklad pro hodnocení individuálního plánu a pro inspekci.
- Později případně diktování (Web Speech API v prohlížeči).

---

## 5. Kniha jízd

**Výchozí situace:** jízdy se dnes zapisují ručně do papírových tabulek.

- Předvyplnění trasy dne z pořadí návštěv, kilometry spočítat z adres klientů (geokódování už máme). Pečovatelka jen potvrdí nebo opraví a doplní stav tachometru.
- Ujasnit: služební auta (kniha jízd pro daňové účely: datum, trasa, účel, km, stav tachometru, tankování) vs. soukromá auta (cestovní náhrady: km × sazba + palivo). Pravidla i výstupy se liší.
- Pozor na úkony s jednotkou `KM` účtované klientovi (dovoz oběda, doprovod k lékaři). Nejsou to provozní jízdy, nesmí se započítat dvakrát.

---

## 6. Zatím neděláme

| Funkce | Proč ne |
| --- | --- |
| NFC štítky a GPS sledování pečovatelek | GDPR, monitorování zaměstnanců, odpor personálu. Pro malou službu nepřiměřené. |
| Stravování, sklady, docházka, biometrie, datové schránky | Směr k velkému systému pro celou organizaci, mimo zaměření. |
| SMS upozornění rodině | Možná později. Alternativa: rozšířit stávající klientský přístup i pro rodinu. |

---

## 7. Před nabízením organizacím

Organizace svěřuje citlivá (i zdravotní) data o klientech, hlavní překážkou je důvěra v dodavatele, ne počet funkcí.

- [ ] Právní forma pro fakturaci (IČO / s.r.o.) a smlouva o poskytování služby.
- [ ] Zpracovatelská smlouva podle GDPR.
- [ ] Hosting, pravidelné zálohy a ověřená obnova dat.
- [ ] Odpověď na „co když dodavatel skončí“: export všech dat, případně zdrojový kód u třetí strany.
- [ ] Pilotní organizace, která zvládne celý měsíc (úkony → vyúčtování) bez Excelu, a reference od ní.

---

## 8. Otevřené otázky

- Služební, nebo soukromá auta (kniha jízd)?
- Na jak dlouho dopředu generovat návštěvy?
- Jak přesně provázat verze šablony péče s verzemi individuálního plánu?
- Kdo smí plán měnit (koordinátor, pečovatelka sama?) a co se má logovat.
