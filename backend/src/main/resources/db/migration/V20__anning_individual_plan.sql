-- Individual plan for client 24 (Gaspard Drysdall, dept 1 Anning) with upcoming update
-- Plan ID 7, two versions; planned_update_date = 2026-05-05 (blížící se)

INSERT INTO individual_plan (id, client_id, organization_id) VALUES
(7, 62, 1),
(8, 79, 1);

INSERT INTO individual_plan_content (id, individual_plan_id, version_number, processed_date, planned_update_date,
    likes, dislikes, strengths, aspirations, life_path, additional_info,
    hygiene, self_care, mobility, diet, home_care, social_contact, activities, health, exercising_rights) VALUES

-- Client 62 – Hollyanne Delia, v1
(13, 7, 1, '2025-05-12', '2025-11-12',
    'Procházky, sledování přírody', 'Studené počasí', 'Veselá, komunikativní', 'Zůstat aktivní co nejdéle',
    'Pracovala jako zahradnice', NULL,
    'Hygiena s dohledem', 'Z větší části soběstačná', 'Samostatně, příležitostně hůlka',
    'Bez omezení', 'Pomoc s těžším úklidem', 'Dcera navštěvuje každý týden',
    'Zahradničení, procházky', 'Dobrý zdravotní stav, mírné problémy s klouby', NULL),

-- Client 62 – Hollyanne Delia, v2 (update due 2026-05-05 – blížící se)
(14, 7, 2, '2025-11-14', '2026-05-05',
    'Procházky, sledování přírody, pletení', 'Studené počasí, samota',
    'Veselá, komunikativní, adaptabilní', 'Zůstat aktivní, poznávat nové lidi',
    'Zahradnice 20 let, vedla komunitní zahradu', 'Přestoupila do skupiny aktivit střediska',
    'Hygiena s dohledem, sprcha každé ráno', 'Z větší části soběstačná',
    'Samostatně po bytě, venku s hůlkou při delších trasách', 'Více vlákniny, omezení soli',
    'Pomoc s těžším úklidem 1× týdně', 'Dcera každý týden, nové přátelství v DPS',
    'Zahradničení, procházky, nové pletení ve skupině', 'Mírné problémy s klouby, nová fyzioterapie', NULL),

-- Client 79 – Jessy Doby, v1
(15, 8, 1, '2025-03-08', '2025-09-08',
    'Vaření, četba detektivek', 'Hluk, rychlé tempo', 'Trpělivý, důsledný', 'Zachovat soběstačnost',
    'Pracoval jako kuchař v závodní jídelně', NULL,
    'Hygiena s minimální dopomocí', 'Soběstačný', 'Pohybuje se samostatně',
    'Diabetická dieta', 'Zvládá sám', 'Starý přítel navštěvuje občas',
    'Vaření, četba', 'Diabetes II. typu, stabilní', NULL),

-- Client 79 – Jessy Doby, v2 (update due 2026-04-28 – velmi blízko)
(16, 8, 2, '2025-09-10', '2026-04-28',
    'Vaření, četba detektivek, křížovky', 'Hluk, rychlé tempo, zima',
    'Trpělivý, důsledný, motivovaný', 'Zachovat soběstačnost, najít nový koníček',
    'Kuchař 28 let', 'Nový zájem o skupinové vaření v DPS',
    'Hygiena s minimální dopomocí, koupel 3× týdně', 'Soběstačný',
    'Pohybuje se samostatně, schody bez problémů', 'Diabetická dieta, pravidelná kontrola glukózy',
    'Zvládá sám, příležitostná pomoc s nákupem', 'Starý přítel a nová skupinka v DPS',
    'Vaření ve skupině, četba, křížovky', 'Diabetes II. typu, stabilní, poslední kontrola v pořádku', NULL);

UPDATE individual_plan SET current_content_id = 14 WHERE id = 7;
UPDATE individual_plan SET current_content_id = 16 WHERE id = 8;

INSERT INTO daily_record (id, date, content, individual_plan_id, created_by_id) VALUES
(16, '2025-11-20', 'Klientka v dobré náladě, zapojila se do skupinového pletení. Hygiena bez problémů.', 7, 5),
(17, '2026-02-05', 'Klientka si pochvalovala fyzioterapii. Chůze se zlepšila. Dcera přinesla sazenice na jaro.', 7, 5),
(18, '2026-01-15', 'Klient vařil polévku pro sousedy v DPS. Skupinové vaření probíhá dobře. Glukóza v normě.', 8, 4),
(19, '2026-03-20', 'Klient se těší na jaro, plánuje výlet. Hygiena v pořádku, soběstačný. Diabetická dieta dodržována.', 8, 4);

SELECT setval('individual_plan_id_seq',        (SELECT MAX(id) FROM individual_plan),        true);
SELECT setval('individual_plan_content_id_seq', (SELECT MAX(id) FROM individual_plan_content), true);
SELECT setval('daily_record_id_seq',            (SELECT MAX(id) FROM daily_record),            true);
