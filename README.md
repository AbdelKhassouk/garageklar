# GarageKlar — hjemmeside

Statisk hjemmeside. Ren HTML, CSS og JavaScript — ingen frameworks, ingen
byggeproces. Filerne kan lægges direkte op på et hvilket som helst webhotel.

**Forhåndsvisning:** <https://abdelkhassouk.github.io/garageklar/>

Forhåndsvisningen kører på GitHub Pages og er kun til gennemsyn. Alle `canonical`-tags
peger på `https://www.garageklar.dk`, så forhåndsvisningen bliver ikke indekseret af
Google og kommer ikke til at konkurrere med det rigtige domæne.

---

## Sådan ser du siden

Dobbeltklik på `index.html`, eller kør en lokal server for at få alt til at virke
(video og formularer opfører sig bedst over http):

```
python -m http.server 8000
```

Åbn derefter <http://localhost:8000>.

---

## Filer

```
index.html                Forsiden (one page — alle sektioner)
bestilling.html           Trin 2: "Udfyld resten & send"  (noindex)
404.html
sitemap.xml, robots.txt

Ydelsessider (SEO-landingssider)
  garagerydning/
  udhus-og-anneks/
  doedsborydning/
  erhvervsrydning/
  indkoersel-og-udearealer/
  fliserensning/          Tilkøb — fast pakkepris, ikke timepris

Øvrige sider
  priser/                 Prismodel + beregner
  omraader/               Oversigt over dækningsområde
  om-os/
  kontakt/

Områdesider
  rydningsfirma-herning/
  rydningsfirma-ikast/
  rydningsfirma-silkeborg/
  rydningsfirma-holstebro/
  rydningsfirma-viborg/

Juridisk
  handelsbetingelser.html
  persondatapolitik.html
  cookiepolitik.html

assets/
  css/style.css           Al styling. Farver og mål ligger som variabler øverst.
  js/main.js              Al interaktion. Konfiguration ligger øverst i filen.
  fonts/                  Outfit + Inter, hostet lokalt (ingen Google-CDN)
  img/brand/              Logo (lys + mørk), ikon, favicons
  img/foer-efter/         10 billeder — 5 opgaver × før/efter
  img/team/               Kristian, Kasper og fælles billede
  img/ydelser/            Billeder til Private / Erhverv / CTA-bånd
  img/danmark.svg         Kort med Herning markeret
  video/                  Web-optimerede videoer + posterbilleder

kilde-materiale/          Originale fotos og videoer fra jer.
                          ⚠ Skal IKKE uploades til webhotellet (ca. 110 MB).
```

---

## Skal gøres, før siden går i luften

### 1. Formularerne — Formspree

Begge formularer sender til Formspree:

```js
FORM_ENDPOINT: "https://formspree.io/f/myegjgqg"
```

Skal modtageren skiftes, er det den ene linje i toppen af `assets/js/main.js`.
Sættes den til `""`, kører formularerne i demo-tilstand (validerer og viser
kvittering, men sender ingenting).

Der er indbygget:

- **Honeypot** (`_gotcha`) på begge formularer — Formspree kasserer automatisk
  indsendelser, hvor feltet er udfyldt. Det stopper de fleste simple spambots.
- **`_subject`**, så mails lander med en læsbar emnelinje.

⚠ **Vedhæftede billeder kræver et betalt Formspree-abonnement.** På gratisplanen
bliver filerne ikke sendt med — resten af formularen kommer stadig igennem.
Tjek at I får billederne med, første gang I tester bestillingsformularen.

Bekræft desuden afsender-mailen i Formspree, ellers ender indsendelserne ingen
steder.

### 2. Udfyld de manglende oplysninger

| Hvor | Hvad mangler |
|---|---|
| Alle sider (footer) | **CVR-nummer** — der står `11223344`, som ser ud til at være en pladsholder |
| `persondatapolitik.html` | Navnet på **webhotel/hostmaster** (markeret i en gul boks på siden) |
| `index.html` | **Trustpilot TrustBox** — indsæt jeres widget-kode i `<div id="trustbox">` |
| `index.html` + footer | **YouTube- og Facebook-URL** (står nu som `@garageklar` / `/garageklar`) |

### 3. Trustpilot-anmeldelser

Der er **bevidst ikke skrevet eksempel-anmeldelser** ind i koden. Opdigtede
anmeldelser er ulovlige efter markedsføringsloven. Så snart I opretter profilen på
Trustpilot, henter widgetten automatisk de rigtige anmeldelser ind.

### 4. Cookies

Siden sætter i sin nuværende form **ingen cookies**, og skrifttyperne er hostet
lokalt — derfor er der ikke behov for en cookiebanner endnu.

Tilføjer I senere Google Analytics, Meta Pixel, Trustpilot-widget eller indlejrede
YouTube-videoer, **skal** der sættes en cookiebanner op med forudgående samtykke, og
afsnittet om tredjeparter i `cookiepolitik.html` skal opdateres.

---

## Ting der er værd at kende

### Prisen ligger ét sted

```js
TIMEPRIS: 1195,    // kr. inkl. moms, pr. påbegyndt time
MIN_TIMER: 1,      // ingen minimumsopgave
START_TIMER: 2,    // beregnerens udgangspunkt
MAKS_TIMER: 40,
```

Ændrer I `TIMEPRIS`, husk at rette de steder, tallet også står som tekst:
prissektionen og beregnerens overskrift i `index.html`.

### Farver

Alle farver ligger som CSS-variabler i toppen af `style.css`. Brandrøden
(`--roed: #ed1a21`) er pipettet direkte fra jeres logo.

### Før/efter-billeder

Listen står i toppen af `main.js`:

```js
var FE = [
  { slug: "bryggers", titel: "Bryggers / depot", sted: "Privat bolig" },
  ...
];
```

Tilføj en ny opgave ved at lægge `NAVN-foer.jpg`, `NAVN-foer.webp`,
`NAVN-efter.jpg` og `NAVN-efter.webp` i `assets/img/foer-efter/` og skrive en linje
mere i listen. Billederne skal være kvadratiske.

### Videoer

`hero.mp4` (2,3 MB) hentes først, når resten af siden er indlæst, og springes helt
over, hvis brugeren er på en langsom forbindelse eller har slået animationer fra.
Indtil da vises posterbilledet.

---

## Fliserensning — bemærk prisen

Ønskedokumentet indeholder **to forskellige priser** på fliserensning:

1. Tidligt i afsnittet: *44 kr. pr. m², minimumspris 1.500 kr.*
2. Senere, med pakkeindhold: *2.000 kr. for op til 36 m², derefter 45 kr. pr. m².*

Siden bruger **nr. 2**, da den står sidst og er den mest detaljerede — sammen med
pakken (rensning, fugerensning, No Grow-sand) og imprægnering som tilkøb til
1.000 kr. Bekræft gerne, at det er den rigtige.

---

## SEO

- Hver side har sin egen `<title>`, `description` og `canonical` — ingen dubletter.
- `sitemap.xml` og `robots.txt` ligger i roden. `bestilling.html` er sat til
  `noindex`, da den kun giver mening midt i et flow.
- Struktureret data (JSON-LD): `LocalBusiness` på forsiden, kontakt og
  områdesider, `Service` på ydelsessider, `FAQPage` hvor der er spørgsmål, og
  `BreadcrumbList` på alle undersider.
- Alle canonicals peger på `https://www.garageklar.dk`. Ligger siden midlertidigt
  et andet sted (fx GitHub Pages), bliver den derfor ikke indekseret — det er med
  vilje. Skift domænet i alle `canonical`- og `og:url`-tags samt `sitemap.xml`,
  hvis I lander på et andet domæne.

**Om områdesiderne:** de fem bysider er skrevet med hver deres indhold, men de
ligner uundgåeligt hinanden i opbygningen. Google slår ned på "doorway pages" —
mange næsten ens sider, der kun adskiller sig ved et bynavn. Gør dem stærkere over
tid ved at lægge rigtige før/efter-billeder fra opgaver i den enkelte by ind,
sammen med anmeldelser fra lokale kunder. Lad være med at oprette flere bysider,
før I har rigtigt indhold at fylde i dem.

---

## Test

Testet i Chrome på desktop (1440 px) og mobil (390 px):
ingen konsolfejl, ingen manglende filer, ingen vandret scroll på mobil.
Tastaturnavigation, fokusfælde i menu og popup, Escape-lukning og formularvalidering
virker. Der er skip-link, `aria`-mærkning og understøttelse af
`prefers-reduced-motion`.
