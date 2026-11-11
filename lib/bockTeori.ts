// Teori för bockning – skriven för VVS-elever.
// Sammanfattningarna är appens egna, inte kopierade regeltexter.
// Källor listas sist. Kontrollera alltid mot bockverktygets anvisning.

export type TeoriBlock =
  | { type: "p"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "note"; text: string }
  | { type: "formula"; rows: Array<{ vinkel: string; faktor: string; anvandning: string }> }
  | { type: "example"; text: string }
  | { type: "image"; exerciseId: string; caption?: string };

export type TeoriSection = {
  id: string;
  titel: string;
  ingress?: string;
  block: TeoriBlock[];
};

export const BOCK_TEORI: TeoriSection[] = [
  {
    id: "vad-hander",
    titel: "Vad händer i en bock?",
    ingress: "Förstå varför röret veckar sig, blir ovalt eller spricker.",
    block: [
      { type: "p", text: "När du böjer ett rör sträcks materialet på utsidan och pressas ihop på insidan. Mitt i röret finns en neutralaxel som behåller sin längd." },
      { type: "bullets", items: [
        "För snäv bock → röret blir ovalt, veckar sig på insidan eller spricker på utsidan.",
        "Rätt bockfjäder eller bockverktyg stöttar röret så att tvärsnittet behåller formen.",
        "Rörkvaliteten spelar stor roll: halvhårt och värmebehandlat hårt koppar böjs bäst. Hårda rör (kategori 4) veckar lättare.",
        "Verktygets skick spelar också roll – en sliten eller för kort bock stöttar inte insidan tillräckligt.",
      ]},
      { type: "note", text: "Tumregel: ovaliteten ska vara under 10 % av rördiametern. Kontrollera med skjutmått över bocken." },
      { type: "image", exerciseId: "bock-tunnvaggig", caption: "Stor bockradie och kontroll av ovalitet." },
    ],
  },
  {
    id: "bockmatt-cc",
    titel: "Bockmått och cc-mått",
    ingress: "Två mått som låter lika men betyder olika saker.",
    block: [
      { type: "p", text: "cc-mått betyder centrum till centrum. Det är måttet du mäter på ritningen – mellan två bockars centrum, eller mellan två parallella rörs centrum." },
      { type: "p", text: "Bockmått är var du sätter märket på röret innan du bockar. Det beror på bockverktyget, rördimensionen och var på bocken du mäter." },
      { type: "note", text: "Blanda aldrig cc-mått och bockmått. Välj en referens – centrum eller insida – och håll dig till den genom hela jobbet." },
    ],
  },
  {
    id: "90",
    titel: "90°-bock",
    ingress: "Den vanligaste bocken – två raka ben med 90° mellan.",
    block: [
      { type: "bullets", items: [
        "Mät bockmåttet från röränden och märk bockpunkten.",
        "Bocka långsamt mot en vinkelhake.",
        "Kontrollera att röret inte blir ovalt eller veckar sig.",
        "Kapa och skäva rörändarna efter bockning.",
      ]},
      { type: "image", exerciseId: "bock-90-koppar-15", caption: "90°-bock med bockmått och bockradie." },
    ],
  },
  {
    id: "45",
    titel: "45°-bock",
    ingress: "Används när du inte behöver svänga 90° – ofta i trånga utrymmen.",
    block: [
      { type: "p", text: "En 45°-bock ger en mjukare sväng och används ofta i par för att göra en offset eller en S-bock." },
      { type: "bullets", items: [
        "Kontrollera vinkeln mot en vinkelmall.",
        "Två 45°-bockar åt motsatt håll blir en offset.",
        "Mät bockmåttet från samma referens som du använder på ritningen.",
      ]},
      { type: "image", exerciseId: "bock-45-koppar-15", caption: "45°-bock – kontrollera vinkeln." },
    ],
  },
  {
    id: "offset",
    titel: "Offset – parallellförskjutning",
    ingress: "Flytta röret åt sidan eller uppåt utan att ändra riktning.",
    block: [
      { type: "p", text: "En offset görs med två lika stora bockar åt motsatt håll. Röret fortsätter rakt – men på en ny nivå." },
      { type: "p", text: "Tänk dig att du går rakt fram, tar ett steg snett uppåt och ett steg snett tillbaka. Du går fortfarande rakt fram, men på en ny nivå. Så fungerar en offset." },
      { type: "formula", rows: [
        { vinkel: "15°", faktor: "3,7", anvandning: "stor offset/S" },
        { vinkel: "30°", faktor: "2,0", anvandning: "offset/S" },
        { vinkel: "45°", faktor: "1,41", anvandning: "vanligast" },
        { vinkel: "60°", faktor: "1,15", anvandning: "kort offset" },
        { vinkel: "90°", faktor: "1,0", anvandning: "Z-bock" },
      ]},
      { type: "example", text: "50 mm offset med 45°-bockar: 50 × 1,41 = 70,5 mm mellan bockarna. 100 mm offset: 100 × 1,41 = 141 mm." },
      { type: "bullets", items: [
        "Mät offset vinkelrätt mellan gamla och nya centrumlinjen.",
        "Välj bockvinkel och räkna ut avståndet med faktorn.",
        "Märk båda bockpunkterna.",
        "Bocka första bocken, vänd röret och bocka andra bocken åt motsatt håll.",
        "Kontrollera offsetmått, parallellitet och att bockarna ligger i samma plan.",
      ]},
      { type: "image", exerciseId: "bock-offset-45", caption: "Offset med två motriktade 45°-bockar." },
    ],
  },
  {
    id: "s-bock",
    titel: "S-bock",
    ingress: "Samma princip som offset – men formen liknar ett S.",
    block: [
      { type: "p", text: "En S-bock består av två lika stora bockar. S-måttet är hur mycket röret förskjuts i höjd- eller sidled." },
      { type: "p", text: "En S-bock kan aldrig vara 90° – då blir det en Z-bock. Vid 90° är faktorn 1, och då går röret rakt upp och rakt tillbaka." },
      { type: "formula", rows: [
        { vinkel: "15°", faktor: "3,7", anvandning: "stor S" },
        { vinkel: "30°", faktor: "2,0", anvandning: "vanlig S" },
        { vinkel: "45°", faktor: "1,41", anvandning: "vanlig S" },
      ]},
      { type: "example", text: "60 mm S med 30°-bockar: 60 × 2 = 120 mm mellan markeringarna. Med 45°-bockar: 60 × 1,41 = 84,6 mm." },
      { type: "bullets", items: [
        "Sätt ett startstreck – det kan ligga var som helst, men du måste veta var det är.",
        "Mät upp avståndet och gör ett bockstreck runt hela röret.",
        "Bocka första bocken till vald vinkel.",
        "Vänd röret, lägg bockstrecket mot bockverktygets 0-punkt och bocka andra bocken till samma vinkel.",
      ]},
      { type: "image", exerciseId: "bock-s-bock", caption: "S-bock – två lika stora bockar." },
    ],
  },
  {
    id: "z-bock",
    titel: "Z-bock",
    ingress: "Två 90°-bockar – röret går rakt, svänger 90° och svänger tillbaka.",
    block: [
      { type: "p", text: "En Z-bock är två 90°-bockar. Offsetmåttet är lika med avståndet mellan bockarna, eftersom faktorn vid 90° är 1." },
      { type: "bullets", items: [
        "Används för att komma runt ett hinder eller byta nivå snabbt.",
        "Kontrollera att båda bockarna ligger i samma plan.",
        "Mät cc-måttet mellan bockarna och kontrollera med vinkelhake.",
      ]},
    ],
  },
  {
    id: "u-bock",
    titel: "U-bock / dubbelbock",
    ingress: "Två 90°-bockar i samma plan.",
    block: [
      { type: "p", text: "En U-bock används när röret ska gå upp, över och ner igen. Kontrollera cc-mått, höjd och att benen blir parallella." },
      { type: "image", exerciseId: "bock-dubbel-90", caption: "U-bock med cc-mått och höjd." },
    ],
  },
  {
    id: "svanbock",
    titel: "Svanbock",
    ingress: "Två motriktade bockar med en kort rak del emellan.",
    block: [
      { type: "p", text: "En svanbock används för att komma runt ett hinder eller få ett kort avstånd mellan två rör. Det finns flera sätt att göra den." },
      { type: "p", text: "Ett vanligt sätt är 30° + 30° + 60°: bocka 30°, vänd röret, bocka 30° igen och vänd sedan tillbaka och bocka första bocken till 60°. Resultatet blir en tight svanbock." },
      { type: "image", exerciseId: "bock-svanbock-alt", caption: "Svanbock – alternativ 30/30/60-teknik." },
    ],
  },
  {
    id: "insida",
    titel: "Mäta från insida – seriebock",
    ingress: "Smart när du gör flera bockar efter varandra.",
    block: [
      { type: "p", text: "I stället för att försöka hitta rörets centrum kan du mäta från rörets insida. Då måste du kompensera med halva ytterdiametern." },
      { type: "bullets", items: [
        "12 mm rör → kompensera med 6 mm.",
        "15 mm rör → kompensera med 7,5 mm.",
        "Använd bockverktygets X-markering om den finns – den är gjord för den här mätningen.",
        "Kontrollera cc-måttet efter varje bock.",
      ]},
      { type: "image", exerciseId: "bock-serie-insida", caption: "Seriebock – mät från insidan och kontrollera cc." },
    ],
  },
  {
    id: "fel",
    titel: "Varför blir det fel?",
    ingress: "De vanligaste orsakerna till veck, fel mått och sneda bockar.",
    block: [
      { type: "bullets", items: [
        "Fel rörkvalitet – hårt rör veckar lättare än halvhårt eller värmebehandlat hårt rör.",
        "Bockfjädern är för kort eller för liten, så insidan inte får stöd.",
        "Bocken blir för snäv – röret blir ovalt eller veckar sig.",
        "Röret är inte skävt efter kapning.",
        "Man blandar cc-mått och bockmått, eller centrum och insida.",
        "Man kontrollerar inte efter varje bock – felet förstoras genom hela serien.",
        "Verktyget är slitet eller fel inställt.",
      ]},
      { type: "note", text: "VVS-Forum: Ari Sundelin på Cupori tipsar om värmebehandlade hårda kopparrör (kategori 3) för bockning och pekar på verktygets konstruktion som en vanlig orsak till veck. Anders Pargell/RörmokarLäraren betonar att man ska använda den bocknyckel man är van vid och mäta noga." },
    ],
  },
  {
    id: "kontroll",
    titel: "Kontroll och egenkontroll",
    ingress: "Så vet du att bocken är godkänd.",
    block: [
      { type: "bullets", items: [
        "Bockvinkel ±2°.",
        "cc-mått ±2 mm.",
        "Ovalitet under 10 %.",
        "Inga veck, sprickor eller sträckningar.",
        "Bockarna ligger i samma plan.",
        "Röret är skävt och fritt från grader.",
        "Täthetsprovning är gjord efter anslutning.",
      ]},
    ],
  },
  {
    id: "ordlista",
    titel: "Yrkesspråk – ordlista",
    ingress: "Orden du behöver kunna i verkstaden.",
    block: [
      { type: "bullets", items: [
        "Bockfjäder – fjäder som sticks in i röret och stöttar insidan.",
        "Bocknyckel/rörbock – verktyget som böjer röret.",
        "Bockmått – var märket sätts på röret före bockning.",
        "Bockradie – radien i bocken.",
        "Bockvinkel – vinkeln mellan rörets ben.",
        "cc-mått – centrum till centrum.",
        "Ovalitet – hur mycket röret trycks ihop i tvärsnittet.",
        "Veckbildning – rynkor på insidan av bocken.",
        "Sträckning – materialet sträcks på utsidan.",
        "Skäva – ta bort grader efter kapning.",
        "Glödgning – mjukgöra koppar före bockning.",
        "Fjädrning/springback – röret fjädrar tillbaka några grader.",
        "Neutralaxel – skiktet i röret som behåller sin längd.",
      ]},
    ],
  },
  {
    id: "kallor",
    titel: "Källor och vidare läsning",
    ingress: "Använd gärna källorna för fördjupning.",
    block: [
      { type: "bullets", items: [
        "RörmokarLäraren (Anders Pargell), YouTube: ”Svan och s bock”, ”En annan variant på nästa bock” och ”Tavlan”.",
        "VVS-Forum: ”Välj det här röret om du vill undvika veck vid bockning” (2025-08-18).",
        "VVS-Forum: ”Det här kan vara orsaken till att bockningen blir fel” (2021-11-17).",
        "VVS-Forum: ”Rörmokaren älskar bockning” (2024-05-27).",
        "VVS-Forum: ”VVS-företagarens hack: fixeringsbräda för rätt röravstånd” (2026-02-26).",
        "Wikipedia: ”Tube bending” – neutralaxel, ovalitet och springback.",
      ]},
      { type: "note", text: "Det här är appens egna sammanfattningar för undervisning. Kontrollera alltid mot din bockverktygstillverkares anvisning och skolans rutiner." },
    ],
  },
];
