-- 0013_uppdragsbank_bockovningar.sql
-- Bockövningar till uppdragsbanken (godkända exempelmallar).
-- Kör efter 0012_uppdragsbank.sql och kräver minst en godkänd lärare.
-- Skriptet är idempotent: en mall med samma titel läggs inte in igen.

do $$
declare v_org uuid; v_profile uuid; v_payload jsonb;
begin
  select p.org_id, p.id into v_org, v_profile from public.profiles p where p.status='approved' order by p.created_at limit 1;
  if v_org is null then raise notice 'Ingen godkänd lärare finns – bockövningarna hoppas över.'; return; end if;

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Bocka 90° med bockfjäder – koppar 15 mm",
    "description": "Bocka ett 15 mm kopparrör 90° med bockfjäder. Öva bockmått, bockradie och kontroll av bockvinkel och ovalitet.\n\nMoment:\n1. Mät upp bockmåttet från röränden och märk bockpunkten med märkpenna.\n2. Kontrollera att bockfjädern är hel och av rätt dimension för 15 mm rör.\n3. För in bockfjädern så att den täcker hela bockzonen.\n4. Bocka långsamt och jämnt mot vinkelhaken tills röret är 90°.\n5. Dra ut bockfjädern utan att vrida röret.\n6. Kapa röret till rätt längd, skäva insida och utsida och kontrollera att röret är fritt från grader.\n7. Kontrollera bockvinkel, bockradie och ovalitet. Dokumentera resultatet i egenkontrollen.\n\nYrkesspråk: bockfjäder, bockmått, bockradie, bockvinkel, ovalitet, veckbildning, sträckning, skäva\n\nSäkerhet:\n- Vassa rörändar – använd handskar.\n- Bockfjädern kan slinta – håll röret stadigt.\n- Använd skyddsglasögon vid kapning och skävning.\n- Spänn fast röret om det behövs.\n\nVanliga fel:\n- Bockfjädern är för kort eller för liten, så röret veckar sig.\n- Bocken blir för snäv och röret blir ovalt.\n- Röret bockas för kallt eller för hårt, så det spricker.\n- Bockmåttet mäts från fel punkt, så längden blir fel.\n- Röret skävas inte efter kapning.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-90-koppar-15.png",
    "goal": "Mäta och märka ut bockmått före bockning. Välja rätt bockfjäder för rördiameter och bockradie. Bocka ett 15 mm kopparrör 90° utan veck eller skador. Kontrollera bockvinkel, bockradie och ovalitet med vinkelhake och skjutmått. Skäva rörändarna och kontrollera att röret är fritt från grader.",
    "self_check_items": [
      "Bockvinkeln är 90° ±2°.",
      "Bockradien är jämn och utan veck.",
      "Ovaliteten är mindre än 10 % av rördiametern.",
      "Röret är skävt och fritt från grader.",
      "Inga sprickor eller sträckningar i bocken."
    ],
    "reflection_questions": [
      "Hur påverkar bockradien flödet i röret?",
      "Varför är det viktigt att skäva röret efter kapning?",
      "Vad händer med röret om bockfjädern är för kort?",
      "Hur kontrollerar du att bocken är godkänd?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Klämringskoppling rak",
      "dimension": "15 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 2
    },
    {
      "component": "Fiberpackning",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 3
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Bockvinkeln är 90° ±2°.",
      "sort_order": 0
    },
    {
      "label": "Bockradien är jämn och utan veck.",
      "sort_order": 1
    },
    {
      "label": "Ovaliteten är mindre än 10 % av rördiametern.",
      "sort_order": 2
    },
    {
      "label": "Röret är skävt och fritt från grader.",
      "sort_order": 3
    },
    {
      "label": "Inga sprickor eller sträckningar i bocken.",
      "sort_order": 4
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Bocka 90° med bockfjäder – koppar 15 mm', 'Bocka ett 15 mm kopparrör 90° med bockfjäder. Öva bockmått, bockradie och kontroll av bockvinkel och ovalitet.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Bocka 90° med bockfjäder – koppar 15 mm');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Bocka 45° och kontrollera bockvinkel",
    "description": "Bocka ett 15 mm kopparrör 45° med bockfjäder och kontrollera vinkeln mot en vinkelmall.\n\nMoment:\n1. Mät upp bockmåttet och märk bockpunkten.\n2. För in bockfjädern i bockzonen.\n3. Bocka långsamt till 45° och kontrollera mot vinkelmallen.\n4. Dra ut bockfjädern och kontrollera ovaliteten.\n5. Kapa och skäva röret.\n\nYrkesspråk: bockvinkel, bockmått, bockradie, ovalitet, vinkelmall, skäva\n\nSäkerhet:\n- Handskar vid vassa rörändar.\n- Skyddsglasögon vid kapning.\n\nVanliga fel:\n- Bocken blir för stor eller för liten.\n- Bockfjädern är för kort.\n- Röret vrids under bockningen.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-45-koppar-15.png",
    "goal": "Mäta och märka ut bockmått. Bocka 45° med bockfjäder utan veck. Kontrollera bockvinkel och ovalitet. Skäva rörändarna.",
    "self_check_items": [
      "Bockvinkeln är 45° ±2°.",
      "Bockradien är jämn.",
      "Ingen veckbildning på insidan.",
      "Ovaliteten är mindre än 10 %."
    ],
    "reflection_questions": [
      "Varför används 45° ofta i trånga utrymmen?",
      "Hur påverkar en felaktig bockvinkel nästa anslutning?",
      "Vad gör du om bocken blir för stor?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Bockvinkeln är 45° ±2°.",
      "sort_order": 0
    },
    {
      "label": "Bockradien är jämn.",
      "sort_order": 1
    },
    {
      "label": "Ingen veckbildning på insidan.",
      "sort_order": 2
    },
    {
      "label": "Ovaliteten är mindre än 10 %.",
      "sort_order": 3
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Bocka 45° och kontrollera bockvinkel', 'Bocka ett 15 mm kopparrör 45° med bockfjäder och kontrollera vinkeln mot en vinkelmall.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Bocka 45° och kontrollera bockvinkel');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Parallellförskjutning (offset) – två 45°-bockar",
    "description": "Tänk dig att röret går rakt fram. Du vill inte svänga av – du vill bara flytta röret lite åt sidan eller uppåt och sedan fortsätta rakt. Det gör du med två lika stora bockar åt motsatt håll: först 45° uppåt, sedan 45° tillbaka. Resultatet blir en förskjutning – röret fortsätter i samma riktning men på en ny nivå.\n\nOrden: offset = hur mycket röret förskjuts. Bockvinkel = hur mycket du böjer i varje bock (här 45°). Bockmått = avståndet mellan de två bockpunkterna. Parallellitet = de två raka delarna är parallella.\n\nRäkneexempel: vill du flytta röret 50 mm med 45°-bockar blir avståndet mellan bockarna 50 × 1,41 ≈ 70 mm. Vill du flytta 100 mm blir det 100 × 1,41 ≈ 141 mm. Kontrollera alltid mot din bockverktygs anvisning – måtten kan skilja mellan fabrikat.\n\nSå gör du: mät offset vinkelrätt, räkna ut bockmåttet, märk båda bockpunkterna, bocka första 45°, vänd röret, bocka andra 45° åt motsatt håll och kontrollera att de raka delarna är parallella.\n\nEn offset används när röret ska fortsätta rakt men hamna på en annan nivå eller i sidled. Du gör två motriktade 45°-bockar. Här får du förklaringen steg för steg.\n\nMoment:\n1. Bestäm offsetmåttet: hur mycket ska röret flyttas? Mät vinkelrätt mellan den gamla och den nya centrumlinjen.\n2. Välj bockvinkel, till exempel 45°.\n3. Räkna ut bockmåttet: offset × 1,41 vid 45°.\n4. Märk första bockpunkten och andra bockpunkten med bockmåttet mellan.\n5. Bocka första 45°-bocken.\n6. Vänd röret och bocka andra 45°-bocken åt motsatt håll, i samma plan.\n7. Kontrollera offsetmått, parallellitet och att bockarna ligger i samma plan.\n8. Skäva rörändarna och dokumentera resultatet.\n\nYrkesspråk: offset, förskjutning, bockmått, bockvinkel, parallellitet, motriktad bock, centrumlinje\n\nSäkerhet:\n- Spänn fast röret vid bockning.\n- Handskar och skyddsglasögon.\n\nVanliga fel:\n- Man bockar åt samma håll i stället för motsatt.\n- Man mäter offset snett i stället för vinkelrätt.\n- Man glömmer att vända röret mellan bockarna.\n- Bockarna hamnar i olika plan.\n- Fel bockmått eftersom faktorn inte används.\n\nKälla: Faktorn 1,41 för 45° är samma princip som i S-bock-övningen (RörmokarLäraren). Kontrollera mot din bockverktygstillverkares anvisning.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-offset-45.png",
    "goal": "Kunna förklara vad en offset är och varför den används. Mäta offset vinkelrätt mellan den gamla och nya centrumlinjen. Räkna ut bockmåttet med faktor 1,41 vid 45°. Bocka två motriktade 45°-bockar i samma plan. Kontrollera offsetmått, parallellitet och bockplan.",
    "self_check_items": [
      "Offsetmåttet stämmer med ritningen ±2 mm.",
      "Båda bockvinklarna är 45° ±2°.",
      "De raka delarna är parallella.",
      "Bockarna ligger i samma plan.",
      "Inga veck eller ovalitet."
    ],
    "reflection_questions": [
      "Varför ska bockarna vara motriktade?",
      "Vad händer om du använder 30° i stället för 45°?",
      "Hur påverkar offsetmåttet bockmåttet?",
      "Varför är det viktigt att bockarna ligger i samma plan?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Offsetmåttet stämmer med ritningen ±2 mm.",
      "sort_order": 0
    },
    {
      "label": "Båda bockvinklarna är 45° ±2°.",
      "sort_order": 1
    },
    {
      "label": "De raka delarna är parallella.",
      "sort_order": 2
    },
    {
      "label": "Bockarna ligger i samma plan.",
      "sort_order": 3
    },
    {
      "label": "Inga veck eller ovalitet.",
      "sort_order": 4
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Parallellförskjutning (offset) – två 45°-bockar', 'En offset används när röret ska fortsätta rakt men hamna på en annan nivå eller i sidled. Du gör två motriktade 45°-bockar. Här får du förklaringen steg för steg.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Parallellförskjutning (offset) – två 45°-bockar');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Dubbelbock/U-bock efter mått",
    "description": "Bocka en U-form med två 90°-bockar. Kontrollera cc-mått, höjd och att benen blir parallella.\n\nMoment:\n1. Mät upp cc-måttet och märk båda bockpunkterna.\n2. Bocka första 90°-bocken.\n3. Bocka andra 90°-bocken i samma plan.\n4. Kontrollera cc-mått, höjd och parallellitet.\n5. Skäva rörändarna och kontrollera bockarna.\n\nYrkesspråk: dubbelbock, cc-mått, bockmått, parallellitet, bockplan\n\nSäkerhet:\n- Spänn fast röret.\n- Handskar och skyddsglasögon.\n\nVanliga fel:\n- Benen hamnar inte i samma plan.\n- Cc-måttet blir fel.\n- Andra bocken vrids.\n- Bockarna blir för snäva.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-dubbel-90.png",
    "goal": "Mäta upp cc-mått och höjd. Bocka två 90°-bockar i samma plan. Kontrollera cc-mått, höjd och parallellitet. Skäva och dokumentera resultatet.",
    "self_check_items": [
      "Cc-måttet stämmer ±2 mm.",
      "Höjden stämmer ±2 mm.",
      "Båda bockvinklarna är 90° ±2°.",
      "Benen är parallella och utan veck."
    ],
    "reflection_questions": [
      "Varför är det viktigt att båda bockarna ligger i samma plan?",
      "Hur kontrollerar du cc-måttet efter bockning?",
      "Vad händer om den andra bocken blir för snäv?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Cc-måttet stämmer ±2 mm.",
      "sort_order": 0
    },
    {
      "label": "Höjden stämmer ±2 mm.",
      "sort_order": 1
    },
    {
      "label": "Båda bockvinklarna är 90° ±2°.",
      "sort_order": 2
    },
    {
      "label": "Benen är parallella och utan veck.",
      "sort_order": 3
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Dubbelbock/U-bock efter mått', 'Bocka en U-form med två 90°-bockar. Kontrollera cc-mått, höjd och att benen blir parallella.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Dubbelbock/U-bock efter mått');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Bocka efter ritning och mall",
    "description": "Läs en enkel rörritning, måttsätt och bocka röret efter mall. Kontrollera mått, vinklar och toleranser mot ritningen.\n\nMoment:\n1. Läs ritningen och markera byggmått och centrumlinjer.\n2. Bestäm bockpunkter och bockmått.\n3. Märk röret och bocka i rätt ordning.\n4. Kontrollera röret mot mallen.\n5. Justera vid behov och dokumentera resultatet.\n\nYrkesspråk: byggmått, centrumlinje, bockpunkt, mall, måttsättning, tolerans\n\nSäkerhet:\n- Handskar och skyddsglasögon.\n- Spänn fast röret vid bockning.\n\nVanliga fel:\n- Fel mått avläses från ritningen.\n- Bockarna tas i fel ordning.\n- Bockmåttet tappas bort.\n- Röret vrids mellan bockarna.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-efter-ritning.png",
    "goal": "Läsa byggmått och centrumlinjer på en rörritning. Mäta ut bockpunkter och bockmått. Bocka i rätt ordning efter mall. Kontrollera mått, vinklar och toleranser.",
    "self_check_items": [
      "Måtten stämmer med ritningen ±2 mm.",
      "Vinklarna stämmer ±2°.",
      "Bockarna ligger i rätt plan.",
      "Röret följer mallen utan veck."
    ],
    "reflection_questions": [
      "Varför är det bättre att bocka efter mall än att gissa?",
      "Vilket mått är viktigast att kontrollera först?",
      "Hur gör du om en bock blir fel mitt i serien?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Ritning/mall",
      "dimension": "",
      "quantity": 1,
      "note": "",
      "sort_order": 2
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Måtten stämmer med ritningen ±2 mm.",
      "sort_order": 0
    },
    {
      "label": "Vinklarna stämmer ±2°.",
      "sort_order": 1
    },
    {
      "label": "Bockarna ligger i rätt plan.",
      "sort_order": 2
    },
    {
      "label": "Röret följer mallen utan veck.",
      "sort_order": 3
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Bocka efter ritning och mall', 'Läs en enkel rörritning, måttsätt och bocka röret efter mall. Kontrollera mått, vinklar och toleranser mot ritningen.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Bocka efter ritning och mall');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Bocka tunnväggigt kopparrör utan veck",
    "description": "Bocka ett tunnväggigt kopparrör med stor bockradie utan veck och med kontrollerad ovalitet.\n\nMoment:\n1. Kontrollera rörtyp och väggtjocklek.\n2. Välj rätt bockfjäder och kontrollera att den är hel.\n3. Mjukglödga röret om det behövs och låt det svalna kontrollerat.\n4. Bocka långsamt med stor bockradie.\n5. Kontrollera ovalitet, veck och sträckning.\n6. Skäva rörändarna.\n\nYrkesspråk: tunnväggigt rör, mjukglödgning, bockradie, ovalitet, sträckning, veckbildning\n\nSäkerhet:\n- Varmt rör efter glödgning – använd handskar.\n- Skyddsglasögon.\n- Brandrisk vid värmekälla.\n\nVanliga fel:\n- För snäv bock.\n- För kort bockfjäder.\n- Röret bockas för kallt.\n- Röret är för hårt och spricker.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-tunnvaggig.png",
    "goal": "Välja rätt bockfjäder för tunnväggigt rör. Mjukglödga röret vid behov. Bocka med stor bockradie utan veck. Kontrollera ovalitet och sträckning.",
    "self_check_items": [
      "Ovaliteten är mindre än 10 %.",
      "Inga veck på insidan.",
      "Jämn bockradie.",
      "Inga sprickor eller sträckningar.",
      "Rätt bockvinkel."
    ],
    "reflection_questions": [
      "Varför är tunnväggigt rör känsligare för veck?",
      "När behöver röret mjukglödgas?",
      "Hur påverkar bockradien hållfastheten?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Tunnväggigt kopparrör",
      "dimension": "15 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Ovaliteten är mindre än 10 %.",
      "sort_order": 0
    },
    {
      "label": "Inga veck på insidan.",
      "sort_order": 1
    },
    {
      "label": "Jämn bockradie.",
      "sort_order": 2
    },
    {
      "label": "Inga sprickor eller sträckningar.",
      "sort_order": 3
    },
    {
      "label": "Rätt bockvinkel.",
      "sort_order": 4
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Bocka tunnväggigt kopparrör utan veck', 'Bocka ett tunnväggigt kopparrör med stor bockradie utan veck och med kontrollerad ovalitet.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Bocka tunnväggigt kopparrör utan veck');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Bocka PEX 16 mm med bockfjäder",
    "description": "Bocka PEX 16 mm med bockfjäder för PEX. Kontrollera minsta bockradie och att röret inte knäcks.\n\nMoment:\n1. Mät upp och märk bockpunkten.\n2. För in bockfjädern för PEX i röret.\n3. Bocka långsamt och kontrollera bockradien.\n4. Dra ut bockfjädern och kontrollera att röret inte är knäckt.\n5. Montera stödhylsa och presskoppling enligt tillverkarens anvisning.\n\nYrkesspråk: PEX, bockfjäder för PEX, minsta bockradie, stödhylsa, presskoppling, knäck\n\nSäkerhet:\n- Handskar och skyddsglasögon.\n- Använd rätt pressverktyg.\n\nVanliga fel:\n- För snäv bock utan bockfjäder.\n- Fel bockfjäder för PEX.\n- Stödhylsa saknas.\n- Presskopplingen är inte pressad.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-pex-16.png",
    "goal": "Känna till PEX-bockfjäder och minsta bockradie. Bocka PEX utan att röret knäcks. Kontrollera att röret är runt efter bockning. Montera stödhylsa och presskoppling.",
    "self_check_items": [
      "Minsta bockradie enligt tillverkaren är uppfylld.",
      "Röret är inte knäckt eller tillplattat.",
      "Stödhylsan sitter rätt.",
      "Presskopplingen är pressad med rätt verktyg."
    ],
    "reflection_questions": [
      "Varför får PEX inte bockas för snävt?",
      "Vad händer om stödhylsan saknas?",
      "Hur kontrollerar du att presskopplingen är klar?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "PEX-rör",
      "dimension": "16 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Presskoppling",
      "dimension": "16 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Stödhylsa",
      "dimension": "16 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 2
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Minsta bockradie enligt tillverkaren är uppfylld.",
      "sort_order": 0
    },
    {
      "label": "Röret är inte knäckt eller tillplattat.",
      "sort_order": 1
    },
    {
      "label": "Stödhylsan sitter rätt.",
      "sort_order": 2
    },
    {
      "label": "Presskopplingen är pressad med rätt verktyg.",
      "sort_order": 3
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Bocka PEX 16 mm med bockfjäder', 'Bocka PEX 16 mm med bockfjäder för PEX. Kontrollera minsta bockradie och att röret inte knäcks.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Bocka PEX 16 mm med bockfjäder');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Bocka och anslut – täthetsprovning",
    "description": "Bocka 90°, anslut med klämringskopplingar och täthetsprova installationen. Koppla ihop bockning med egenkontroll och provtryck.\n\nMoment:\n1. Bocka 90° enligt bockmåttet.\n2. Kapa och skäva rörändarna.\n3. Montera klämringskopplingarna och dra åt enligt anvisning.\n4. Fyll systemet med vatten och lufta.\n5. Höj trycket försiktigt till 0,6 MPa och kontrollera alla fogar.\n6. Dokumentera provtryck, tid och resultat i egenkontrollen.\n\nYrkesspråk: klämringskoppling, åtdragningsmoment, täthetsprovning, provtryck, manometer, egenkontroll\n\nSäkerhet:\n- Skyddsglasögon och handskar.\n- Tryckprovning med vatten – inte luft.\n- Överskrid inte komponenternas märktryck.\n\nVanliga fel:\n- Kopplingen är inte åtdragen.\n- Röret är inte skävt.\n- För högt provtryck.\n- Luftning är glömd.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-anslut-tathet.png",
    "goal": "Bocka ett 15 mm kopparrör 90°. Montera klämringskopplingar på rätt sätt. Täthetsprova installationen med vatten. Dokumentera provtryck och resultat.",
    "self_check_items": [
      "Bockvinkeln är 90° ±2°.",
      "Kopplingarna är åtdragna och tätar.",
      "Inga läckor vid 0,6 MPa.",
      "Provtrycket är dokumenterat."
    ],
    "reflection_questions": [
      "Varför täthetsprovar man innan röret byggs in?",
      "Vad gör du om en fog läcker vid provtryck?",
      "Varför är det viktigt att dokumentera provtrycket?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Klämringskoppling rak",
      "dimension": "15 mm",
      "quantity": 4,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 2
    },
    {
      "component": "Fiberpackning",
      "dimension": "1/2\"",
      "quantity": 4,
      "note": "",
      "sort_order": 3
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Bockvinkeln är 90° ±2°.",
      "sort_order": 0
    },
    {
      "label": "Kopplingarna är åtdragna och tätar.",
      "sort_order": 1
    },
    {
      "label": "Inga läckor vid 0,6 MPa.",
      "sort_order": 2
    },
    {
      "label": "Provtrycket är dokumenterat.",
      "sort_order": 3
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Bocka och anslut – täthetsprovning', 'Bocka 90°, anslut med klämringskopplingar och täthetsprova installationen. Koppla ihop bockning med egenkontroll och provtryck.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Bocka och anslut – täthetsprovning');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Bocka i serie – L-, U- och Z-bock med insida som måttreferens",
    "description": "Bocka två eller flera 90°-bockar i serie (L-, U- eller Z-bock) och mät från rörets insida i stället för centrum. Kompensera med halva ytterdiametern och kontrollera cc-måttet.\n\nMoment:\n1. Mät cc-måttet mellan bockarna enligt ritning, till exempel 200 mm.\n2. Välj referens: mät från rörets insida i stället för från centrumlinjen.\n3. Beräkna kompensationen: halva ytterdiametern (7,5 mm för 15 mm rör, 6 mm för 12 mm rör).\n4. Märk röret på rätt plats och kontrollera markeringen mot bockverktygets X-markering.\n5. Bocka första 90°-bocken och kontrollera bockvinkeln.\n6. Bocka nästa bock i serien (L-, U- eller Z-bock) med samma referens och kompensation.\n7. Kontrollera cc-mått, bockvinklar, parallellitet och att bockarna ligger i samma plan.\n8. Dokumentera mått och resultat i egenkontrollen.\n\nYrkesspråk: cc-mått, centrumlinje, insida, ytterdiameter, kompensation, bocknyckel, X-markering, L-bock, U-bock, Z-bock, seriebockning\n\nSäkerhet:\n- Handskar vid vassa rörändar.\n- Skyddsglasögon vid kapning och skävning.\n- Spänn fast röret vid bockning.\n\nVanliga fel:\n- Mäter från centrum men använder bockverktygets X-markering – eller tvärtom.\n- Glömmer kompensationen på halva ytterdiametern.\n- Fel cc-mått mellan bockarna.\n- Bockarna hamnar i olika plan.\n- Markeringen hamnar på fel sida av röret.\n\nKälla: Tekniken är hämtad från RörmokarLäraren (Anders Pargell), ”En annan variant på nästa bock”. Kontrollera alltid mot din bockverktystillverkares anvisning – markeringarna kan skilja mellan fabrikat.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-serie-insida.png",
    "goal": "Förstå skillnaden mellan att mäta från centrum och från rörets insida. Beräkna kompensationen: halva ytterdiametern (7,5 mm för 15 mm rör, 6 mm för 12 mm rör). Använda bockverktygets X-markering på rätt sätt. Bocka L-, U- eller Z-bock i serie med rätt cc-mått. Kontrollera cc-mått, bockvinklar, parallellitet och att bockarna ligger i samma plan.",
    "self_check_items": [
      "Cc-måttet stämmer med ritningen ±2 mm.",
      "Båda bockvinklarna är 90° ±2°.",
      "Kompensationen är rätt: halva ytterdiametern.",
      "Bockarna ligger i samma plan.",
      "Inga veck eller ovalitet i bockarna."
    ],
    "reflection_questions": [
      "Varför blir det fel om du mäter från centrum men markerar enligt insidan?",
      "Hur påverkar rördiametern kompensationen?",
      "När är det bättre att mäta från centrum?",
      "Varför är det viktigt att bockarna ligger i samma plan?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Ritning/mall",
      "dimension": "",
      "quantity": 1,
      "note": "",
      "sort_order": 2
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Cc-måttet stämmer med ritningen ±2 mm.",
      "sort_order": 0
    },
    {
      "label": "Båda bockvinklarna är 90° ±2°.",
      "sort_order": 1
    },
    {
      "label": "Kompensationen är rätt: halva ytterdiametern.",
      "sort_order": 2
    },
    {
      "label": "Bockarna ligger i samma plan.",
      "sort_order": 3
    },
    {
      "label": "Inga veck eller ovalitet i bockarna.",
      "sort_order": 4
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Bocka i serie – L-, U- och Z-bock med insida som måttreferens', 'Bocka två eller flera 90°-bockar i serie (L-, U- eller Z-bock) och mät från rörets insida i stället för centrum. Kompensera med halva ytterdiametern och kontrollera cc-måttet.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Bocka i serie – L-, U- och Z-bock med insida som måttreferens');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Svanbock – dubbel motriktad bock i samma plan",
    "description": "Bocka en svanbock med 60° och 30°. Bocka 60°-bocken först och 30°-bocken sedan – ordningen är viktig.\n\nMoment:\n1. Läs ritningen och bestäm svanbockens mått.\n2. Märk ut båda bockpunkterna och kontrollera att de ligger i samma plan.\n3. Bocka 60°-bocken först.\n4. Vänd röret och bocka 30°-bocken sedan – 60° ska alltid komma först.\n5. Kontrollera mått, bockvinklar och att bockarna ligger i samma plan.\n6. Kontrollera ovalitet och veck i båda bockarna.\n7. Skäva rörändarna och dokumentera resultatet.\n\nYrkesspråk: svanbock, motriktad bock, offset, höjd, cc-mått, bockplan, parallellitet, bockvinkel, ovalitet\n\nSäkerhet:\n- Handskar vid vassa rörändar.\n- Skyddsglasögon vid kapning och skävning.\n- Spänn fast röret vid bockning.\n\nVanliga fel:\n- Bockarna hamnar i olika plan.\n- Fel offset eller höjd.\n- Man bockar 30° först – då blir måttet fel; 60° ska komma först.\n- Andra bocken bockas åt fel håll.\n- Röret vrids mellan bockarna.\n- För snäv bock så att röret veckar sig.\n\nKälla: RörmokarLäraren, ”Svan och s bock” – traditionell svanbock: 60° först, sedan 30°.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-svanbock.png",
    "goal": "Förstå vad en svanbock är och när den används. Bocka 60°-bocken först och 30°-bocken sedan. Förstå varför ordningen 60/30 är viktig. Kontrollera mått, bockvinklar och parallellitet. Undvika veck och ovalitet i båda bockarna.",
    "self_check_items": [
      "Offset och höjd stämmer med ritningen ±2 mm.",
      "Båda bockvinklarna stämmer ±2°.",
      "Bockarna ligger i samma plan.",
      "Röret är parallellt och utan veck.",
      "Ovaliteten är mindre än 10 %."
    ],
    "reflection_questions": [
      "När används en svanbock i stället för två separata bockar?",
      "Varför måste bockarna ligga i samma plan?",
      "Hur påverkar offset och höjd varandra?",
      "Vad gör du om andra bocken blir felvänd?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Ritning/mall",
      "dimension": "",
      "quantity": 1,
      "note": "",
      "sort_order": 2
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Offset och höjd stämmer med ritningen ±2 mm.",
      "sort_order": 0
    },
    {
      "label": "Båda bockvinklarna stämmer ±2°.",
      "sort_order": 1
    },
    {
      "label": "Bockarna ligger i samma plan.",
      "sort_order": 2
    },
    {
      "label": "Röret är parallellt och utan veck.",
      "sort_order": 3
    },
    {
      "label": "Ovaliteten är mindre än 10 %.",
      "sort_order": 4
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Svanbock – dubbel motriktad bock i samma plan', 'Bocka en svanbock med 60° och 30°. Bocka 60°-bocken först och 30°-bocken sedan – ordningen är viktig.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Svanbock – dubbel motriktad bock i samma plan');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – S-bock – två lika stora bockar med beräknat avstånd",
    "description": "En S-bock är två lika stora bockar. För tighta S-bockar lägger du bockarna så nära varandra som möjligt. Enligt RörmokarLäraren ger två 45°-bockar cirka 60 mm cc på 15 mm rör och cirka 50 mm cc på 12 mm rör. Vill du ha ett större S finns en praktisk formel: 15 mm rör → markavstånd = 110 + X; 12 mm rör → 90 + X. X är det S-mått du vill ha. Exempel: 15 mm rör och S = 80 mm → 110 + 80 = 190 mm. Alla bocknycklar slår olika – kontrollera din egen.\n\nBocka en S-bock med två lika stora bockar. Tighta 45°-S-bockar ger ca 60 mm cc på 15 mm rör och ca 50 mm cc på 12 mm rör. Större S: 15 mm → 110 + X, 12 mm → 90 + X.\n\nMoment:\n1. Bestäm S-måttet och bockvinkeln, till exempel 45°.\n2. Beräkna avståndet mellan markeringarna: S-mått × faktor. 30° → ×2, 45° → ×1,41, 15° → ×3,7.\n3. Tight S-bock: lägg bockarna så nära varandra som möjligt (15 mm ≈ 60 mm cc, 12 mm ≈ 50 mm cc).\n4. Större S-bock: 15 mm rör → markavstånd = 110 + X; 12 mm rör → 90 + X.\n5. Sätt ett startstreck vid bockverktygets referens (0 på 0). Startstrecket kan ligga var som helst, men måste vara känt.\n6. Mät upp avståndet från startstrecket och gör ett bockstreck runt hela röret.\n7. Bocka första bocken till vald vinkel.\n8. Vänd röret, lägg bockstrecket mot referensen (0 på 0) och bocka andra bocken till samma vinkel.\n9. Kontrollera S-måttet, bockvinklarna och att bockarna ligger i samma plan.\n10. Dokumentera beräkning och resultat i egenkontrollen.\n\nYrkesspråk: S-bock, startstreck, bockstreck, faktor, S-mått, bockvinkel, bockplan, Z-bock, tight S-bock, 110 + X, 90 + X\n\nSäkerhet:\n- Handskar vid vassa rörändar.\n- Skyddsglasögon vid kapning och skävning.\n- Spänn fast röret vid bockning.\n\nVanliga fel:\n- Fel faktor används för vald bockvinkel.\n- Bockstrecket görs inte runt hela röret.\n- Startstreck och bockstreck blandas ihop.\n- Bockarna får olika gradantal.\n- Bockarna hamnar i olika plan.\n- Man använder 110 + X på fel rördiameter eller fel bocknyckel.\n\nKälla: RörmokarLäraren, ”S-bockar 2.0” – tighta S-bockar och formlerna 110 + X / 90 + X. Kontrollera mot din bocknyckel.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-s-bock.png",
    "goal": "Förstå vad en S-bock är och varför den inte får vara 90°. Beräkna avståndet mellan startstreck och bockstreck med rätt faktor. Bocka två lika stora bockar i samma plan. Kontrollera S-mått, bockvinklar och parallellitet. Dokumentera beräkning och resultat.",
    "self_check_items": [
      "S-måttet stämmer ±2 mm.",
      "Båda bockvinklarna är lika och stämmer ±2°.",
      "Bockarna ligger i samma plan.",
      "Inga veck eller ovalitet.",
      "Tight S-bock enligt bocknyckelns märken.",
      "Beräkningen är dokumenterad."
    ],
    "reflection_questions": [
      "Varför blir det en Z-bock om vinkeln är 90°?",
      "Varför fungerar faktorn på alla rördiametrar?",
      "Hur påverkar bockvinkeln S-måttet?",
      "Varför måste bockstrecket gå runt hela röret?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Ritning/mall",
      "dimension": "",
      "quantity": 1,
      "note": "",
      "sort_order": 2
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "S-måttet stämmer ±2 mm.",
      "sort_order": 0
    },
    {
      "label": "Båda bockvinklarna är lika och stämmer ±2°.",
      "sort_order": 1
    },
    {
      "label": "Bockarna ligger i samma plan.",
      "sort_order": 2
    },
    {
      "label": "Inga veck eller ovalitet.",
      "sort_order": 3
    },
    {
      "label": "Tight S-bock enligt bocknyckelns märken.",
      "sort_order": 4
    },
    {
      "label": "Beräkningen är dokumenterad.",
      "sort_order": 5
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – S-bock – två lika stora bockar med beräknat avstånd', 'Bocka en S-bock med två lika stora bockar. Tighta 45°-S-bockar ger ca 60 mm cc på 15 mm rör och ca 50 mm cc på 12 mm rör. Större S: 15 mm → 110 + X, 12 mm → 90 + X.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – S-bock – två lika stora bockar med beräknat avstånd');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Svanbock – alternativ 30/30/60-teknik",
    "description": "Det här är den alternativa 30/30/60-tekniken. Den traditionella svanbocken är 60° först, sedan 30° – ordningen är viktig.\n\nBocka en svanbock med 30°, 30° och 60° enligt den alternativa tekniken. Kontrollera att avståndet blir kort och att bockarna ligger i samma plan.\n\nMoment:\n1. Häng ut röret cirka 10 mm från bockverktygets knack/markering.\n2. Bocka första bocken till 30°.\n3. Vänd röret och ta nästa avlägg så nära som möjligt. Kontrollera att röret är rakt.\n4. Bocka andra bocken till 30°.\n5. Vänd röret och lägg första bocken i bockverktyget. Bocka till 60° (strecket efter 45°).\n6. Kontrollera svanbockens mått, vinklar och att bockarna ligger i samma plan.\n7. Dokumentera resultatet.\n\nYrkesspråk: svanbock, 30/30/60, bocknyckel, knack, avlägg, bockplan, bockvinkel\n\nSäkerhet:\n- Handskar vid vassa rörändar.\n- Skyddsglasögon vid kapning och skävning.\n- Spänn fast röret vid bockning.\n\nVanliga fel:\n- För långt avstånd mellan bockarna.\n- Fel vinkel på första eller andra bocken.\n- Röret vrids mellan bockarna.\n- Bockarna hamnar i olika plan.\n\nKälla: RörmokarLäraren, ”Svan och s bock”. Tekniken är hämtad från ett engelskt klipp och används med Fromax bocknyckel nr 55 – kontrollera mot din egen bockverktygsanvisning.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-svanbock-alt.png",
    "goal": "Bocka en svanbock med 30/30/60-teknik. Få ett kort avstånd mellan bockarna. Kontrollera bockvinklar och bockplan. Jämföra tekniken med den traditionella svanbocken.",
    "self_check_items": [
      "Bockarna är 30°, 30° och 60° enligt tekniken.",
      "Avståndet mellan bockarna är kort och jämnt.",
      "Bockarna ligger i samma plan.",
      "Inga veck eller ovalitet."
    ],
    "reflection_questions": [
      "Varför blir avståndet kortare med 30/30/60-tekniken?",
      "Vad är skillnaden mot den traditionella svanbocken?",
      "Varför måste bockarna ligga i samma plan?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Ritning/mall",
      "dimension": "",
      "quantity": 1,
      "note": "",
      "sort_order": 2
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Bockarna är 30°, 30° och 60° enligt tekniken.",
      "sort_order": 0
    },
    {
      "label": "Avståndet mellan bockarna är kort och jämnt.",
      "sort_order": 1
    },
    {
      "label": "Bockarna ligger i samma plan.",
      "sort_order": 2
    },
    {
      "label": "Inga veck eller ovalitet.",
      "sort_order": 3
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Svanbock – alternativ 30/30/60-teknik', 'Bocka en svanbock med 30°, 30° och 60° enligt den alternativa tekniken. Kontrollera att avståndet blir kort och att bockarna ligger i samma plan.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Svanbock – alternativ 30/30/60-teknik');

  v_payload := $json$
{
  "assignment": {
    "title": "Bockövning – Bocktavlan – flera bockar efter ritning",
    "description": "En bocktavla är en övningsplatta där du gör flera bockar efter en ritning. Du tränar bockordning, måttkedja och montage. Tänk igenom i vilken ordning bockarna ska göras – annars kan röret bli för kort eller hamna i fel plan.\n\nRitningen är 900 × 600 mm och visar båda rören. 15 mm-röret har bockpunkterna Start (100, 100), B1 (300, 100), B2 (300, 350), B3 (550, 350), B4 (550, 150), B5 (800, 150), B6 (800, 450). 12 mm-röret har samma X-värden men ligger 40 mm (4 cc) under – vid 6 cc drar du av 60 mm i stället. Klammer: K1–K6 för båda rören enligt tabellen; använd 4 eller 6 klammor per rör enligt skolans rutin.\n\nMäter du från insidan kompenserar du med 6 mm för 12 mm rör och 7,5 mm för 15 mm rör.\n\nMontera en rörslinga med flera bockar på en bocktavla. Följ ritningen, håll cc-mått och bockplan och kontrollera hela slingan.\n\nMoment:\n1. Läs ritningen och märk ut alla bockpunkter och cc-mått.\n2. Mät upp bockpunkterna enligt tabellen och kontrollera cc-måtten.\n3. Bestäm om 12 mm-röret ska ligga 4 cc (40 mm) eller 6 cc (60 mm) under 15 mm-röret.\n4. Bestäm bockordningen – börja med den bock som ligger närmast ena röränden.\n5. Bocka första bocken och kontrollera måttet.\n6. Fortsätt i samma ordning och kontrollera efter varje bock.\n7. Sätt klammorna K1–K6 för båda rören enligt tabellen.\n8. Montera rören på tavlan med rörklammer – 4 eller 6 klammor per rör.\n9. Kontrollera cc-mått, vinklar, parallellitet och att röret sitter stabilt.\n10. Dokumentera bockordning och resultat.\n\nYrkesspråk: bocktavla, bockordning, cc-mått, måttkedja, bockplan, rörklammer, klammerposition, bockpunkt, cc-avstånd, montage\n\nSäkerhet:\n- Handskar och skyddsglasögon.\n- Spänn fast tavlan.\n- Var försiktig med skruvdragaren.\n\nVanliga fel:\n- Fel bockordning så att måtten inte räcker.\n- Måttkedjan räknas fel.\n- Röret vrids mellan bockarna.\n- För hårt åtdragna rörklammer som deformerar röret.\n- Man glömmer att kontrollera efter varje bock.\n\nKälla: RörmokarLäraren, ”Tavlan”. Övningen är skriven som en standardövning för bocktavla.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/bock-tavlan.png",
    "goal": "Läsa en rörritning med flera bockar. Planera bockordningen innan du börjar. Hålla cc-mått och måttkedja genom hela slingan. Montera röret stabilt på bocktavlan. Kontrollera vinklar, parallellitet och bockplan.",
    "self_check_items": [
      "Alla cc-mått stämmer ±2 mm.",
      "Bockvinklarna stämmer ±2°.",
      "Bockarna ligger i samma plan.",
      "Röret sitter stadigt i rörklamren.",
      "Båda rören sitter på rätt cc-mått och rätt avstånd (4 eller 6 cc).",
      "Klammorna deformera inte rören.",
      "Inga veck eller ovalitet."
    ],
    "reflection_questions": [
      "Varför är bockordningen viktig?",
      "Hur undviker du att måttfel adderas?",
      "Varför ska röret sitta i samma plan?",
      "Vad skulle du göra annorlunda nästa gång?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 5,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Klämringskoppling rak",
      "dimension": "15 mm",
      "quantity": 8,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Propp",
      "dimension": "1/2\"",
      "quantity": 4,
      "note": "",
      "sort_order": 2
    },
    {
      "component": "Rörklammer",
      "dimension": "15 mm",
      "quantity": 10,
      "note": "",
      "sort_order": 3
    },
    {
      "component": "Bocktavla/plywood",
      "dimension": "",
      "quantity": 1,
      "note": "",
      "sort_order": 4
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Alla cc-mått stämmer ±2 mm.",
      "sort_order": 0
    },
    {
      "label": "Bockvinklarna stämmer ±2°.",
      "sort_order": 1
    },
    {
      "label": "Bockarna ligger i samma plan.",
      "sort_order": 2
    },
    {
      "label": "Röret sitter stadigt i rörklamren.",
      "sort_order": 3
    },
    {
      "label": "Båda rören sitter på rätt cc-mått och rätt avstånd (4 eller 6 cc).",
      "sort_order": 4
    },
    {
      "label": "Klammorna deformera inte rören.",
      "sort_order": 5
    },
    {
      "label": "Inga veck eller ovalitet.",
      "sort_order": 6
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Bockövning – Bocktavlan – flera bockar efter ritning', 'Montera en rörslinga med flera bockar på en bocktavla. Följ ritningen, håll cc-mått och bockplan och kontrollera hela slingan.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad bockövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Bockövning – Bocktavlan – flera bockar efter ritning');
end $$;
