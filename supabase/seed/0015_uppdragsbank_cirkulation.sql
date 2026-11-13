-- 0015_uppdragsbank_cirkulation.sql
-- Systemövning: värmesystem på tavla (panna, öppet kärl, radiatorer, cirkulationspump).
-- Innehåller materialanskaffning och uppfästning med gängstång, svepklammer, Z- och L-järn.
-- Kör efter 0012_uppdragsbank.sql och kräver minst en godkänd lärare.
-- Idempotent: mallen läggs inte in igen om titeln redan finns.

do $$
declare v_org uuid; v_profile uuid; v_payload jsonb;
begin
  select p.org_id, p.id into v_org, v_profile from public.profiles p where p.status='approved' order by p.created_at limit 1;
  if v_org is null then raise notice 'Ingen godkänd lärare finns – systemövningen hoppas över.'; return; end if;

  v_payload := $json$
{
  "assignment": {
    "title": "Systemövning – Värmesystem på tavla (panna, kärl, radiatorer)",
    "description": "Bygg ett litet värmesystem på en tavla: panna av 110-rör, öppet expansionskärl av 75-rör, framledning och retur i 15 mm, två radiatorer i 12 mm och en liten cirkulationspump. Du hämtar själv materialet och fäster upp allt med gängstång, svepklammer samt Z- och L-järn.\n\nMoment:\n1. Hämta materialet enligt listan: 110- och 75-rör med lock och muffar, kopplingar, gängstång, svepklammer, Z- och L-järn.\n2. Rita kretsen på papper och märk ut panna, framledning, radiatorer, retur och pump.\n3. Kapa 110-röret till cirka 500 mm och 75-röret till cirka 250 mm.\n4. Plugga pannans båda ändar med lock och muffar, med tätning.\n5. Mät och märk två hål på pannans sida: framledning högt, retur lågt, med minst 100 mm mellan.\n6. Borra hålen med stegborr och montera tankgenomföringarna med tätning.\n7. Borra för gängstången genom tavlan och lås den med mutter och bricka på båda sidor.\n8. Fäst pannan på gängstången med svepklammer – stumt men utan att klämma ihop röret.\n9. Staga tavlan med Z-järn och L-järn så att den inte sviktar när pannan fylls.\n10. Montera expansionskärlet högst på tavlan, öppen ände uppåt, fäst med svepklammer.\n11. Montera cirkulationspumpen i returen strax före pannan – kontrollera pilen.\n12. Bocka och dra framledningen från pannans övre anslutning till radiatorerna.\n13. Bygg två radiatorer av 12 mm rör och koppla dem parallellt mellan fram och retur.\n14. Dra returen från radiatorerna genom pumpen tillbaka till pannans nedre anslutning.\n15. Anslut kärlet till systemets högsta punkt.\n16. Fyll med vatten och färg, lufta vid kärlet och radiatorerna.\n17. Provkör pumpen och kontrollera flöde, riktning och täthet.\n18. Dokumentera kretsen med foto och skriv vad du skulle göra annorlunda.\n\nYrkesspråk: panna, öppet expansionskärl, framledning, returledning, cirkulationspump, flödesriktning, radiator, luftning, påfyllning, tankgenomföring, muff, gängstång, svepklammer, Z-järn, L-järn, stagning, infästning, täthetsprov, cc-mått\n\nSäkerhet:\n- Skyddsglasögon vid kapning och borrning.\n- Vassa rörändar – handskar.\n- 230 V-pump endast via jordfelsbrytare, aldrig i vatten.\n- Använd 12 V-pump om skolan har.\n- Fyll inte med varmare vatten än 60 °C.\n- Torka upp spill direkt.\n\nVanliga fel:\n- Fram och retur förväxlas.\n- För stort hål i pannan så genomföringen inte tätar.\n- Expansionskärlet pluggas igen eller monteras lågt.\n- Pumpen monteras åt fel håll.\n- Luft blir kvar i radiatorerna.\n- Radiatorerna kopplas i serie i stället för parallellt.\n- För klena fästen så tavlan svajar.\n- Svepklammer dras så hårt att plaströret kläms ihop.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "lokal:system-cirkulation",
    "goal": "Hämta och kontrollera materialet enligt listan. Kapa och plugga 110- och 75-rör. Montera täta 15 mm-genomföringar i pannan. Fästa upp systemet stabilt med gängstång, svepklammer, Z- och L-järn. Bygga framledning och retur i 15 mm samt två radiatorer i 12 mm. Montera och rikta cirkulationspumpen. Fylla, lufta och provköra systemet så att cirkulationen fungerar.",
    "self_check_items": [
      "Framledning sitter högt och retur lågt på pannan.",
      "Expansionskärlet är öppet och sitter högst i systemet.",
      "Pumpens pil stämmer med flödesriktningen.",
      "Radiatorerna är kopplade parallellt och blir jämnt genomströmda.",
      "Alla fogar och genomföringar är täta – inget vatten under tavlan.",
      "Systemet är luftat och cirkulationen syns på färgen i vattnet.",
      "Rören sitter i klammer och tavlan är stabil.",
      "Inget glapp: tryck på radiatorerna – tavlan ska inte svikta.",
      "Gängstången är låst med mutter på båda sidor om tavlan.",
      "Svepklamren klämmer runt röret utan att deformera det.",
      "Elen till pumpen är kopplad via jordfelsbrytare."
    ],
    "reflection_questions": [
      "Varför ska framledningen sitta högt på pannan?",
      "Vad händer om expansionskärlet pluggas igen?",
      "Varför sitter cirkulationspumpen ofta i returen?",
      "Varför är infästningen lika viktig som rördragningen?",
      "Hur märker du att det är cirkulation i systemet?"
    ],
    "rule_refs": []
  },
  "material_requirements": [
    {
      "component": "PVC-rör",
      "dimension": "110 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 0
    },
    {
      "component": "Lock",
      "dimension": "110 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 1
    },
    {
      "component": "Muff",
      "dimension": "110 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 2
    },
    {
      "component": "PVC-rör",
      "dimension": "75 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 3
    },
    {
      "component": "Lock",
      "dimension": "75 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 4
    },
    {
      "component": "Muff",
      "dimension": "75 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 5
    },
    {
      "component": "Kopparrör",
      "dimension": "15 mm",
      "quantity": 3,
      "note": "",
      "sort_order": 6
    },
    {
      "component": "Kopparrör",
      "dimension": "12 mm",
      "quantity": 3,
      "note": "",
      "sort_order": 7
    },
    {
      "component": "Koppling/klämring",
      "dimension": "15 mm",
      "quantity": 6,
      "note": "",
      "sort_order": 8
    },
    {
      "component": "Koppling och böj",
      "dimension": "12 mm",
      "quantity": 10,
      "note": "",
      "sort_order": 9
    },
    {
      "component": "Tankgenomföring",
      "dimension": "15 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 10
    },
    {
      "component": "Gängstång",
      "dimension": "M8",
      "quantity": 4,
      "note": "",
      "sort_order": 11
    },
    {
      "component": "Svepklammer",
      "dimension": "110 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 12
    },
    {
      "component": "Svepklammer",
      "dimension": "75 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 13
    },
    {
      "component": "Z-järn",
      "dimension": "40 × 40 mm",
      "quantity": 2,
      "note": "",
      "sort_order": 14
    },
    {
      "component": "L-järn/vinkel",
      "dimension": "40 × 40 mm",
      "quantity": 4,
      "note": "",
      "sort_order": 15
    },
    {
      "component": "Mutter och bricka",
      "dimension": "M8",
      "quantity": 16,
      "note": "",
      "sort_order": 16
    },
    {
      "component": "Träskruv/plugg",
      "dimension": "—",
      "quantity": 20,
      "note": "",
      "sort_order": 17
    },
    {
      "component": "Tavla/plywood",
      "dimension": "600 × 400 mm",
      "quantity": 1,
      "note": "",
      "sort_order": 18
    }
  ],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Framledning sitter högt och retur lågt på pannan.",
      "sort_order": 0
    },
    {
      "label": "Expansionskärlet är öppet och sitter högst i systemet.",
      "sort_order": 1
    },
    {
      "label": "Pumpens pil stämmer med flödesriktningen.",
      "sort_order": 2
    },
    {
      "label": "Radiatorerna är kopplade parallellt och blir jämnt genomströmda.",
      "sort_order": 3
    },
    {
      "label": "Alla fogar och genomföringar är täta – inget vatten under tavlan.",
      "sort_order": 4
    },
    {
      "label": "Systemet är luftat och cirkulationen syns på färgen i vattnet.",
      "sort_order": 5
    },
    {
      "label": "Rören sitter i klammer och tavlan är stabil.",
      "sort_order": 6
    },
    {
      "label": "Inget glapp: tryck på radiatorerna – tavlan ska inte svikta.",
      "sort_order": 7
    },
    {
      "label": "Gängstången är låst med mutter på båda sidor om tavlan.",
      "sort_order": 8
    },
    {
      "label": "Svepklamren klämmer runt röret utan att deformera det.",
      "sort_order": 9
    },
    {
      "label": "Elen till pumpen är kopplad via jordfelsbrytare.",
      "sort_order": 10
    }
  ]
}
  $json$::jsonb;

  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Systemövning – Värmesystem på tavla (panna, kärl, radiatorer)', 'Bygg ett litet värmesystem på en tavla: panna av 110-rör, öppet expansionskärl av 75-rör, framledning och retur i 15 mm, två radiatorer i 12 mm och en liten cirkulationspump. Du hämtar själv materialet och fäster upp allt med gängstång, svepklammer samt Z- och L-järn.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad systemövning'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Systemövning – Värmesystem på tavla (panna, kärl, radiatorer)');
end $$;
