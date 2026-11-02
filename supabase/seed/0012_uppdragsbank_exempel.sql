-- 0012_uppdragsbank_exempel.sql
-- Sju färdiga exempelmallar till uppdragsbanken.
--
-- Kör EFTER 0012_uppdragsbank.sql. Skriptet kräver att det finns minst en
-- godkänd lärare; mallarna ägs av den första godkända läraren och blir
-- godkända direkt, så att alla skolor kan ta ut dem. Det går bra att köra
-- skriptet flera gånger – en mall med samma titel läggs inte in igen.

do $$
declare
  v_org uuid;
  v_profile uuid;
  v_payload jsonb;
begin
  select p.org_id, p.id
    into v_org, v_profile
  from public.profiles p
  where p.status = 'approved'
  order by p.created_at
  limit 1;

  if v_org is null then
    raise notice 'Ingen godkänd lärare finns – exempelmallarna hoppas över.';
    return;
  end if;

  -- -------------------------------------------------------------------
  -- 1. Tappvatten – dolda ledningar och fogar
  -- -------------------------------------------------------------------
  v_payload := $json$
  {
    "assignment": {
      "title": "Tappvatten – dolda ledningar och fogar",
      "description": "Dra en dold tappvattenledning mellan fördelare och blandare. Ledningen ska vara foglös där den är dold, ha serviceöppning vid behov och vara frostskyddad i kallt utrymme.",
      "kind": "uppdrag",
      "reveal_mode": "full",
      "ai_mode": "app_help_only",
      "steps": [],
      "year_level": "GY",
      "course_code": "VVS",
      "skolverket_ref": "",
      "assessment_visible": false,
      "reference_image_path": null,
      "goal": "Kunna dra en dold tappvattenledning enligt Säkervatten 2026:1.",
      "self_check_items": [
        "Dolda ledningar är foglösa där det är möjligt",
        "Fogar är utbytbara och åtkomliga",
        "Serviceöppning finns där fogar är dolda",
        "Avstängningsventil är åtkomlig och märkt",
        "Frostskydd finns i ouppvärmt utrymme"
      ],
      "reflection_questions": [
        "Varför ska dolda ledningar vara foglösa?",
        "Var placerade du serviceöppningen och varför?",
        "Vad gör du annorlunda nästa gång?",
        "Vad lärde du dig om frostskydd?"
      ],
      "rule_refs": ["tappvatten-fogar", "tappvatten-service", "tappvatten-avstangning", "tappvatten-frys"]
    },
    "material_requirements": [
      {"component": "Tappvattenrör", "dimension": "15", "quantity": 1, "note": "PEX eller koppar enligt anvisning", "sort_order": 0},
      {"component": "Koppling", "dimension": "15", "quantity": 4, "note": "", "sort_order": 1},
      {"component": "Avstängningsventil", "dimension": "15", "quantity": 1, "note": "", "sort_order": 2},
      {"component": "Isolering", "dimension": "15", "quantity": 1, "note": "För kallt utrymme", "sort_order": 3},
      {"component": "Rörklammer", "dimension": "15", "quantity": 8, "note": "", "sort_order": 4},
      {"component": "Serviceöppning", "dimension": "", "quantity": 1, "note": "", "sort_order": 5}
    ],
    "quiz_questions": [],
    "assessment_criteria": [
      {"label": "Dragning och fogar följer Säkervatten 2026:1", "sort_order": 0},
      {"label": "Serviceöppning och avstängning är åtkomliga", "sort_order": 1},
      {"label": "Frostskydd och dokumentation är klara", "sort_order": 2}
    ]
  }
  $json$::jsonb;

  insert into public.uppdragsbank_mallar (
    agare_org_id, created_by, titel, beskrivning, year_level, course_code,
    kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar
  )
  select v_org, v_profile,
         'Tappvatten – dolda ledningar och fogar',
         'Dold tappvattenledning med foglös dragning, serviceöppning och frostskydd.',
         'GY', 'VVS', 'uppdrag', v_payload,
         array['tappvatten-fogar','tappvatten-service','tappvatten-avstangning','tappvatten-frys'],
         1, 'godkand', v_profile, now(), 'Exempelmall'
  where not exists (
    select 1 from public.uppdragsbank_mallar where titel = 'Tappvatten – dolda ledningar och fogar'
  );

  -- -------------------------------------------------------------------
  -- 2. Badrum – tätskikt, golvbrunn och infästning
  -- -------------------------------------------------------------------
  v_payload := $json$
  {
    "assignment": {
      "title": "Badrum – tätskikt, golvbrunn och infästning",
      "description": "Komplettera ett badrum med golvbrunn, rörgenomföringar och infästningar. Allt som går genom tätskiktet ska vara tätat enligt systemets anvisning, och infästningar ska sitta i bärande underlag.",
      "kind": "uppdrag",
      "reveal_mode": "full",
      "ai_mode": "app_help_only",
      "steps": [],
      "year_level": "GY",
      "course_code": "VVS",
      "skolverket_ref": "",
      "assessment_visible": false,
      "reference_image_path": null,
      "goal": "Kunna utföra tätskikt, golvbrunn och infästning i våtrum enligt Säkervatten 2026:1.",
      "self_check_items": [
        "Golvbrunnen är godkänd och rätt placerad",
        "Rörgenomföringar är tätade enligt systemets anvisning",
        "Tätskiktet är obrutet runt genomföringar",
        "Infästningar sitter i bärande underlag",
        "Tätskiktet är tätat runt fästen"
      ],
      "reflection_questions": [
        "Vilka genomföringar fanns i badrummet och hur tätade du dem?",
        "Varför är det viktigt att inte punktera tätskiktet?",
        "Vad var svårast med infästningen?",
        "Vad tar du med dig till nästa badrum?"
      ],
      "rule_refs": ["tatskikt-golv", "tatskikt-vagg", "golvbrunn", "infastning-vagg", "infastning-golv", "produkter-tatskikt"]
    },
    "material_requirements": [
      {"component": "Golvbrunn", "dimension": "", "quantity": 1, "note": "Godkänd för ändamålet", "sort_order": 0},
      {"component": "Rörgenomföring", "dimension": "", "quantity": 3, "note": "", "sort_order": 1},
      {"component": "Tätskiktsmassa", "dimension": "", "quantity": 1, "note": "Enligt systemets anvisning", "sort_order": 2},
      {"component": "Tätningsmanschett", "dimension": "", "quantity": 3, "note": "", "sort_order": 3},
      {"component": "Fäste", "dimension": "", "quantity": 4, "note": "För bärande underlag", "sort_order": 4},
      {"component": "Silikon", "dimension": "", "quantity": 1, "note": "Våtrumsgodkänt", "sort_order": 5}
    ],
    "quiz_questions": [],
    "assessment_criteria": [
      {"label": "Tätskikt och genomföringar följer systemets anvisning", "sort_order": 0},
      {"label": "Golvbrunn och infästningar är korrekt monterade", "sort_order": 1},
      {"label": "Egenkontroll och dokumentation är komplett", "sort_order": 2}
    ]
  }
  $json$::jsonb;

  insert into public.uppdragsbank_mallar (
    agare_org_id, created_by, titel, beskrivning, year_level, course_code,
    kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar
  )
  select v_org, v_profile,
         'Badrum – tätskikt, golvbrunn och infästning',
         'Våtrumsarbete med golvbrunn, rörgenomföringar och infästningar.',
         'GY', 'VVS', 'uppdrag', v_payload,
         array['tatskikt-golv','tatskikt-vagg','golvbrunn','infastning-vagg','infastning-golv','produkter-tatskikt'],
         1, 'godkand', v_profile, now(), 'Exempelmall'
  where not exists (
    select 1 from public.uppdragsbank_mallar where titel = 'Badrum – tätskikt, golvbrunn och infästning'
  );

  -- -------------------------------------------------------------------
  -- 3. Spillvatten – fall, luftning och rensning
  -- -------------------------------------------------------------------
  v_payload := $json$
  {
    "assignment": {
      "title": "Spillvatten – fall, luftning och rensning",
      "description": "Montera en spillvattenledning med rätt fall, rensanordningar och luftning. Kontrollera att skarvar och riktningsändringar blir täta och att avloppet fungerar.",
      "kind": "uppdrag",
      "reveal_mode": "full",
      "ai_mode": "app_help_only",
      "steps": [],
      "year_level": "GY",
      "course_code": "VVS",
      "skolverket_ref": "",
      "assessment_visible": false,
      "reference_image_path": null,
      "goal": "Kunna montera spillvatten med rätt fall, luftning och rensmöjlighet enligt Säkervatten 2026:1.",
      "self_check_items": [
        "Fallet är rätt och jämnt",
        "Riktningsändringar är gjorda med godkända delar",
        "Rensanordningar finns och är åtkomliga",
        "Luftningen är rätt dimensionerad och mynnar godkänt",
        "Skarvar och anslutningar är täta"
      ],
      "reflection_questions": [
        "Hur kontrollerade du fallet?",
        "Var placerade du rensanordningarna och varför?",
        "Vad händer om spillvattenledningen inte luftas?",
        "Vad lärde du dig om riktningsändringar?"
      ],
      "rule_refs": ["spill-montage", "spill-riktning", "spill-rens", "spill-luftning", "golvbrunn"]
    },
    "material_requirements": [
      {"component": "Spillvattenrör", "dimension": "110", "quantity": 1, "note": "", "sort_order": 0},
      {"component": "Böj", "dimension": "110", "quantity": 2, "note": "", "sort_order": 1},
      {"component": "Grenrör", "dimension": "110", "quantity": 1, "note": "", "sort_order": 2},
      {"component": "Rensrör", "dimension": "110", "quantity": 1, "note": "", "sort_order": 3},
      {"component": "Luftningsrör", "dimension": "75", "quantity": 1, "note": "", "sort_order": 4},
      {"component": "Rörklammer", "dimension": "110", "quantity": 6, "note": "", "sort_order": 5}
    ],
    "quiz_questions": [],
    "assessment_criteria": [
      {"label": "Fall och riktningsändringar är korrekta", "sort_order": 0},
      {"label": "Rensning och luftning fungerar", "sort_order": 1},
      {"label": "Täthet och dokumentation är klar", "sort_order": 2}
    ]
  }
  $json$::jsonb;

  insert into public.uppdragsbank_mallar (
    agare_org_id, created_by, titel, beskrivning, year_level, course_code,
    kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar
  )
  select v_org, v_profile,
         'Spillvatten – fall, luftning och rensning',
         'Spillvattenledning med rätt fall, rensmöjlighet och luftning.',
         'GY', 'VVS', 'uppdrag', v_payload,
         array['spill-montage','spill-riktning','spill-rens','spill-luftning','golvbrunn'],
         1, 'godkand', v_profile, now(), 'Exempelmall'
  where not exists (
    select 1 from public.uppdragsbank_mallar where titel = 'Spillvatten – fall, luftning och rensning'
  );

  -- -------------------------------------------------------------------
  -- 4. Värme – slutet expansionskärl
  -- -------------------------------------------------------------------
  v_payload := $json$
  {
    "assignment": {
      "title": "Värme – slutet expansionskärl",
      "description": "Installera ett slutet expansionskärl med säkerhetsventil, manometer och avstängningsventiler. Kontrollera förladdning, serviceöppning och att installationen kan tryckprovas.",
      "kind": "uppdrag",
      "reveal_mode": "full",
      "ai_mode": "app_help_only",
      "steps": [],
      "year_level": "GY",
      "course_code": "VVS",
      "skolverket_ref": "",
      "assessment_visible": false,
      "reference_image_path": null,
      "goal": "Kunna installera ett slutet expansionskärl enligt Säkervatten 2026:1.",
      "self_check_items": [
        "Expansionskärlet har rätt förladdning",
        "Säkerhetsventil är monterad och avledd",
        "Manometer och avstängningsventiler är åtkomliga",
        "Serviceöppning finns",
        "Tryckprov är utfört och dokumenterat"
      ],
      "reflection_questions": [
        "Varför behövs ett slutet expansionskärl?",
        "Hur kontrollerade du förladdningen?",
        "Vad händer om säkerhetsventilen saknas?",
        "Vad lärde du dig om serviceöppningar?"
      ],
      "rule_refs": ["varme-fordelare", "varme-service", "varme-frys", "kontroll-tryck"]
    },
    "material_requirements": [
      {"component": "Slutet expansionskärl", "dimension": "", "quantity": 1, "note": "", "sort_order": 0},
      {"component": "Säkerhetsventil", "dimension": "", "quantity": 1, "note": "", "sort_order": 1},
      {"component": "Manometer", "dimension": "", "quantity": 1, "note": "", "sort_order": 2},
      {"component": "Avstängningsventil", "dimension": "", "quantity": 2, "note": "", "sort_order": 3},
      {"component": "Fördelarrör", "dimension": "", "quantity": 1, "note": "", "sort_order": 4},
      {"component": "Isolering", "dimension": "", "quantity": 1, "note": "", "sort_order": 5}
    ],
    "quiz_questions": [],
    "assessment_criteria": [
      {"label": "Kärl, säkerhetsventil och manometer är korrekt monterade", "sort_order": 0},
      {"label": "Serviceöppning och åtkomlighet är löst", "sort_order": 1},
      {"label": "Tryckprov är dokumenterat", "sort_order": 2}
    ]
  }
  $json$::jsonb;

  insert into public.uppdragsbank_mallar (
    agare_org_id, created_by, titel, beskrivning, year_level, course_code,
    kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar
  )
  select v_org, v_profile,
         'Värme – slutet expansionskärl',
         'Slutet expansionskärl med säkerhetsventil, manometer och serviceöppning.',
         'GY', 'VVS', 'uppdrag', v_payload,
         array['varme-fordelare','varme-service','varme-frys','kontroll-tryck'],
         1, 'godkand', v_profile, now(), 'Exempelmall'
  where not exists (
    select 1 from public.uppdragsbank_mallar where titel = 'Värme – slutet expansionskärl'
  );

  -- -------------------------------------------------------------------
  -- 5. Varmvattenberedare – legionella och återströmning
  -- -------------------------------------------------------------------
  v_payload := $json$
  {
    "assignment": {
      "title": "Varmvattenberedare – legionella och återströmning",
      "description": "Installera en varmvattenberedare med blandningsventil, säkerhetsventil och återströmningsskydd. Kontrollera temperaturer och att installationen inte har onödiga döda ändar.",
      "kind": "uppdrag",
      "reveal_mode": "full",
      "ai_mode": "app_help_only",
      "steps": [],
      "year_level": "GY",
      "course_code": "VVS",
      "skolverket_ref": "",
      "assessment_visible": false,
      "reference_image_path": null,
      "goal": "Kunna installera en varmvattenberedare med skydd mot legionella och återströmning enligt Säkervatten 2026:1.",
      "self_check_items": [
        "Varmvattentemperaturen är kontrollerad",
        "Kallvattentemperaturen är kontrollerad",
        "Installationen har inga onödiga döda ändar",
        "Återströmningsskydd finns",
        "Serviceöppning finns"
      ],
      "reflection_questions": [
        "Vilka temperaturer ska mätas och varför?",
        "Vad är en död ände och varför är den ett problem?",
        "Hur skyddar du installationen mot återströmning?",
        "Vad lärde du dig om legionella?"
      ],
      "rule_refs": ["legionella-temp", "legionella-utformning", "kontroll-temp", "aterstromning", "tappvatten-service"]
    },
    "material_requirements": [
      {"component": "Varmvattenberedare", "dimension": "", "quantity": 1, "note": "", "sort_order": 0},
      {"component": "Blandningsventil", "dimension": "", "quantity": 1, "note": "", "sort_order": 1},
      {"component": "Säkerhetsventil", "dimension": "", "quantity": 1, "note": "", "sort_order": 2},
      {"component": "Återströmningsskydd", "dimension": "", "quantity": 1, "note": "", "sort_order": 3},
      {"component": "Avstängningsventil", "dimension": "", "quantity": 2, "note": "", "sort_order": 4},
      {"component": "Isolering", "dimension": "", "quantity": 1, "note": "", "sort_order": 5}
    ],
    "quiz_questions": [],
    "assessment_criteria": [
      {"label": "Temperaturer och legionellaskydd är kontrollerade", "sort_order": 0},
      {"label": "Återströmningsskydd är korrekt monterat", "sort_order": 1},
      {"label": "Dokumentation och egenkontroll är klar", "sort_order": 2}
    ]
  }
  $json$::jsonb;

  insert into public.uppdragsbank_mallar (
    agare_org_id, created_by, titel, beskrivning, year_level, course_code,
    kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar
  )
  select v_org, v_profile,
         'Varmvattenberedare – legionella och återströmning',
         'Varmvattenberedare med temperaturkontroll, legionellaskydd och återströmningsskydd.',
         'GY', 'VVS', 'uppdrag', v_payload,
         array['legionella-temp','legionella-utformning','kontroll-temp','aterstromning','tappvatten-service'],
         1, 'godkand', v_profile, now(), 'Exempelmall'
  where not exists (
    select 1 from public.uppdragsbank_mallar where titel = 'Varmvattenberedare – legionella och återströmning'
  );

  -- -------------------------------------------------------------------
  -- 6. Tryck- och täthetskontroll
  -- -------------------------------------------------------------------
  v_payload := $json$
  {
    "assignment": {
      "title": "Tryck- och täthetskontroll",
      "description": "Utför tryck- och täthetskontroll på en tappvatten- eller värmeinstallation. Välj rätt provtryck och tid, kontrollera utrustningen och dokumentera resultatet i ett protokoll.",
      "kind": "uppdrag",
      "reveal_mode": "full",
      "ai_mode": "app_help_only",
      "steps": [],
      "year_level": "GY",
      "course_code": "VVS",
      "skolverket_ref": "",
      "assessment_visible": false,
      "reference_image_path": null,
      "goal": "Kunna utföra och dokumentera tryck- och täthetskontroll enligt Säkervatten 2026:1.",
      "self_check_items": [
        "Rätt provtryck och tid används",
        "Provtryckspump och manometer är kontrollerade",
        "Alla anslutningar är täta",
        "Eventuella läckage är åtgärdade",
        "Protokollet är ifyllt och signerat"
      ],
      "reflection_questions": [
        "Vilket provtryck använde du och varför?",
        "Hur kontrollerade du mätutrustningen?",
        "Vad gör du om ett läckage hittas?",
        "Vad lärde du dig om dokumentation?"
      ],
      "rule_refs": ["kontroll-tryck", "kontroll-verktyg", "kontroll-temp"]
    },
    "material_requirements": [
      {"component": "Provtryckspump", "dimension": "", "quantity": 1, "note": "", "sort_order": 0},
      {"component": "Manometer", "dimension": "", "quantity": 1, "note": "Kontrollerad", "sort_order": 1},
      {"component": "Pluggar", "dimension": "", "quantity": 4, "note": "", "sort_order": 2},
      {"component": "Provprotokoll", "dimension": "", "quantity": 1, "note": "", "sort_order": 3}
    ],
    "quiz_questions": [],
    "assessment_criteria": [
      {"label": "Provtryck och tid följer branschreglerna", "sort_order": 0},
      {"label": "Utrustningen är kontrollerad", "sort_order": 1},
      {"label": "Protokollet är komplett", "sort_order": 2}
    ]
  }
  $json$::jsonb;

  insert into public.uppdragsbank_mallar (
    agare_org_id, created_by, titel, beskrivning, year_level, course_code,
    kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar
  )
  select v_org, v_profile,
         'Tryck- och täthetskontroll',
         'Provtryckning med rätt utrustning och dokumenterat protokoll.',
         'GY', 'VVS', 'uppdrag', v_payload,
         array['kontroll-tryck','kontroll-verktyg','kontroll-temp'],
         1, 'godkand', v_profile, now(), 'Exempelmall'
  where not exists (
    select 1 from public.uppdragsbank_mallar where titel = 'Tryck- och täthetskontroll'
  );

  -- -------------------------------------------------------------------
  -- 7. Kök – diskmaskin och köksblandare
  -- -------------------------------------------------------------------
  v_payload := $json$
  {
    "assignment": {
      "title": "Kök – diskmaskin och köksblandare",
      "description": "Anslut diskmaskin och köksblandare med skydd mot återströmning och läckage. Kontrollera att anslutningarna är täta och att eventuellt läckage kan upptäckas.",
      "kind": "uppdrag",
      "reveal_mode": "full",
      "ai_mode": "app_help_only",
      "steps": [],
      "year_level": "GY",
      "course_code": "VVS",
      "skolverket_ref": "",
      "assessment_visible": false,
      "reference_image_path": null,
      "goal": "Kunna ansluta diskmaskin och köksblandare enligt Säkervatten 2026:1.",
      "self_check_items": [
        "Diskmaskinen har skydd mot återströmning",
        "Köksblandaren är godkänd och rätt monterad",
        "Anslutningarna är täta",
        "Läckage kan upptäckas",
        "Monteringsanvisningen är följd"
      ],
      "reflection_questions": [
        "Varför behövs återströmningsskydd i köket?",
        "Hur kontrollerade du att anslutningarna blev täta?",
        "Vad gör du om du upptäcker ett läckage?",
        "Vad lärde du dig om köksinstallationer?"
      ],
      "rule_refs": ["kok-diskmaskin", "kok-blandare", "aterstromning", "utrustning-vattentatt-golv"]
    },
    "material_requirements": [
      {"component": "Diskmaskinsanslutning", "dimension": "", "quantity": 1, "note": "", "sort_order": 0},
      {"component": "Köksblandare", "dimension": "", "quantity": 1, "note": "", "sort_order": 1},
      {"component": "Återströmningsskydd", "dimension": "", "quantity": 1, "note": "", "sort_order": 2},
      {"component": "Slang", "dimension": "", "quantity": 1, "note": "", "sort_order": 3},
      {"component": "Tätning", "dimension": "", "quantity": 2, "note": "", "sort_order": 4}
    ],
    "quiz_questions": [],
    "assessment_criteria": [
      {"label": "Anslutningarna är täta och rätt dimensionerade", "sort_order": 0},
      {"label": "Återströmningsskydd finns", "sort_order": 1},
      {"label": "Monteringsanvisningen är följd", "sort_order": 2}
    ]
  }
  $json$::jsonb;

  insert into public.uppdragsbank_mallar (
    agare_org_id, created_by, titel, beskrivning, year_level, course_code,
    kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar
  )
  select v_org, v_profile,
         'Kök – diskmaskin och köksblandare',
         'Diskmaskin och köksblandare med täta anslutningar och återströmningsskydd.',
         'GY', 'VVS', 'uppdrag', v_payload,
         array['kok-diskmaskin','kok-blandare','aterstromning','utrustning-vattentatt-golv'],
         1, 'godkand', v_profile, now(), 'Exempelmall'
  where not exists (
    select 1 from public.uppdragsbank_mallar where titel = 'Kök – diskmaskin och köksblandare'
  );

  raise notice 'Exempelmallar kontrollerade/insatta för org % (profil %).', v_org, v_profile;
end;
$$;
