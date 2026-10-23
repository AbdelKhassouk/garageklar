# GarageKlar — hjemmeside

Statisk hjemmeside. Ren HTML, CSS og JavaScript — ingen frameworks, ingen
byggeproces. Filerne kan lægges direkte op på et hvilket som helst webhotel.

**Live:** <https://www.garageklar.dk>

Siden ligger på GitHub Pages (repoet `AbdelKhassouk/garageklar`, grenen `main`) med
domænet `www.garageklar.dk`. Domænet og DNS ligger hos DanDomain (abonnement: DNS
Hotel). `garageklar.dk` uden www sendes videre til www. Alle `canonical`-tags
peger på `https://www.garageklar.dk`. En push til `main` går live med det samme.

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
  om-os/                 "Vores drøm" — samme sektion som på forsiden
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
- **Dansk dato.** Ønsket dato står i mailen som `11/6-2026 (torsdag)` — ikke som
  browserens `2026-06-11`. Er datoen ikke udfyldt, står der `Ikke oplyst`.
- **Tjek af e-mail.** Feltet er frivilligt, men Formspree afviser hele
  forespørgslen, hvis adressen er skrevet forkert. Derfor tjekkes den, før der
  sendes.

Formspree-kontoen hedder "Garage Klar", og mails fra formularen går til
**garageklar@hotmail.com** (indstillet i Formspree — ikke i koden). Kontoen kører
på **Personal-planen** (købt 16. oktober 2026): 200 indsendelser om måneden for
de to formularer tilsammen. Bliver grænsen nået, gemmer Formspree indsendelserne
uden at sende mail.

#### Billeder i bestillingsformularen

**Billeder virker.** Testet på www.garageklar.dk den 16. oktober 2026: en
forespørgsel med et billede gik igennem i første forsøg, og billedet ligger på
forespørgslen i Formspree. Kunden ser ingen besked om manglende billeder.

Før opgraderingen svarede Formspree `400 File Uploads Not Permitted` og afviste
**hele** forespørgslen, når der var billeder med — derfor kom billederne ikke
med. Billeder kræver altså, at abonnementet er betalt. Formularen tager stadig
højde for, at det kan gå galt:

- Bliver en forespørgsel med billeder afvist, sendes den automatisk én gang til
  **uden** billeder, og kunden bliver bedt om at maile dem. Forespørgslen går
  aldrig tabt. Feltet `billeder_status` i mailen fortæller, hvad der skete. Står
  der "formularens abonnement hos Formspree tager ikke imod filer", er
  abonnementet udløbet.
- Billederne gøres mindre i browseren, før de sendes (længste side 1920 px,
  typisk under 1 MB pr. billede). Formspree afbryder en afsendelse, der varer
  over 30 sekunder, så det afgør, om billederne når frem på mobilnet.
- På telefonen er der to knapper: **Tag et billede** (kameraet) og **Vælg
  billeder** (billeder, der allerede ligger på telefonen). Før åbnede kameraet
  direkte, så man ikke kunne vælge et billede, man havde taget i forvejen.
- Filer, der ikke kommer med (ikke et billede, for mange, for store), bliver
  nævnt i en rød linje under boksen. HEIC-billeder fra iPhone godtages, også når
  browseren ikke selv kan vise dem.

Billederne kommer som **links i mailen**, ikke som vedhæftede filer, og de ligger
hos Formspree i USA. Formspree skriver ikke, hvor længe linkene virker. Billederne
kan altid hentes i Formspree under formularen → Submissions (kræver login).
Kontoen har 1 GB til billeder; når den er fuld, sletter Formspree de ældste filer
først — gem de billeder, I skal bruge, i sagen. Tallene (antal billeder,
størrelse, ventetid) står øverst i `assets/js/main.js`. "Maks 5 billeder" står
også som tekst i `bestilling.html` — ret begge steder.

Opsiger I abonnementet, så erstat upload-blokken i `bestilling.html` (den
`<div>`, der starter lige efter kommentaren `<!-- billedupload`) med en linje om
at sende billederne på mail. Scriptet klarer sig uden boksen.

Ikke afprøvet endnu: en rigtig iPhone og en rigtig Android-telefon. Koden er
testet i Chrome på computer med en efterlignet telefon.

### 2. Udfyld de manglende oplysninger

| Hvor | Hvad mangler |
|---|---|
| Trustpilot-verifikation | Tryk **"Verificér domæne"** hos Trustpilot, når HTTPS virker på garageklar.dk (se "Trustpilot-verifikation") |
| Trustpilot | **Profilen findes ikke offentligt endnu** — de to knapper på forsiden giver "siden findes ikke", indtil domænet er verificeret (se "Trustpilot") |
| `index.html` + footer | **YouTube-URL** (står nu som `@garageklar`). Facebook, Instagram og TikTok er rigtige. |
| `assets/js/main.js` | **`YOUTUBE_ABONNENTER`** — antal abonnenter til roadmappen i "Vores drøm" |

### 3. Trustpilot

Sektionen "Hvad siger vores kunder?" på forsiden er et mørkt kort med to knapper
— **Skriv en anmeldelse** og **Se vores profil** — og tre trin, der viser, hvordan
man gør.

Der er **med vilje hverken eksempel-anmeldelser, Trustpilot-logo eller stjerner**
på siden:

- Opdigtede anmeldelser og stjerner uden rigtige anmeldelser er vildledende efter
  markedsføringsloven. De fem grønne stjerner, der stod før, viste en bedømmelse,
  som ikke findes.
- Trustpilots varemærkeregler tillader ikke hjemmelavede udgaver af deres logo og
  stjerner ("The Customer may not use other variations of Trustpilot Designs").

Når I har fået anmeldelser, kan Trustpilots egen widget (TrustBox) sættes ind i
`<div id="trustbox">` i `index.html`. Den viser de rigtige stjerner og
anmeldelser. Se afsnittet om cookies, før den sættes ind.

⚠ Den 13. oktober 2026 svarede både `dk.trustpilot.com/review/garageklar.dk` og
`dk.trustpilot.com/evaluate/garageklar.dk` med "siden findes ikke". Knapperne
virker først, når profilen er aktiv — se "Trustpilot-verifikation" længere nede.
**Tjek begge knapper, før siden går live.**

### 4. Cookies

Meta Pixel **2461409487713869** måler sidevisninger (`PageView`) efter et
frivilligt samtykke til markedsføring. Intet Meta-script og ingen Pixel-anmodninger
indlæses før accept. Der sendes ingen formularoplysninger eller særlige
lead-/formularhændelser, og avanceret matching bruges ikke.

Banneret har både accept og afvisning. **Cookieindstillinger** i footeren åbner
valget igen. Et ja eller nej huskes på eget domæne i localStorage under
`garageklar.marketing-consent.v1` som `{marketing: boolean, updatedAt: ISO-dato}`.
Valget udløber efter **180 dage**. Ved tilbagetrækning genindlæses siden uden
pixlen, og dens `_fbp`- og `_fbc`-cookies på eget domæne slettes. Allerede
overførte oplysninger og cookies på Metas egne domæner slettes ikke af dette.

Meta kan modtage IP-adresse, browser-/enhedsoplysninger, sidens URL,
henvisningsside og cookieidentifikatorer. `cookiepolitik.html` og
`persondatapolitik.html` beskriver brugen. I Metas Events Manager skal automatisk
avanceret matching og automatisk registrering af hændelser være slået fra, så
indstillingerne fortsat svarer til sidens begrænsede brug af pixlen.

Skrifttyper, billeder og video ligger fortsat på sitet selv. Tilføjes andre
tjenester, fx Google Analytics, Trustpilot-widget eller indlejrede
YouTube-videoer, skal deres samtykke og beskrivelser vurderes særskilt.

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

### Åbningstider

Åbningstiderne står fire steder — alle med teksten "Mandag – Fredag: Kl. 9–17" og
"Lørdag & Søndag: Lukket". Ændres de, skal de rettes alle steder:

- footeren på alle sider (`fod__tider`)
- menuen på alle sider (`menu__tid`)
- det mørke "Ring til os"-kort på `kontakt/index.html`
- den strukturerede data øverst i `index.html` og `kontakt/index.html`
  (`openingHoursSpecification`)

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

Skal et tal ændres, så ret `FRA_PRISER` i `assets/js/main.js` og **søg derefter
efter det gamle beløb i alle `.html`-filer** — i alle skrivemåder (fx `595`,
`1.195` og `1195`) — og ret hvert sted. Beløbet står blandt andet i:

- prislisten og spørgsmål/svar på `/priser/` (tekst og struktureret data)
- ydelsessidens titel, beskrivelse, strukturerede data (`price`/`minPrice`) og
  prisboks (`moerkkort__pris`, fx `<span>Fra</span> 595 kr.`)
- prisboksen på de fem bysider, som viser garagens fra-pris (595 kr.)

Tekster om den laveste pris ("fra 595 kr." på forsiden, kontaktsiden, i
bysidernes beskrivelser og i `handelsbetingelser.html` punkt 3) skal kun rettes,
hvis den laveste pris ændrer sig.

Prisboksen på ydelses- og områdesiderne er det samme mørke kort som "Ring til
os" på kontaktsiden (klassen `moerkkort` i `style.css`). Rubrikken "Fast pris,
før vi går i gang" og noten om "to mand" er skrevet ud for hver side, så hver
side beholder sin egen tekst — ret dem direkte i siden.

---

## Mangler fra jer

### To billeder til galleriet

| Billede | Hvor | Status |
|---|---|---|
| Kælderrum - Før | Før/efter-galleriet, plads nr. 6 | Ikke uploadet |
| Kælderrum - Efter | Før/efter-galleriet, plads nr. 6 | Ikke uploadet |

Læg `kaelderrum-foer.jpg`, `kaelderrum-foer.webp`, `kaelderrum-efter.jpg` og
`kaelderrum-efter.webp` i `assets/img/foer-efter/` (kvadratiske, 900 × 900,
beskåret helt ens) og fjern `//`-tegnene omkring den sidste linje i `FE`-listen i
`assets/js/main.js`.

⚠ Galleriet står i dag som en **diamant** — tre kort øverst, to forskudt
nedenunder. Den opstilling gælder kun ved præcis fem kort. Kommer kælderrum ind
som nr. 6, falder galleriet automatisk tilbage til et almindeligt 3 + 3-gitter.

Billedet af Kasper og Kristian er skiftet. Det er hentet ud af ønskedokumentets
PDF, fordi det aldrig blev lagt i Drive-mappen, og det er derfor kun 788 × 591 px.
Det er skarpt nok til den plads, det fylder, men ikke til skærme med dobbelt
opløsning. Send originalen, hvis den skal være knivskarp — så lægger jeg den ind
som `assets/img/team/kasper-kristian.jpg` (+ `.webp`), beskåret 4 : 3.

### Antal YouTube-abonnenter

```js
YOUTUBE_ABONNENTER: null,   // i assets/js/main.js
```

Så længe det er `null`, er chippen "Abonnenter i dag" skjult, alle cirkler på
roadmappen er tomme, og vejen er grå hele vejen. Sæt tallet (fx
`YOUTUBE_ABONNENTER: 340`), så sker der tre ting af sig selv: tallet vises,
de passerede milepæle bliver røde, og vejen farves rød frem til den seneste.

Husk samtidig at rette YouTube-URL'en — den står stadig som `@garageklar`.

### Trustpilot-verifikation

Trustpilot vil se filen `60621c00-6c6f-4aed-91ea-bce8a0333001.html` i sidens rod,
så `https://garageklar.dk/60621c00-6c6f-4aed-91ea-bce8a0333001.html` svarer.

Filen lå ikke i den delte Drive-mappe, men den behøver ikke blive sendt.
Trustpilots egen kode laver filen i browseren, og indholdet er altid filnavnet
uden `.html` — 36 tegn, uden linjeskift og uden HTML omkring. Den kan altså
oprettes præcist (i Git Bash, stående i sidens rod):

```
printf '%s' '60621c00-6c6f-4aed-91ea-bce8a0333001' > 60621c00-6c6f-4aed-91ea-bce8a0333001.html
```

Filen **ligger nu i roden** og er lavet sådan. Når HTTPS på domænet er
aktivt, skal I trykke **"Verificér domæne"** hos Trustpilot.

- Filen gælder kun **én måned**, fra den blev lavet hos Trustpilot. Den stod i
  ønskedokumentet den 9. oktober 2026, så den udløber senest omkring den 9.
  november. Viser Trustpilot et andet filnavn, er reglen den samme: indholdet er
  filnavnet uden `.html`.
- Filen må gerne slettes igen, når domænet er verificeret.

Virker filen ikke, så brug **"Verificér med DNS"** hos Trustpilot i stedet.
Kopiér den linje, Trustpilot viser (`trustpilot-one-time-verification-id=…`), og
opret den som en TXT-record på domænet i DanDomains kundecenter under
DNS-administration.

### Webhotel i persondatapolitikken

Siden ligger på GitHub Pages, og `persondatapolitik.html` nævner nu GitHub, Inc.
som webhotel. Flytter siden et andet sted hen, skal de to afsnit lige efter
kommentaren i filen skiftes ud. Begge tekster står herunder.

GitHub Pages (bruges nu):

```html
<p>Vores hjemmeside ligger hos <strong>GitHub, Inc.</strong> (tjenesten GitHub Pages), som er hjemmehørende i USA. Hjemmesiden har ingen database, så de oplysninger, du skriver i vores formularer, bliver ikke gemt hos GitHub — de sendes til os via vores formularudbyder som beskrevet ovenfor.</p>
<p>Når du besøger hjemmesiden, modtager GitHub de tekniske oplysninger, der er nødvendige for at vise siden: din IP-adresse, tidspunktet for besøget, hvilke sider og filer der hentes, og oplysninger om din browser og enhed. GitHub oplyser, at IP-adressen bliver logget og gemt af sikkerhedshensyn. GitHub behandler oplysningerne efter sine egne vilkår og sin egen <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener">privatlivspolitik</a>, og de kan blive behandlet uden for EU/EØS, herunder i USA. GitHub er certificeret under EU-U.S. Data Privacy Framework, som EU-Kommissionen har vurderet giver et tilstrækkeligt beskyttelsesniveau. Vi bruger ikke oplysningerne til statistik eller markedsføring.</p>
```

DanDomain, hvor domænet ligger:

```html
<p>Vores hjemmeside ligger på et webhotel hos <strong>Dandomain A/S</strong>, Højvangen 4, 8660 Skanderborg, CVR-nr. 29412006, som fungerer som vores databehandler. Hjemmesiden har ingen database, så de oplysninger, du skriver i vores formularer, bliver ikke gemt på webhotellet — de sendes til os via vores formularudbyder som beskrevet ovenfor.</p>
<p>Når du besøger hjemmesiden, behandler Dandomain på vores vegne de tekniske oplysninger, der er nødvendige for at vise siden og beskytte den mod misbrug: din IP-adresse, tidspunktet for besøget, hvilke sider og filer der hentes, og oplysninger om din browser og enhed. Oplysningerne opbevares i Dandomains datacentre i Danmark. Vi bruger dem ikke til statistik eller markedsføring.</p>
```

Værd at vide, før I vælger:

- **GitHub Pages** er gratis og kører allerede. Men GitHubs vilkår siger, at Pages
  ikke er beregnet til at drive forretning på, GitHub tilbyder ingen
  databehandleraftale til gratis konti, og besøgendes IP-adresser bliver logget
  af et amerikansk firma. Sætningen "Vi har indgået databehandleraftaler med
  vores databehandlere" lige under afsnittet passer så ikke på webhotellet. Koden
  skal ligge offentligt, og denne README kan læses af alle på `/README.md`.
- **Et dansk webhotel** — fx DanDomain, hvor domænet i forvejen ligger — koster et
  abonnement, men giver en databehandleraftale, datacentre i Danmark og en aftale
  i jeres eget navn. DanDomains prisliste viser "Kontakt os"; deres egne prisdata
  siger 29 kr. om måneden i første periode og 159 kr. derefter, ekskl. moms — få
  det bekræftet, før I bestiller. Filerne lægges op med FTP. `README.md`,
  `.gitignore`, `.gitattributes`, `.nojekyll` og `kilde-materiale/` skal ikke med.

Dette er udviklerens gennemgang, ikke juridisk rådgivning.

---

## Vores drøm

Sektionen findes to steder og er **ens begge steder**: på forsiden og på siden
`/om-os/`, som nu hedder "Vores drøm" i menuen og i footeren. URL'en er stadig
`/om-os/`, så gamle links ikke knækker.

Ændrer I teksten, skal den rettes **begge steder**.

### Roadmappen

På bred skærm er den én vandret linje. På mobil (under 760 px) snor vejen sig som
et S — tre rækker med to milepæle i hver, og målet nederst. Rækkefølgen er
med vilje 100, 200, **500, 1.000**, 10.000, 50.000: anden række læses fra højre
mod venstre, fordi vejen vender der.

Vejen er en SVG-sti i `index.html` og `om-os/index.html`. Cirklerne er placeret med
CSS på **de samme procentkoordinater** som stien (venstre spor 24 %, højre spor 62 %,
målet 43 %, rækkerne på 6 %, 31 %, 56 % og 81 %). Flytter I det ene, skal det andet
med — ellers ligger cirklerne ved siden af vejen.

Målet 100.000 har rød kant og rødt tal, men **tom cirkel** — der er ingen mål nået
endnu. Cirklen fyldes først, når `YOUTUBE_ABONNENTER` er sat højt nok.

---

## Rettet på de juridiske sider

Tre ting på persondatapolitikken og cookiepolitikken passede ikke med, hvad siden
faktisk gør. De er rettet — **læs dem igennem, før siden går i luften:**

1. **Tredjelandsoverførsel.** Begge sider sagde, at der ikke sendes persondata ud
   af EU. Det passer ikke: formularerne sender gennem Formspree, Inc. i USA, så
   navn, telefon, adresse og vedhæftede billeder behandles uden for EU/EØS. Det
   står der nu, med henvisning til EU-Kommissionens standardkontraktbestemmelser
   (Formspree har ingen offentlig databehandleraftale — se nederst).

2. **Cookiepolitikkens brødtekst** var ubearbejdet skabelontekst og blev tidligere
   begrænset til formularer og webhotel. Den er nu opdateret sammen med
   persondatapolitikken til også at beskrive Meta Pixel efter samtykke til markedsføring.

3. **To forskellige mailadresser.** De juridiske sider bad kunder sende
   indsigts- og sletteanmodninger til `garageklar@hotmail.com`, mens resten af
   sitet bruger `Kundeservicegarageklar@hotmail.com`. Nu bruges den samme
   adresse overalt. ⚠ **Bekræft at det er den rigtige** — ellers lander GDPR-
   anmodninger et sted, ingen læser.

Rettet i sidste runde (ønskedokument 21):

4. **Cookiesiden** beskrev tidligere ingen cookies. Efter tilføjelsen af Meta
   Pixel beskriver den nu forudgående samtykke, den lokale lagring af valget,
   markedsføringscookies og muligheden for at trække samtykket tilbage.
5. **Webhotellet** er beskrevet i persondatapolitikken uden navn (se "Webhotel i
   persondatapolitikken"). Cookiesiden skrev, at der ikke opsamles IP-adresser —
   det gør ethvert webhotel, så den sætning er rettet.

Webhotellet er nu nævnt ved navn (GitHub, Inc.).

Bør læses igennem af jer — eller en jurist — før siden går live. Det er ikke
rettet, fordi det er jeres tekst og jeres valg:

- Persondatapolitikken nævner betalingsoplysninger, ordrebekræftelse og
  leveringsbekræftelse. Siden tager ikke imod betaling og sender ingen af delene.
- Persondatapolitikken siger, at oplysninger slettes efter 5 år. Cookiesiden
  siger, at der ikke kan gives en tidsramme. Vælg én regel.
- Sætningen om, at navn og e-mail bliver overført til Trustpilot, passer kun, hvis
  I selv sender kundeoplysninger til Trustpilot (fx invitationer). Følger kunden
  bare linket, overfører I ingenting.
- Formspree skriver selv, at de bruger EU's standardkontrakter, men en egentlig
  databehandleraftale ligger ikke offentligt. Persondatapolitikken nævner derfor
  nu kun standardkontrakterne. Bed Formspree om en databehandleraftale, og skriv
  den ind, når I har den.
- Sætningen "Vi har indgået databehandleraftaler med vores databehandlere …" er
  fjernet fra persondatapolitikken (oktober 2026), fordi der i dag ikke er
  aftaler med Formspree, GitHub eller Hotmail. Indgå aftalerne, og sæt den ind
  igen, når de er på plads.
- Henvendelser lander i en Hotmail-indbakke. Datatilsynet regner mailudbydere som
  databehandlere, og den almindelige Hotmail-aftale har ingen databehandleraftale.
  En firmamail på eget domæne løser det.

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

Testet i Chrome på desktop (1440 px) og mobil (390 px), samt en gennemløbning af
alle bredder mellem 940 og 1400 px for at sikre, at knappen i tilbudsboksen ikke
flytter sig, uanset hvilken opgavetype man vælger:
ingen konsolfejl, ingen manglende filer, ingen vandret scroll på mobil.
Tastaturnavigation, fokusfælde i menu og popup, Escape-lukning og formularvalidering
virker. Der er skip-link, `aria`-mærkning og understøttelse af
`prefers-reduced-motion`.
