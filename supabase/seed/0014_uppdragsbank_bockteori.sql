-- 0014_uppdragsbank_bockteori.sql
-- Teorimall för bockning. Kräver minst en godkänd lärare.
-- Idempotent: lägger inte in samma titel två gånger.
do $$
declare v_org uuid; v_profile uuid; v_payload jsonb;
begin
  select p.org_id, p.id into v_org, v_profile from public.profiles p where p.status='approved' order by p.created_at limit 1;
  if v_org is null then raise notice 'Ingen godkänd lärare finns – teorimallen hoppas över.'; return; end if;
  v_payload := $json$
{
  "assignment": {
    "title": "Teori – bockning: mått, offset och S-bock",
    "description": "Teori och formler för bockning – för dig som elev.\n\n## Vad händer i en bock?\nFörstå varför röret veckar sig, blir ovalt eller spricker.\nNär du böjer ett rör sträcks materialet på utsidan och pressas ihop på insidan. Mitt i röret finns en neutralaxel som behåller sin längd.\n- För snäv bock → röret blir ovalt, veckar sig på insidan eller spricker på utsidan.\n- Rätt bockfjäder eller bockverktyg stöttar röret så att tvärsnittet behåller formen.\n- Rörkvaliteten spelar stor roll: halvhårt och värmebehandlat hårt koppar böjs bäst. Hårda rör (kategori 4) veckar lättare.\n- Verktygets skick spelar också roll – en sliten eller för kort bock stöttar inte insidan tillräckligt.\nObs: Tumregel: ovaliteten ska vara under 10 % av rördiametern. Kontrollera med skjutmått över bocken.\n\n## Bockmått och cc-mått\nTvå mått som låter lika men betyder olika saker.\ncc-mått betyder centrum till centrum. Det är måttet du mäter på ritningen – mellan två bockars centrum, eller mellan två parallella rörs centrum.\nBockmått är var du sätter märket på röret innan du bockar. Det beror på bockverktyget, rördimensionen och var på bocken du mäter.\nObs: Blanda aldrig cc-mått och bockmått. Välj en referens – centrum eller insida – och håll dig till den genom hela jobbet.\n\n## 90°-bock\nDen vanligaste bocken – två raka ben med 90° mellan.\n- Mät bockmåttet från röränden och märk bockpunkten.\n- Bocka långsamt mot en vinkelhake.\n- Kontrollera att röret inte blir ovalt eller veckar sig.\n- Kapa och skäva rörändarna efter bockning.\n\n## 45°-bock\nAnvänds när du inte behöver svänga 90° – ofta i trånga utrymmen.\nEn 45°-bock ger en mjukare sväng och används ofta i par för att göra en offset eller en S-bock.\n- Kontrollera vinkeln mot en vinkelmall.\n- Två 45°-bockar åt motsatt håll blir en offset.\n- Mät bockmåttet från samma referens som du använder på ritningen.\n\n## Offset – parallellförskjutning\nFlytta röret åt sidan eller uppåt utan att ändra riktning.\nEn offset görs med två lika stora bockar åt motsatt håll. Röret fortsätter rakt – men på en ny nivå.\nTänk dig att du går rakt fram, tar ett steg snett uppåt och ett steg snett tillbaka. Du går fortfarande rakt fram, men på en ny nivå. Så fungerar en offset.\nVinkel | Faktor | Används till\n--- | --- | ---\n15° | 3,7 | stor offset/S\n30° | 2,0 | offset/S\n45° | 1,41 | vanligast\n60° | 1,15 | kort offset\n90° | 1,0 | Z-bock\nRäkneexempel: 50 mm offset med 45°-bockar: 50 × 1,41 = 70,5 mm mellan bockarna. 100 mm offset: 100 × 1,41 = 141 mm.\n- Mät offset vinkelrätt mellan gamla och nya centrumlinjen.\n- Välj bockvinkel och räkna ut avståndet med faktorn.\n- Märk båda bockpunkterna.\n- Bocka första bocken, vänd röret och bocka andra bocken åt motsatt håll.\n- Kontrollera offsetmått, parallellitet och att bockarna ligger i samma plan.\n\n## S-bock\nSamma princip som offset – men formen liknar ett S.\nEn S-bock består av två lika stora bockar. S-måttet är hur mycket röret förskjuts i höjd- eller sidled.\nEn S-bock kan aldrig vara 90° – då blir det en Z-bock. Vid 90° är faktorn 1, och då går röret rakt upp och rakt tillbaka.\nVinkel | Faktor | Används till\n--- | --- | ---\n15° | 3,7 | stor S\n30° | 2,0 | vanlig S\n45° | 1,41 | vanlig S\nRäkneexempel: 60 mm S med 30°-bockar: 60 × 2 = 120 mm mellan markeringarna. Med 45°-bockar: 60 × 1,41 = 84,6 mm.\nTighta S-bockar med 45°: 15 mm rör ger cirka 60 mm cc, 12 mm rör cirka 50 mm cc när bockarna läggs så nära varandra som möjligt.\nFör större S-bockar finns en praktisk formel: 15 mm rör → markavstånd = 110 + X. 12 mm rör → 90 + X. X är det S-mått du vill ha. Exempel: 15 mm rör och S = 80 mm → 110 + 80 = 190 mm mellan markeringarna.\nMetod: märk avståndet, bocka första 45°-bocken, vänd röret och lägg märket på bockverktygets mittlinje, bocka andra 45°-bocken.\nObs: Bockverktyget har ofta två märken för tighta S-bockar. På 15 mm rör ger första märket cirka 15 mm S och andra märket cirka 35 mm S; på 12 mm rör cirka 10 mm respektive 30 mm. Alla bocknycklar slår olika – lär känna din egen.\n- Sätt ett startstreck – det kan ligga var som helst, men du måste veta var det är.\n- Mät upp avståndet och gör ett bockstreck runt hela röret.\n- Bocka första bocken till vald vinkel.\n- Vänd röret, lägg bockstrecket mot bockverktygets 0-punkt och bocka andra bocken till samma vinkel.\n\n## Räkneexempel steg för steg\nSå räknar du ut avståndet innan du bockar.\nGrundregeln: avstånd mellan bockarna = S-mått × faktor. Vid 45° är faktorn 1,41, vid 30° är den 2,0 och vid 15° är den 3,7.\nRäkneexempel: Offset 50 mm, 45°: 50 × 1,41 = 70,5 mm. Märk 70,5 mm mellan bockpunkterna.\nRäkneexempel: Offset 100 mm, 30°: 100 × 2,0 = 200 mm.\nRäkneexempel: S-bock 60 mm, 45°: 60 × 1,41 = 84,6 mm.\nRäkneexempel: S-bock 80 mm på 15 mm rör med 110 + X: 110 + 80 = 190 mm. Steg: märk 190 mm → bocka första 45° → vänd röret → lägg märket på mittlinjen → bocka andra 45°.\nRäkneexempel: S-bock 90 mm på 12 mm rör med 90 + X: 90 + 90 = 180 mm. Samma steg som ovan.\nObs: Tight S-bock utan beräkning: 15 mm rör med två 45°-bockar så nära varandra som möjligt ger ca 60 mm cc; 12 mm rör ca 50 mm cc.\nÖva själv – räkna först, titta sedan på svaret:\n- Offset 70 mm med 45° → 70 × 1,41 = 98,7 mm.\n- S-bock 50 mm med 30° → 50 × 2 = 100 mm.\n- 15 mm rör, S = 100 mm med 110 + X → 110 + 100 = 210 mm.\n- 12 mm rör, S = 60 mm med 90 + X → 90 + 60 = 150 mm.\n\n## Z-bock\nTvå 90°-bockar – röret går rakt, svänger 90° och svänger tillbaka.\nEn Z-bock är två 90°-bockar. Offsetmåttet är lika med avståndet mellan bockarna, eftersom faktorn vid 90° är 1.\n- Används för att komma runt ett hinder eller byta nivå snabbt.\n- Kontrollera att båda bockarna ligger i samma plan.\n- Mät cc-måttet mellan bockarna och kontrollera med vinkelhake.\n\n## U-bock / dubbelbock\nTvå 90°-bockar i samma plan.\nEn U-bock används när röret ska gå upp, över och ner igen. Kontrollera cc-mått, höjd och att benen blir parallella.\n\n## Svanbock\nTvå motriktade bockar med en kort rak del emellan.\nEn svanbock används för att komma runt ett hinder eller få ett kort avstånd mellan två rör. Det finns flera sätt att göra den.\nDen traditionella svanbocken är 60° + 30°. Bocka 60°-bocken först och 30°-bocken sedan – ordningen är viktig. Gör du 30° först blir måttet fel.\nDet finns också en alternativ 30/30/60-teknik: bocka 30°, vänd röret, bocka 30° igen och vänd tillbaka och bocka första bocken till 60°. Det är en annan metod som ger en tight svanbock.\n\n## Mäta från insida – seriebock\nSmart när du gör flera bockar efter varandra.\nI stället för att försöka hitta rörets centrum kan du mäta från rörets insida. Då måste du kompensera med halva ytterdiametern.\n- 12 mm rör → kompensera med 6 mm.\n- 15 mm rör → kompensera med 7,5 mm.\n- Använd bockverktygets X-markering om den finns – den är gjord för den här mätningen.\n- Kontrollera cc-måttet efter varje bock.\n\n## Varför blir det fel?\nDe vanligaste orsakerna till veck, fel mått och sneda bockar.\n- Fel rörkvalitet – hårt rör veckar lättare än halvhårt eller värmebehandlat hårt rör.\n- Bockfjädern är för kort eller för liten, så insidan inte får stöd.\n- Bocken blir för snäv – röret blir ovalt eller veckar sig.\n- Röret är inte skävt efter kapning.\n- Man blandar cc-mått och bockmått, eller centrum och insida.\n- Man kontrollerar inte efter varje bock – felet förstoras genom hela serien.\n- Verktyget är slitet eller fel inställt.\nObs: VVS-Forum: Ari Sundelin på Cupori tipsar om värmebehandlade hårda kopparrör (kategori 3) för bockning och pekar på verktygets konstruktion som en vanlig orsak till veck. Anders Pargell/RörmokarLäraren betonar att man ska använda den bocknyckel man är van vid och mäta noga.\n\n## Kontroll och egenkontroll\nSå vet du att bocken är godkänd.\n- Bockvinkel ±2°.\n- cc-mått ±2 mm.\n- Ovalitet under 10 %.\n- Inga veck, sprickor eller sträckningar.\n- Bockarna ligger i samma plan.\n- Röret är skävt och fritt från grader.\n- Täthetsprovning är gjord efter anslutning.\n\n## Yrkesspråk – ordlista\nOrden du behöver kunna i verkstaden.\n- Bockfjäder – fjäder som sticks in i röret och stöttar insidan.\n- Bocknyckel/rörbock – verktyget som böjer röret.\n- Bockmått – var märket sätts på röret före bockning.\n- Bockradie – radien i bocken.\n- Bockvinkel – vinkeln mellan rörets ben.\n- cc-mått – centrum till centrum.\n- Ovalitet – hur mycket röret trycks ihop i tvärsnittet.\n- Veckbildning – rynkor på insidan av bocken.\n- Sträckning – materialet sträcks på utsidan.\n- Skäva – ta bort grader efter kapning.\n- Glödgning – mjukgöra koppar före bockning.\n- Fjädrning/springback – röret fjädrar tillbaka några grader.\n- Neutralaxel – skiktet i röret som behåller sin längd.\n\n## Källor och vidare läsning\nAnvänd gärna källorna för fördjupning.\n- RörmokarLäraren (Anders Pargell), YouTube: ”Svan och s bock”, ”En annan variant på nästa bock” och ”Tavlan”.\n- VVS-Forum: ”Välj det här röret om du vill undvika veck vid bockning” (2025-08-18).\n- VVS-Forum: ”Det här kan vara orsaken till att bockningen blir fel” (2021-11-17).\n- VVS-Forum: ”Rörmokaren älskar bockning” (2024-05-27).\n- VVS-Forum: ”VVS-företagarens hack: fixeringsbräda för rätt röravstånd” (2026-02-26).\n- Wikipedia: ”Tube bending” – neutralaxel, ovalitet och springback.\nObs: Det här är appens egna sammanfattningar för undervisning. Kontrollera alltid mot din bockverktygstillverkares anvisning och skolans rutiner.\n\n\nBilderna finns i appens teoridel: Uppdrag → Bockövningar → Teori. Kontrollera alltid mot din bockverktygstillverkares anvisning.",
    "kind": "uppdrag",
    "reveal_mode": "full",
    "ai_mode": "app_help_only",
    "steps": [],
    "year_level": "GY",
    "course_code": "VVS",
    "skolverket_ref": "",
    "assessment_visible": false,
    "reference_image_path": "ac3e0e58-428f-4610-8231-151b4f511f3d/bockning/teori-offset-matt.png",
    "goal": "Kunna förklara och räkna på bockmått, offset, S-bock och vanliga bockfel.",
    "self_check_items": [
      "Jag kan förklara skillnaden mellan cc-mått och bockmått.",
      "Jag kan räkna ut avståndet för en offset med 45°.",
      "Jag kan räkna ut avståndet för en S-bock med 30° och 45°.",
      "Jag vet varför en S-bock inte kan vara 90°.",
      "Jag kan kompensera för halva ytterdiametern vid mätning från insidan.",
      "Jag kan kontrollera ovalitet, veck och bockvinkel."
    ],
    "reflection_questions": [
      "Varför blir röret ovalt vid en för snäv bock?",
      "När använder du en offset i stället för en 90°-bock?",
      "Varför måste bockarna ligga i samma plan?",
      "Vad gör du om bocken blir för stor?"
    ],
    "rule_refs": []
  },
  "material_requirements": [],
  "quiz_questions": [],
  "assessment_criteria": [
    {
      "label": "Jag kan förklara skillnaden mellan cc-mått och bockmått.",
      "sort_order": 0
    },
    {
      "label": "Jag kan räkna ut avståndet för en offset med 45°.",
      "sort_order": 1
    },
    {
      "label": "Jag kan räkna ut avståndet för en S-bock med 30° och 45°.",
      "sort_order": 2
    },
    {
      "label": "Jag vet varför en S-bock inte kan vara 90°.",
      "sort_order": 3
    },
    {
      "label": "Jag kan kompensera för halva ytterdiametern vid mätning från insidan.",
      "sort_order": 4
    },
    {
      "label": "Jag kan kontrollera ovalitet, veck och bockvinkel.",
      "sort_order": 5
    }
  ]
}
  $json$::jsonb;
  insert into public.uppdragsbank_mallar (agare_org_id, created_by, titel, beskrivning, year_level, course_code, kind, payload, regel_refs, version, status, granskad_av, granskad_at, granskningskommentar)
  select v_org, v_profile, 'Teori – bockning: mått, offset och S-bock', 'Teori och formler för bockning – offset, S-bock, Z-bock och vanliga fel.', 'GY', 'VVS', 'uppdrag', v_payload, array[]::text[], 1, 'godkand', v_profile, now(), 'Importerad teorimall'
  where not exists (select 1 from public.uppdragsbank_mallar where titel = 'Teori – bockning: mått, offset och S-bock');
end $$;
