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
  kaelderrum/

Øvrige sider
  priser/                 Prisliste + tilbudsboks
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
  img/foer-efter/         10 billeder — 5 opgaver × før/efter (diamantopstilling)
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
| `persondatapolitik.html` | Navnet på **webhotel/hostmaster** (markeret i en gul boks på siden) |
| `index.html` | **Trustpilot TrustBox** — indsæt jeres widget-kode i `<div id="trustbox">` |
| `index.html` + footer | **YouTube- og Facebook-URL** (står nu som `@garageklar` / `/garageklar`) |
| `assets/js/main.js` | **`YOUTUBE_ABONNENTER`** — antal abonnenter til roadmappen i "Vores drøm" |

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

### Priserne ligger ét sted

```js
FRA_PRISER: {
  "Garage":         595,
  "Carport":        595,
  "Indkørsel":      595,
  "Udhus / skur":   995,
  "Anneks":         995,
  "Kælderrum":     1195,
  "Dødsbo":        2495,
  "Erhvervslokale": null,   // null giver "Kontakt os"
  "Andet":          null
}
```

Det er priserne i tilbudsboksen ("Få et gratis tilbud"). De styrer både det store
tal i det hvide kort og "Fra ___ kr." i den mørke rubrik — begge steder skifter,
når kunden vælger opgavetype.

⚠ **Prislisten på `/priser/` er en anden.** Den står som almindelig tekst i
`priser/index.html` under overskriften "Hvad koster det?", fordi I har oplyst
andre tal til den. Se afsnittet **To forskellige prislister** nedenfor.

Tilbudsboksen regner ikke længere en pris ud. Mængde og tillæg sendes blot med
videre til trin 2, så I kan give en fast pris ud fra oplysningerne.

### Farver

Alle farver ligger som CSS-variabler i toppen af `style.css`. Brandrøden
(`--roed: #ed1a21`) er pipettet direkte fra jeres logo.

### Før/efter-billeder

Listen står i toppen af `main.js`:

```js
var FE = [
  { slug: "bryggers", titel: "Udhus", sted: "Privat bolig" },
  ...
];
```

Tilføj en ny opgave ved at lægge `NAVN-foer.jpg`, `NAVN-foer.webp`,
`NAVN-efter.jpg` og `NAVN-efter.webp` i `assets/img/foer-efter/` og skrive en linje
mere i listen. Billederne skal være **kvadratiske og beskåret ens**, så motivet
flugter, når man trækker i slideren.

### Videoer

`hero.mp4` (2,3 MB) hentes først, når resten af siden er indlæst, og springes helt
over, hvis brugeren er på en langsom forbindelse eller har slået animationer fra.
Indtil da vises posterbilledet.

---

## Priserne

Ét sæt fra-priser, inkl. moms — brugt både i prislisten på `/priser/`, i
tilbudsboksen og på ydelsessiderne:

| Ydelse | Fra |
|---|---|
| Garage | 595,- |
| Carport | 595,- |
| Indkørsel | 595,- |
| Udhus / skur | 995,- |
| Anneks | 995,- |
| Kælderrum | 1.195,- |
| Dødsbo | 2.495,- |
| Erhvervslokale | Kontakt os |

Skal et tal ændres, skal det rettes **tre steder**: `FRA_PRISER` i
`assets/js/main.js`, prislisten i `priser/index.html` og prisboksen på den
pågældende ydelsesside (`sidekort__pris` samt `price`/`minPrice` i den
strukturerede data i toppen af filen).

---

## Mangler fra jer

### Tre billeder

Nævnt i ønskedokumenterne, men ligger hverken i projektet eller i Drive-mappen
**Content (Billeder/Videoer)** — tjekket igen 1. oktober:

| Billede | Hvor det skal bruges | Status |
|---|---|---|
| Kasper og Kristian - Om os | `Vores drøm` på forsiden og `/om-os/` | Ikke uploadet |
| Kælderrum - Før | Før/efter-galleriet, plads nr. 6 | Ikke uploadet |
| Kælderrum - Efter | Før/efter-galleriet, plads nr. 6 | Ikke uploadet |

Pladserne er klar. Når billederne kommer:

- **Om os-billedet:** læg filen som `assets/img/team/kasper-kristian.jpg`
  (+ `.webp`), samme udsnit som nu (1184 × 880). Så skifter den begge steder
  af sig selv.
- **Kælderrum:** læg `kaelderrum-foer.jpg`, `kaelderrum-foer.webp`,
  `kaelderrum-efter.jpg` og `kaelderrum-efter.webp` i `assets/img/foer-efter/`
  (kvadratiske, 900 × 900, beskåret helt ens) og fjern `//`-tegnene omkring den
  sidste linje i `FE`-listen i `assets/js/main.js`.

  ⚠ Galleriet står i dag som en **diamant** — tre kort øverst, to forskudt
  nedenunder. Den opstilling gælder kun ved præcis fem kort. Kommer kælderrum
  ind som nr. 6, falder galleriet automatisk tilbage til et almindeligt
  3 + 3-gitter. Det sker af sig selv, men så er diamanten væk.

Der er **bevidst ikke sat et midlertidigt eller AI-genereret billede** ind i
galleriet. Overskriften siger "fra rigtige opgaver".

### Antal YouTube-abonnenter

"Vores drøm" har en roadmap mod 100.000 abonnenter. Tallet for, hvor I er i
dag, står ikke nogen steder — så det er ikke gættet:

```js
YOUTUBE_ABONNENTER: null,   // i assets/js/main.js
```

Så længe det er `null`, er chippen "Abonnenter i dag" skjult, og ingen milepæle
er markeret som nået. Sæt tallet (fx `YOUTUBE_ABONNENTER: 340`), så vises det,
og de milepæle I har passeret, bliver røde.

Husk samtidig at rette den rigtige YouTube-URL — den står stadig som
`@garageklar` i footeren, i heroen og på knappen i "Vores drøm".

---

## Vores drøm

Sektionen på forsiden (tidligere "Om os") er bygget efter jeres eget oplæg:
overskrift, tre kort, roadmap og et afsluttende bånd. Billedet af Kasper og
Kristian er beholdt til venstre, som I bad om.

Teksten fra den gamle Om os-sektion er væk fra forsiden, men **siden
`/om-os/` findes stadig uændret** og ligger fortsat i menuen. Sig til, hvis den
også skal laves om.

---

## Handelsbetingelserne

Punkt 3 (Tilbud og pris) er skrevet om til fast pris, og der er indsat et nyt
punkt 4 (Ændringer og uforudsete forhold). Alle punkter derefter er rykket ét
nummer op, og tilfredshedsgarantien er endt som **punkt 16** — ikke 15 som i
ønskedokumentet, netop fordi det nye punkt 4 kom ind foran. Det gamle punkt 15
om fliserensning er slettet. Tilfredshedsgarantien har en frist på 14 dage efter opgavens afslutning.

Ændres nummereringen igen, så husk at der ikke er nogen indholdsfortegnelse at
rette med — numrene står kun i overskrifterne.

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
