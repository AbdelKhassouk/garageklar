/* =========================================================================
   GarageKlar — main.js
   Alt interaktivt på siden. Ingen eksterne biblioteker.
   ========================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     KONFIGURATION  —  ret her, når backend/formularmodtager er på plads
     --------------------------------------------------------------------- */
  var KONFIG = {
    // Formspree-endpoint. Sættes den til "", kører formularerne i demo-tilstand:
    // de validerer og viser kvittering, men sender ingenting.
    FORM_ENDPOINT: "https://formspree.io/f/myegjgqg",

    // Ekstra felter der sendes med (fx en access key hos andre udbydere)
    FORM_EKSTRA: {},

    /* "Fra"-priser pr. opgavetype, kr. inkl. moms.
       null betyder, at der ikke sættes en pris — kunden får "Kontakt os". */
    FRA_PRISER: {
      "Garage":         595,
      "Carport":        595,
      "Indkørsel":      595,
      "Udhus / skur":   995,
      "Anneks":         995,
      "Kælderrum":     1195,
      "Dødsbo":        2495,
      "Erhvervslokale": null,
      "Andet":          null
    },

    /* Antal YouTube-abonnenter til "Vores drøm".
       Sæt tallet, når I kender det — så vises "Abonnenter i dag", og de
       milepæle, I har passeret, bliver markeret på vejen. null = skjult. */
    YOUTUBE_ABONNENTER: null,

    /* Billeder i bestillingsformularen.
       Formspree tager højst 25 MB pr. fil og afbryder en afsendelse, der varer
       over 30 sekunder. Derfor gøres billederne mindre i browseren, før de sendes. */
    MAKS_FILER: 10,         // Formspree tager højst 10 filer pr. forespørgsel (Personal-abonnementet)
    MAKS_FIL_MB: 10,        // pr. billede, efter det er gjort mindre
    MAKS_I_ALT_MB: 15,      // alle billeder tilsammen
    BILLED_KANT: 1920,      // længste side i pixels, når billedet er gjort mindre (0 = send billederne, som de er)
    BILLED_KVALITET: 0.8,   // JPEG-kvalitet, 0-1

    // Så længe ventes der på svar, før et forsøg opgives
    SEND_TIMEOUT_SEK: 40,

    // Hertil bedes kunden maile billederne, hvis de ikke kan sendes med formularen
    BILLED_MAIL: "Kundeservicegarageklar@hotmail.com"
  };

  /* ------------------------------------------------------------ hjælpere */
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  /* Meta Pixel: ingen forbindelse til Meta før et aktivt ja til markedsføring.
     main.js er fælles for alle sider, så både samtykke og PageView følger med. */
  (function () {
    var PIXEL_ID = "2461409487713869";
    var SAMTYKKE_NOEGLE = "garageklar.marketing-consent.v1";
    var SAMTYKKE_ALDER = 180 * 24 * 60 * 60 * 1000;
    var pixelStartet = false;
    var sidsteFokus = null;
    var script = document.currentScript;
    var cookieUrl = new URL("../../cookiepolitik.html", script.src).href;

    function laesSamtykke() {
      try {
        var valg = JSON.parse(localStorage.getItem(SAMTYKKE_NOEGLE));
        var alder = valg && Date.now() - Date.parse(valg.updatedAt);
        if (valg && typeof valg.marketing === "boolean" && alder >= 0 && alder < SAMTYKKE_ALDER) {
          return valg;
        }
        localStorage.removeItem(SAMTYKKE_NOEGLE);
      } catch (e) {
        // Ugyldige værdier ryddes; uden browserlager spørger vi igen på næste side.
        try { localStorage.removeItem(SAMTYKKE_NOEGLE); } catch (fejl) { /* Blokeret lager. */ }
      }
      return null;
    }

    function fjernMetaLager() {
      try {
        ["_fbp", "_fbc"].forEach(function (navn) {
          var udloeb = navn + "=; Max-Age=0; path=/; SameSite=Lax";
          document.cookie = udloeb;
          var dele = location.hostname.split(".");
          while (dele.length > 1) {
            document.cookie = udloeb + "; domain=" + dele.join(".");
            document.cookie = udloeb + "; domain=." + dele.join(".");
            dele.shift();
          }
        });
      } catch (e) { /* Siden virker også, hvis browseren blokerer cookieadgang. */ }
      try {
        localStorage.removeItem("lastExternalReferrer");
        localStorage.removeItem("lastExternalReferrerTime");
      } catch (e) { /* Lager kan være blokeret i browseren. */ }
    }

    function startPixel() {
      if (pixelStartet) return;
      pixelStartet = true;
      /* Metas standardkø; scriptet hentes først her, efter samtykke. */
      if (!window.fbq) {
        var n = window.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = "2.0";
        n.queue = [];
      }
      window.fbq("consent", "grant");
      // Kun PageView: ingen automatiske hændelser eller formularoplysninger.
      window.fbq("set", "autoConfig", false, PIXEL_ID);
      window.fbq("init", PIXEL_ID);
      window.fbq("track", "PageView");
      var metaScript = document.createElement("script");
      metaScript.async = true;
      metaScript.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(metaScript);
    }

    var valg = laesSamtykke();
    var panel = document.createElement("section");
    panel.className = "cookies";
    panel.setAttribute("aria-labelledby", "cookietitel");
    panel.hidden = true;
    panel.innerHTML =
      '<div class="cookies__tekst"><h2 id="cookietitel">Cookies til markedsføring</h2>' +
      '<p>Med dit samtykke bruger vi Meta Pixel til at måle besøg og effekten af vores annoncer på Facebook og Instagram. ' +
      'Meta modtager oplysninger om dit besøg og din browser og kan knytte dem til din Meta-profil. ' +
      'Du kan bruge hele siden, selv om du siger nej. <a class="cookies__politik">Læs cookiepolitikken</a>.</p>' +
      '<p class="cookies__status" aria-live="polite"></p></div>' +
      '<div class="cookies__knapper">' +
      '<button type="button" class="cookies__valg" data-cookie-afvis>Afvis markedsføring</button>' +
      '<button type="button" class="cookies__valg" data-cookie-accepter>Acceptér markedsføring</button>' +
      '<button type="button" class="cookies__luk" data-cookie-luk>Luk uden ændringer</button></div>';
    $(".cookies__politik", panel).href = cookieUrl;
    document.body.appendChild(panel);

    var indstillinger = document.createElement("button");
    indstillinger.type = "button";
    indstillinger.className = "cookieindstillinger";
    indstillinger.textContent = "Cookieindstillinger";
    indstillinger.setAttribute("aria-controls", "cookievalg");
    indstillinger.setAttribute("aria-expanded", "false");
    panel.id = "cookievalg";
    var fod = $(".fod__bund nav");
    if (fod) fod.appendChild(indstillinger);

    function aabn(fokus) {
      sidsteFokus = fokus ? document.activeElement : null;
      $(".cookies__status", panel).textContent = valg ?
        "Dit nuværende valg: markedsføring er " + (valg.marketing ? "accepteret." : "afvist.") : "";
      $("[data-cookie-luk]", panel).hidden = !valg;
      panel.hidden = false;
      indstillinger.setAttribute("aria-expanded", "true");
      if (fokus) $("[data-cookie-afvis]", panel).focus();
    }

    function luk() {
      var fokusIPanel = panel.contains(document.activeElement);
      panel.hidden = true;
      indstillinger.setAttribute("aria-expanded", "false");
      if (fokusIPanel && sidsteFokus) sidsteFokus.focus({ preventScroll: true });
      else if (fokusIPanel && fod) indstillinger.focus({ preventScroll: true });
      sidsteFokus = null;
    }

    function opdaterPixel() {
      if (valg && valg.marketing) {
        startPixel();
      } else {
        if (pixelStartet && window.fbq) window.fbq("consent", "revoke");
        fjernMetaLager();
        // Genindlæs for også at fjerne allerede indlæst Meta-kode fra hukommelsen.
        if (pixelStartet) location.reload();
      }
    }

    function gemValg(marketing) {
      valg = { marketing: marketing, updatedAt: new Date().toISOString() };
      try {
        localStorage.setItem(SAMTYKKE_NOEGLE, JSON.stringify(valg));
      } catch (e) {
        // Et gammelt ja må ikke overleve et nej, hvis lageret er fyldt.
        try { localStorage.removeItem(SAMTYKKE_NOEGLE); } catch (fejl) { /* Blokeret lager. */ }
      }
      luk();
      opdaterPixel();
    }

    indstillinger.addEventListener("click", function () { aabn(true); });
    $("[data-cookie-afvis]", panel).addEventListener("click", function () { gemValg(false); });
    $("[data-cookie-accepter]", panel).addEventListener("click", function () { gemValg(true); });
    $("[data-cookie-luk]", panel).addEventListener("click", luk);
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && valg) { e.preventDefault(); luk(); }
    });

    // Et nej i en anden fane eller efter gendannelse fra browserens sidecache gælder også her.
    function synkroniserValg() {
      valg = laesSamtykke();
      if (!valg) aabn(false);
      else luk();
      opdaterPixel();
    }
    window.addEventListener("storage", function (e) {
      if (e.key === SAMTYKKE_NOEGLE || e.key === null) synkroniserValg();
    });
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) synkroniserValg();
    });

    if (!valg) aabn(false);
    opdaterPixel();
  })();

  function kr(n) {
    return new Intl.NumberFormat("da-DK").format(Math.round(n)) + " kr.";
  }

  /* "2026-06-11" -> "11/6-2026 (torsdag)".
     Et datofelt afleverer altid år-måned-dag, uanset hvordan browseren viser
     datoen. Selve datoen laves ved at flytte rundt på teksten — der bruges med
     vilje ikke new Date("2026-06-11"), for den læses som midnat UTC og kan give
     dagen før på en enhed i en anden tidszone. */
  var UGEDAGE = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];

  function danskDato(v) {
    v = (v || "").trim();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m) { return v || "Ikke oplyst"; }   // tomt felt, eller fritekst fra en browser uden datovælger
    var aar = parseInt(m[1], 10), md = parseInt(m[2], 10), dag = parseInt(m[3], 10);
    var tekst = dag + "/" + md + "-" + aar;

    // Ugedagen slås op midt på dagen i lokal tid, så hverken tidszone eller
    // sommertid kan rykke den. Findes datoen ikke (31/2), kommer der ingen ugedag på.
    var d = new Date(aar, md - 1, dag, 12);
    if (d.getMonth() === md - 1 && d.getDate() === dag) { tekst += " (" + UGEDAGE[d.getDay()] + ")"; }
    return tekst;
  }

  var FOKUSERBARE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /* =====================================================================
     1. TOPBJÆLKE — skygge ved scroll
     ===================================================================== */
  var bjaelke = $("#bjaelke");
  if (bjaelke) {
    var opdaterBjaelke = function () {
      bjaelke.classList.toggle("rullet", window.scrollY > 12);
    };
    opdaterBjaelke();
    window.addEventListener("scroll", opdaterBjaelke, { passive: true });
  }

  /* =====================================================================
     2. OVERLAY-STYRING (menu + modal) med fokusfælde
     ===================================================================== */
  function lavOverlay(el, aabnKnapper, lukVaelger) {
    if (!el) return null;

    var sidsteFokus = null;

    function saetLukket(lukket) {
      el.classList.toggle("aaben", !lukket);
      el.setAttribute("aria-hidden", lukket ? "true" : "false");
      if (lukket) { el.setAttribute("inert", ""); }
      else { el.removeAttribute("inert"); }
    }

    function aabn() {
      sidsteFokus = document.activeElement;
      saetLukket(false);
      document.body.classList.add("laast");
      var f = el.querySelector(FOKUSERBARE);
      if (f) { setTimeout(function () { f.focus(); }, 60); }
      aabnKnapper.forEach(function (k) { k.setAttribute("aria-expanded", "true"); });
    }

    function luk() {
      saetLukket(true);
      document.body.classList.remove("laast");
      aabnKnapper.forEach(function (k) { k.setAttribute("aria-expanded", "false"); });
      if (sidsteFokus && sidsteFokus.focus) { sidsteFokus.focus(); }
    }

    saetLukket(true);

    aabnKnapper.forEach(function (k) {
      k.addEventListener("click", function () {
        el.classList.contains("aaben") ? luk() : aabn();
      });
    });

    $$(lukVaelger, el).forEach(function (k) { k.addEventListener("click", luk); });

    el.addEventListener("click", function (e) {
      if (e.target === el) { luk(); }
    });

    el.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); luk(); return; }
      if (e.key !== "Tab") return;
      var f = $$(FOKUSERBARE, el).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var f0 = f[0], fN = f[f.length - 1];
      if (e.shiftKey && document.activeElement === f0) { e.preventDefault(); fN.focus(); }
      else if (!e.shiftKey && document.activeElement === fN) { e.preventDefault(); f0.focus(); }
    });

    return { aabn: aabn, luk: luk };
  }

  var menuknap = $("#menuknap");
  lavOverlay($("#menu"), menuknap ? [menuknap] : [], "[data-luk-menu]");

  var ringmodal = lavOverlay($("#ringmodal"), $$("[data-aabn-ring]"), "[data-luk-ring]");

  /* =====================================================================
     3. "FÅ ET GRATIS TILBUD"
     Der regnes ikke længere en pris ud. Opgavetypen bestemmer "fra"-prisen,
     og mængde + tillæg sendes blot med videre, så vi kan give et fast tilbud.
     ===================================================================== */
  var fType = $("#opgavetype");
  if (fType) {
    var uPris    = $("#pris");        // "Fra ... kr." i den mørke rubrik
    var uLinjer  = $("#linjer");
    var uFraPris = $("#fra-pris");    // det store tal i det hvide kort
    var cbAdgang = $("#tv-adgang");
    var cbTunge  = $("#tv-tunge");
    var videre   = $("#videre");

    // Knappen ligger både på forsiden og på /priser/ — behold dens egen sti.
    var VIDERE_BASE = (videre.getAttribute("href") || "bestilling.html").split("?")[0];

    function valgtMaengde() {
      var r = $('input[name="maengde"]:checked');
      return r ? r.value : "";
    }

    function opdater() {
      var type = fType.value;
      var fra = KONFIG.FRA_PRISER[type];
      var harPris = typeof fra === "number";

      // Mørk rubrik
      uPris.textContent = harPris ? "Fra " + kr(fra) : "Kontakt os";

      // Hvidt kort
      if (uFraPris) {
        uFraPris.innerHTML = harPris
          ? "<em>Fra</em><strong>" + kr(fra) + "</strong><span>pr. opgave</span>"
          : "<strong>Kontakt os</strong><span>vi giver en pris</span>";
      }

      // Specifikation
      var linjer = [type];
      var maengde = valgtMaengde();
      if (maengde) { linjer.push("Mængde: " + maengde); }
      var tillaeg = [];
      if (cbAdgang.checked) { tillaeg.push("Besværlig adgang"); }
      if (cbTunge.checked)  { tillaeg.push("Tunge/store genstande"); }
      if (tillaeg.length)   { linjer.push(tillaeg.join(" · ")); }

      uLinjer.innerHTML = "";
      linjer.forEach(function (tekst) {
        var li = document.createElement("li");
        li.textContent = tekst;
        uLinjer.appendChild(li);
      });

      // Videre til trin 2
      var q = "?opgave=" + encodeURIComponent(type);
      if (harPris) { q += "&fra=" + fra; }
      if (maengde) { q += "&maengde=" + encodeURIComponent(maengde); }
      if (tillaeg.length) { q += "&tillaeg=" + encodeURIComponent(tillaeg.join(", ")); }
      videre.setAttribute("href", VIDERE_BASE + q);
    }

    fType.addEventListener("change", opdater);
    $$('input[name="maengde"]').forEach(function (r) {
      r.addEventListener("change", opdater);
    });
    [cbAdgang, cbTunge].forEach(function (cb) {
      cb.addEventListener("change", opdater);
    });

    opdater();
  }

  /* =====================================================================
     4. FØR / EFTER — bygges på forsiden, gøres interaktiv overalt
     ===================================================================== */
  var FE = [
    { slug: "bryggers", titel: "Udhus",         sted: "Privat bolig" },
    { slug: "carport",  titel: "Carport",       sted: "Privat bolig" },
    { slug: "entre",    titel: "Entré og gang", sted: "Privat bolig" },
    { slug: "vaerelse", titel: "Lille værelse", sted: "Privat bolig" },
    { slug: "stue",     titel: "Stue",          sted: "Privat bolig" }
    /* Kælderrum mangler stadig billeder. Læg kaelderrum-foer / kaelderrum-efter
       (.jpg + .webp, kvadratiske) i assets/img/foer-efter/ og fjern //-tegnene:
    , { slug: "kaelderrum", titel: "Kælderrum", sted: "Privat bolig" } */
  ];

  /* Gør ét før/efter-vindue til at trække i.
     Kaldes både for kortene, der bygges her på forsiden, og for de
     færdigskrevne kort ude på ydelsessiderne — ellers virker de ikke der. */
  function gorFeInteraktiv(vindue, startSplit) {
    var slider = $(".fe__slider", vindue);
    if (!slider || vindue.getAttribute("data-fe-klar")) { return; }
    vindue.setAttribute("data-fe-klar", "1");

    function saet(p) {
      p = Math.max(0, Math.min(100, p));
      vindue.style.setProperty("--split", p + "%");
    }
    function fraPunkt(clientX) {
      var r = vindue.getBoundingClientRect();
      var p = ((clientX - r.left) / r.width) * 100;
      slider.value = p;
      saet(p);
    }

    slider.addEventListener("input", function () { saet(parseFloat(slider.value)); });

    var traekker = false;
    vindue.addEventListener("pointerdown", function (e) {
      if (e.target === slider) { return; }   // slideren styrer sig selv
      traekker = true;
      vindue.setPointerCapture(e.pointerId);
      fraPunkt(e.clientX);
    });
    vindue.addEventListener("pointermove", function (e) { if (traekker) { fraPunkt(e.clientX); } });
    vindue.addEventListener("pointerup", function () { traekker = false; });
    vindue.addEventListener("pointercancel", function () { traekker = false; });

    saet(startSplit);
  }

  var feGrid = $("#fe-grid");
  if (feGrid) {
    FE.forEach(function (it) {
      var art = document.createElement("article");
      art.className = "fe ind";
      art.innerHTML =
        '<div class="fe__vindue" data-fe>' +
          '<picture>' +
            '<source srcset="assets/img/foer-efter/' + it.slug + '-foer.webp" type="image/webp">' +
            '<img src="assets/img/foer-efter/' + it.slug + '-foer.jpg" alt="' + it.titel + ' før oprydning" width="900" height="901" loading="lazy">' +
          '</picture>' +
          '<picture class="fe__efter">' +
            '<source srcset="assets/img/foer-efter/' + it.slug + '-efter.webp" type="image/webp">' +
            '<img src="assets/img/foer-efter/' + it.slug + '-efter.jpg" alt="' + it.titel + ' efter oprydning" width="900" height="901" loading="lazy">' +
          '</picture>' +
          '<span class="fe__mrk fe__mrk--f">Før</span>' +
          '<span class="fe__mrk fe__mrk--e">Efter</span>' +
          '<span class="fe__haandtag"></span>' +
          '<input class="fe__slider" type="range" min="0" max="100" value="50" step="0.1" ' +
                 'aria-label="Træk for at sammenligne før og efter — ' + it.titel + '">' +
        '</div>' +
        '<div class="fe__fod"><h3>' + it.titel + '</h3><span>' + it.sted + '</span></div>';
      feGrid.appendChild(art);
    });

    /* Med præcis fem kort stilles de op som 3 + 2 forskudt, så titlen og
       billederne danner en diamant. Kommer der et sjette kort, falder
       galleriet automatisk tilbage til et almindeligt 3 + 3-gitter. */
    if (FE.length === 5) { feGrid.classList.add("fe__grid--diamant"); }
  }

  // Alle vinduer på siden — både de netop byggede og undersidernes faste kort.
  $$("[data-fe]").forEach(function (vindue, i) {
    gorFeInteraktiv(vindue, i % 2 === 0 ? 50 : 46);
  });

  /* =====================================================================
     4b. VORES DRØM — milepæle på vejen mod 100.000 abonnenter
     Tallet er ikke sat af sig selv. Står KONFIG.YOUTUBE_ABONNENTER til null,
     vises hverken antal eller markering — så der ikke står et gætteri på siden.
     ===================================================================== */
  var rute = $("#droem-rute");
  if (rute && typeof KONFIG.YOUTUBE_ABONNENTER === "number") {
    var antal = KONFIG.YOUTUBE_ABONNENTER;

    var chip = $("#droem-antal");
    if (chip) {
      $("b", chip).textContent = new Intl.NumberFormat("da-DK").format(antal);
      chip.hidden = false;
    }

    var poster = $$("li", rute);
    var sidsteNaaet = -1;
    poster.forEach(function (li, i) {
      if (antal >= parseInt(li.getAttribute("data-maal"), 10)) {
        li.classList.add("naaet");
        sidsteNaaet = i;
      }
    });

    /* Farv vejen frem til det senest nåede mål. Punkterne herunder er de
       samme koordinater som cirklerne ligger på i CSS'en. */
    var sti = $("#rute-naaet");
    if (sti && sidsteNaaet >= 0 && sti.getTotalLength) {
      var PUNKT = [[24, 6], [62, 6], [62, 31], [24, 31], [24, 56], [62, 56], [43, 81]];
      try {
        var maal = PUNKT[sidsteNaaet];
        var total = sti.getTotalLength();
        var bedst = 0, mindst = Infinity;
        for (var l = 0; l <= total; l += total / 400) {
          var pt = sti.getPointAtLength(l);
          var d = (pt.x - maal[0]) * (pt.x - maal[0]) + (pt.y - maal[1]) * (pt.y - maal[1]);
          if (d < mindst) { mindst = d; bedst = l; }
        }
        sti.style.setProperty("--naaet", (bedst / total) * 100);
      } catch (e) { /* ingen vej tegnet — cirklerne er stadig markeret */ }
    }
  }

  /* =====================================================================
     5. HERO-VIDEO — hentes først når siden er klar
     ===================================================================== */
  var herovideo = $("#herovideo");
  if (herovideo) {
    var reduceret = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var spar = navigator.connection && (navigator.connection.saveData ||
      /2g/.test(navigator.connection.effectiveType || ""));

    if (!reduceret && !spar) {
      var start = function () {
        herovideo.muted = true;
        herovideo.defaultMuted = true;
        herovideo.src = "assets/video/hero.mp4";
        herovideo.load();
        var p = herovideo.play();
        if (p && p.catch) { p.catch(function () { /* autoplay blokeret — posteren bliver stående */ }); }
        herovideo.addEventListener("playing", function () {
          herovideo.classList.add("klar");
        }, { once: true });
      };
      if (document.readyState === "complete") { setTimeout(start, 250); }
      else { window.addEventListener("load", function () { setTimeout(start, 250); }); }
    }
  }

  /* =====================================================================
     6. VIDEO-AFSPILLER
     ===================================================================== */
  var afspiller = $("#afspiller");
  if (afspiller) {
    var vid = $("#reklame", afspiller);
    var playknap = $("#playknap", afspiller);

    playknap.addEventListener("click", function () {
      if (vid.paused) {
        vid.controls = true;
        vid.play();
        afspiller.classList.add("spiller");
      }
    });
    vid.addEventListener("pause", function () { afspiller.classList.remove("spiller"); });
    vid.addEventListener("ended", function () {
      afspiller.classList.remove("spiller");
      vid.controls = false;
      vid.currentTime = 0;
    });
  }

  /* =====================================================================
     7. SCROLL-ANIMATION
     ===================================================================== */
  var ind = $$(".ind");
  if (ind.length) {
    if (!("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ind.forEach(function (n) { n.classList.add("synlig"); });
    } else {
      var io = new IntersectionObserver(function (poster) {
        poster.forEach(function (p) {
          if (p.isIntersecting) { p.target.classList.add("synlig"); io.unobserve(p.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      ind.forEach(function (n) { io.observe(n); });
    }
  }

  /* =====================================================================
     8. FORMULARER — validering og afsendelse
     ===================================================================== */
  function visFejl(felt, vis) {
    var f = document.querySelector('[data-fejl-for="' + felt.id + '"]');
    if (f) { f.classList.toggle("vis", vis); }
    felt.setAttribute("aria-invalid", vis ? "true" : "false");
    if (!vis) { felt.removeAttribute("aria-invalid"); }
  }

  function cifre(s) { return (s || "").replace(/\D/g, ""); }

  // Bevidst løs: fanger tastefejl som "ole@" og "ole@gmail", ikke mere.
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Det der tjekkes: de påkrævede felter — og e-mail, hvis den er udfyldt.
  var TJEKKES = '[required], input[type="email"]';

  function valider(form) {
    var ok = true, foerste = null;
    $$(TJEKKES, form).forEach(function (felt) {
      var v = (felt.value || "").trim();
      var gyldig = v !== "" || !felt.required;
      if (gyldig && v !== "" && felt.type === "tel") { gyldig = cifre(v).length >= 8; }
      // E-mail er frivillig, men Formspree afviser hele forespørgslen, hvis den er skrevet forkert.
      if (gyldig && v !== "" && felt.type === "email") { gyldig = EMAIL.test(v); }
      visFejl(felt, !gyldig);
      if (!gyldig) { ok = false; if (!foerste) { foerste = felt; } }
    });
    if (foerste) {
      foerste.focus();
      foerste.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return ok;
  }

  function ryd(form) {
    $$(TJEKKES, form).forEach(function (felt) {
      felt.addEventListener("input", function () {
        if (felt.getAttribute("aria-invalid") === "true") { visFejl(felt, false); }
      });
    });
  }

  // ekstra er valgfri: et afsnit mere under teksten (må indeholde et link).
  function kvittering(titel, tekst, ekstra) {
    return '<div class="kvit">' +
      '<div class="kvit__ikon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<h2>' + titel + '</h2><p>' + tekst + '</p>' +
      (ekstra ? '<p>' + ekstra + '</p>' : '') +
      '<a class="knap knap--sort" href="index.html">Tilbage til forsiden</a></div>';
  }

  /* Oversætter Formsprees svar til noget, resten af koden kan reagere på.
     Fejl kommer som JSON. En feltfejl har et feltnavn med:
       { "errors": [{ "code": "TYPE_EMAIL", "field": "email", "message": "…" }] }
     Fejlkoden mangler ofte. Sådan svarede den rigtige formular (status 400), da
     den fik et billede med på et abonnement uden filer:
       { "error": "File Uploads Not Permitted",
         "errors": [{ "message": "File Uploads Not Permitted" }] }
     Derfor genkendes en filfejl både på koden og på selve teksten.
     status 0 betyder, at der slet ikke kom et svar (intet net, afbrudt, timeout). */
  var FILFEJL = /^(NO_FILE_UPLOADS|TOO_MANY_FILES|FILES_TOO_BIG)$|file uploads? not permitted/i;

  function tolk(status, tekst) {
    var j = {};
    try { j = JSON.parse(tekst) || {}; } catch (e) { /* ikke JSON — fx en fejlside undervejs */ }

    var svar = {
      ok: status >= 200 && status < 300,
      status: status,
      koder: [],        // Formsprees fejlkoder
      beskeder: [],     // Formsprees egne fejltekster (engelske)
      felter: [],       // navne på felter, Formspree ikke vil godtage
      filfejl: false    // true, når fejlen handler om de vedhæftede filer
    };
    (Array.isArray(j.errors) ? j.errors : []).forEach(function (f) {
      if (f.code) { svar.koder.push(f.code); }
      if (f.message) { svar.beskeder.push(f.message); }
      if (FILFEJL.test(f.code || "") || FILFEJL.test(f.message || "")) {
        svar.filfejl = true;
      } else if (f.field) {
        svar.felter.push(f.field);
      }
    });
    if (typeof j.error === "string" && j.error) {
      if (!svar.beskeder.length) { svar.beskeder.push(j.error); }
      if (FILFEJL.test(j.error)) { svar.filfejl = true; }
    }
    if (status === 413) { svar.filfejl = true; }   // "for stor" fra et led foran Formspree
    return svar;
  }

  /**
   * Sender formulardata. Er FORM_ENDPOINT tom, køres demo-tilstand:
   * data logges i konsollen og kvitteringen vises.
   *
   * faerdig(ok, svar) — svar kommer fra tolk() og fortæller, hvad der gik galt.
   * tekst er valgfri og vises på knappen imens (ellers "Sender …").
   */
  function send(form, data, knap, faerdig, tekst) {
    var oprindelig = knap.innerHTML;
    knap.disabled = true;
    knap.innerHTML = tekst || "Sender …";

    // Knappen sættes tilbage, FØR faerdig() kaldes — så faerdig() selv kan sende én gang til.
    function slut(svar) {
      knap.disabled = false;
      knap.innerHTML = oprindelig;
      faerdig(svar.ok, svar);
    }

    if (!KONFIG.FORM_ENDPOINT) {
      var udskrift = {};
      data.forEach(function (v, k) {
        udskrift[k] = (v instanceof Blob) ? (v.name || "fil") + " (" + v.size + " bytes)" : v;
      });
      console.info("[GarageKlar] Demo-tilstand — intet er sendt. Data:", udskrift);
      setTimeout(function () { slut(tolk(200, "")); }, 700);
      return;
    }

    Object.keys(KONFIG.FORM_EKSTRA).forEach(function (k) {
      data.append(k, KONFIG.FORM_EKSTRA[k]);
    });

    // Uden en grænse kan knappen stå på "Sender …" for evigt på en dårlig forbindelse.
    var styring = window.AbortController ? new AbortController() : null;
    var ur = setTimeout(function () {
      if (styring) { styring.abort(); }
    }, KONFIG.SEND_TIMEOUT_SEK * 1000);

    // Accept: application/json får Formspree til at svare med JSON i stedet for
    // at omdirigere til deres egen kvitteringsside.
    fetch(KONFIG.FORM_ENDPOINT, {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" },
      signal: styring ? styring.signal : undefined
    })
      // Svaret læses altid — også ved fejl. Det er dér, Formspree skriver hvorfor.
      .then(function (r) {
        return r.text().then(function (t) { return tolk(r.status, t); });
      })
      .catch(function () { return tolk(0, ""); })
      // Står til sidst, så en fejl inde i faerdig() ikke bliver til "kunne ikke sendes".
      .then(function (svar) {
        clearTimeout(ur);
        slut(svar);
      });
  }

  /* --- Bliv ringet op ------------------------------------------------- */
  var ringform = $("#ringform");
  if (ringform) {
    ryd(ringform);
    ringform.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!valider(ringform)) return;

      var data = new FormData(ringform);
      data.append("_subject", "Bliv ringet op — GarageKlar");
      data.append("_type", "Bliv ringet op");
      data.append("_side", location.href);

      send(ringform, data, $('button[type="submit"]', ringform), function (ok) {
        if (ok) {
          $("#ringindhold").innerHTML = kvittering(
            "Tak — vi ringer til dig!",
            "Vi har modtaget din henvendelse og kontakter dig hurtigst muligt på det oplyste nummer."
          );
        } else {
          alert("Noget gik galt. Prøv igen, eller ring til os på 70 70 78 80.");
        }
      });
    });
  }

  /* =====================================================================
     9. BESTILLINGSSIDE (trin 2)
     ===================================================================== */
  var bestil = $("#bestilform");
  if (bestil) {
    var q = new URLSearchParams(location.search);
    var opgave  = q.get("opgave") || "";
    var fra     = parseInt(q.get("fra"), 10);
    var maengde = q.get("maengde") || "";
    var tillaeg = q.get("tillaeg") || "";

    // Samme opstilling som i tilbudsboksen, så kunden ser præcis det samme her.
    var linjer = [opgave];
    if (maengde) { linjer.push("Mængde: " + maengde); }
    if (tillaeg) { linjer.push(tillaeg); }

    var opsum = $("#opsum");
    if (opgave) {
      var ul = $("#opsum-linjer");
      ul.innerHTML = "";
      linjer.forEach(function (tekst) {
        var li = document.createElement("li");
        li.textContent = tekst;
        ul.appendChild(li);
      });
      $("#opsum-pris").textContent = fra ? "Fra " + kr(fra) : "Kontakt os";
    } else if (opsum) {
      opsum.innerHTML = '<p class="opsum__total">Du har ikke valgt en opgavetype endnu.</p>' +
        '<a class="tekstlink ret" href="index.html#beregner">Få et gratis tilbud →</a>';
    }

    $("#f-opgave").value  = opgave;
    $("#f-maengde").value = maengde || "Ikke oplyst";
    $("#f-tillaeg").value = tillaeg || "Ingen";
    $("#f-pris").value    = opgave ? (fra ? "Fra " + fra + " kr." : "Kontakt os") : "";

    /* --- billedupload ---
       To felter: "Tag et billede" (kameraet) og "Vælg billeder" (billeder der
       allerede ligger på telefonen eller computeren).

       Billederne gøres mindre i browseren, før de sendes: et telefonbillede på
       4-10 MB bliver til omkring 0,5 MB. Formspree afbryder en afsendelse, der
       varer over 30 sekunder, så det afgør, om billederne når frem på mobilnet.
       Kan browseren ikke læse et billede (fx HEIC i Chrome), sendes originalen. */
    var filfelt = $("#billeder");
    var kamerafelt = $("#billeder-kamera");
    var liste = $("#filliste");
    var uploadboks = $("#uploadboks");
    var filtal = $("#filtal");
    var filbesked = $("#filbesked");

    var MB = 1024 * 1024;
    var valgte = [];        // klar til afsendelse: { fil, navn, url }
    var koe = [];           // venter på at blive gjort klar
    var arbejder = false;   // true, mens køen kører
    var sprunget = [];      // beskeder om det, der ikke kom med
    var naarKlar = null;    // sat, hvis der trykkes "Send", mens køen kører

    // Under 1 MB vises kB — ellers står et lille billede som "0,0 MB".
    function mb(bytes) {
      if (bytes < MB) { return Math.max(1, Math.round(bytes / 1024)) + " kB"; }
      return (bytes / MB).toFixed(1).replace(".", ",") + " MB";
    }

    function samlet() {
      return valgte.reduce(function (sum, p) { return sum + p.fil.size; }, 0);
    }

    /* File.type gættes ud fra filendelsen og kan være tom — fx .heic i Chrome og
       Edge på Windows. Derfor godkendes et billede også på endelsen alene. */
    function erBillede(f) {
      if (/^image\//.test(f.type)) { return f.type !== "image/svg+xml"; }
      return /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|tiff?)$/i.test(f.name || "");
    }

    function opdaterTal() {
      var n = valgte.length;
      if (arbejder) {
        filtal.textContent = "Gør billederne klar … ";
      } else if (n) {
        filtal.textContent = n + " billede" + (n === 1 ? "" : "r") + " klar til at blive sendt (" + mb(samlet()) + "). ";
      } else {
        filtal.textContent = "";
      }
    }

    /* Gør ét billede mindre: højst BILLED_KANT på den længste side, gemt som JPEG.
       Kalder tilbage med det nye billede — eller med null, når originalen skal
       bruges (kan ikke læses, er lille nok i forvejen, eller blev ikke mindre). */
    function skalerNed(fil, faerdig) {
      // BILLED_KANT: 0 slår det hele fra — så sendes billederne, som de er.
      if (!KONFIG.BILLED_KANT) { faerdig(null); return; }

      var url = URL.createObjectURL(fil);
      var img = new Image();
      var afsluttet = false;
      var ur;

      function slut(blob) {
        if (afsluttet) return;
        afsluttet = true;
        clearTimeout(ur);
        URL.revokeObjectURL(url);
        faerdig(blob);
      }

      // Giver en fil hverken "load" eller "error", må køen ikke gå i stå.
      ur = setTimeout(function () { slut(null); }, 20000);

      img.onerror = function () { slut(null); };
      img.onload = function () {
        var b = img.naturalWidth, h = img.naturalHeight;
        if (!b || !h) { slut(null); return; }

        var faktor = Math.min(1, KONFIG.BILLED_KANT / Math.max(b, h));
        // Lille nok i forvejen: lad billedet være.
        if (faktor === 1 && fil.size <= MB && /^image\/(jpeg|png|webp)$/.test(fil.type)) { slut(null); return; }

        try {
          var c = document.createElement("canvas");
          c.width = Math.round(b * faktor);
          c.height = Math.round(h * faktor);
          var ctx = c.getContext("2d");
          ctx.fillStyle = "#fff";            // en gennemsigtig PNG må ikke få sort baggrund
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);

          /* Sikkerhedstjek: en telefon, der mangler hukommelse, kan lade være med at
             tegne noget uden at melde fejl. Så er lærredet ensfarvet — og så sendes
             originalen i stedet for et tomt billede. */
          var px = ctx.getImageData(0, 0, c.width, c.height).data, ens = true;
          for (var i = 4004; i < px.length && ens; i += 4004) {
            ens = px[i] === px[0] && px[i + 1] === px[1] && px[i + 2] === px[2];
          }
          if (ens) { c.width = c.height = 0; slut(null); return; }

          c.toBlob(function (blob) {
            c.width = c.height = 0;          // giver hukommelsen fri med det samme (Safari)
            if (!blob || blob.type !== "image/jpeg") { slut(null); return; }
            // Blev den ikke mindre, og er originalen et almindeligt format, så behold den.
            if (blob.size >= fil.size && /^image\/(jpeg|png|webp|gif)$/.test(fil.type)) { slut(null); return; }
            slut(blob);
          }, "image/jpeg", KONFIG.BILLED_KVALITET);
        } catch (e) { slut(null); }
      };
      img.src = url;
    }

    function tegnFil(post) {
      var d = document.createElement("div");
      d.className = "fil";

      var img = document.createElement("img");
      img.alt = "";
      // Kan browseren ikke vise billedet (fx HEIC i Chrome), sendes det stadig med.
      img.onerror = function () { d.classList.add("fil--ukendt"); };
      img.src = post.url;

      // textContent, ikke innerHTML: et filnavn kan indeholde < og &.
      var navn = document.createElement("span");
      navn.className = "fil__navn";
      navn.textContent = post.navn;

      var fjern = document.createElement("button");
      fjern.type = "button";
      fjern.setAttribute("aria-label", "Fjern " + post.navn);
      fjern.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
      fjern.addEventListener("click", function () {
        // Find billedet selv — ikke et gemt nummer. Listen kan have ændret sig imens.
        var i = valgte.indexOf(post);
        if (i > -1) { valgte.splice(i, 1); }
        URL.revokeObjectURL(post.url);
        liste.removeChild(d);
        opdaterTal();
        // Fokus må ikke forsvinde sammen med knappen.
        ($("button", liste) || filfelt).focus();
      });

      d.appendChild(img);
      d.appendChild(navn);
      d.appendChild(fjern);
      liste.appendChild(d);
    }

    function naeste() {
      var fil = koe.shift();
      if (!fil) {
        arbejder = false;
        opdaterTal();
        filbesked.textContent = sprunget.join(" ");
        sprunget = [];
        if (naarKlar) { var videre = naarKlar; naarKlar = null; videre(); }
        return;
      }
      skalerNed(fil, function (mindre) {
        var klar = mindre || fil;
        var navn = fil.name || "billede";
        if (mindre) { navn = navn.replace(/\.[^.]*$/, "") + ".jpg"; }

        if (klar.size > KONFIG.MAKS_FIL_MB * MB) {
          sprunget.push("“" + fil.name + "” er for stort (" + mb(klar.size) + ") og kom ikke med.");
        } else if (samlet() + klar.size > KONFIG.MAKS_I_ALT_MB * MB) {
          sprunget.push("“" + fil.name + "” kom ikke med, fordi billederne tilsammen fylder for meget.");
        } else {
          var post = { fil: klar, navn: navn, url: URL.createObjectURL(klar) };
          valgte.push(post);
          tegnFil(post);
        }
        naeste();
      });
    }

    function tilfoej(filer) {
      var forMange = 0;
      if (!arbejder) { sprunget = []; }

      filer.forEach(function (f) {
        if (!erBillede(f)) {
          sprunget.push("“" + f.name + "” er ikke et billede og kom ikke med.");
        } else if (f.size > 4 * KONFIG.MAKS_FIL_MB * MB) {
          // Så store filer forsøges slet ikke — det kan vælte browseren på en telefon.
          sprunget.push("“" + f.name + "” er alt for stort (" + mb(f.size) + ") og kom ikke med.");
        } else if (valgte.length + koe.length + (arbejder ? 1 : 0) >= KONFIG.MAKS_FILER) {
          forMange++;
        } else {
          koe.push(f);
        }
      });
      if (forMange) {
        sprunget.push("Du kan højst vedhæfte " + KONFIG.MAKS_FILER + " billeder — " + forMange + " kom ikke med.");
      }

      if (!arbejder) {
        arbejder = true;
        filbesked.textContent = "";
        opdaterTal();
        naeste();
      }
    }

    [filfelt, kamerafelt].forEach(function (felt) {
      if (!felt) return;
      felt.addEventListener("change", function () {
        // Kopiér listen, FØR feltet nulstilles — ellers kan den være tom, når køen når frem.
        var filer = Array.prototype.slice.call(felt.files || []);
        felt.value = "";          // så det samme billede kan vælges igen
        tilfoej(filer);
      });
    });

    // if: så kan hele upload-boksen fjernes fra bestilling.html, uden at resten går i stykker.
    if (uploadboks) {
      ["dragenter", "dragover"].forEach(function (n) {
        uploadboks.addEventListener(n, function (e) { e.preventDefault(); uploadboks.classList.add("over"); });
      });
      ["dragleave", "drop"].forEach(function (n) {
        uploadboks.addEventListener(n, function (e) { e.preventDefault(); uploadboks.classList.remove("over"); });
      });
      uploadboks.addEventListener("drop", function (e) {
        var filer = Array.prototype.slice.call((e.dataTransfer && e.dataTransfer.files) || []);
        if (filer.length) {
          tilfoej(filer);
        } else {
          filbesked.textContent = "Det, du slap, var ikke en fil. Gem billedet på computeren først, og træk filen herind.";
        }
      });
    }

    /* --- hvornår skal det ordnes? ---
       Tre valg: en bestemt dag, før en dato eller fleksibel (3/7/14 dage).
       Datochippen er et usynligt datofelt lagt hen over en knap, så telefonen
       viser sin egen datovælger; på computer åbnes den med showPicker(). */
    var MAANEDER = ["januar", "februar", "marts", "april", "maj", "juni", "juli",
      "august", "september", "oktober", "november", "december"];

    function nul(n) { return (n < 10 ? "0" : "") + n; }
    function idag() {
      var d = new Date();
      return d.getFullYear() + "-" + nul(d.getMonth() + 1) + "-" + nul(d.getDate());
    }
    // "2026-10-29" -> "29. oktober" (årstallet kommer kun med, hvis det ikke er i år)
    function kortDato(v) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
      if (!m) { return ""; }
      var t = parseInt(m[3], 10) + ". " + MAANEDER[parseInt(m[2], 10) - 1];
      return parseInt(m[1], 10) === new Date().getFullYear() ? t : t + " " + m[1];
    }

    $$(".datochip", bestil).forEach(function (chip) {
      var felt = $('input[type="date"]', chip);
      var tekst = $(".datochip__tekst", chip);
      felt.min = idag();
      function vis() {
        tekst.textContent = kortDato(felt.value) || "Vælg dato";
        if (felt.value) { visFejl(felt, false); }
      }
      function aabn() {
        if (felt.showPicker) { try { felt.showPicker(); } catch (e) { /* ældre browser — feltet åbner selv */ } }
      }
      felt.addEventListener("input", vis);
      felt.addEventListener("change", vis);
      felt.addEventListener("click", aabn);
      felt.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); aabn(); }
      });
      vis();
    });

    // "I løbet af de næste … dage": en lille liste med tastaturstyring (listbox).
    var flexKnap = $("#flex-knap");
    var flexListe = $("#flex-liste");
    var flexValg = $$('[role="option"]', flexListe);
    var flexAktiv = 0;

    function flexValgt() {
      for (var i = 0; i < flexValg.length; i++) {
        if (flexValg[i].getAttribute("aria-selected") === "true") { return i; }
      }
      return flexValg.length - 1;
    }
    function flexMarker(i) {
      flexAktiv = Math.max(0, Math.min(flexValg.length - 1, i));
      flexValg.forEach(function (li, j) { li.classList.toggle("aktiv", j === flexAktiv); });
      flexListe.setAttribute("aria-activedescendant", flexValg[flexAktiv].id);
    }
    function flexAabn() {
      flexListe.hidden = false;
      flexKnap.setAttribute("aria-expanded", "true");
      flexMarker(flexValgt());
      flexListe.focus();
    }
    function flexLuk(fokus) {
      if (flexListe.hidden) { return; }
      flexListe.hidden = true;
      flexKnap.setAttribute("aria-expanded", "false");
      if (fokus) { flexKnap.focus(); }
    }
    function flexVaelg(i) {
      flexValg.forEach(function (li, j) { li.setAttribute("aria-selected", j === i ? "true" : "false"); });
      $("#flex-tekst").textContent = flexValg[i].textContent;
      flexLuk(true);
    }

    flexKnap.addEventListener("click", function () {
      if (flexListe.hidden) { flexAabn(); } else { flexLuk(true); }
    });
    flexKnap.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); flexAabn(); }
    });
    flexListe.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); flexMarker(flexAktiv + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); flexMarker(flexAktiv - 1); }
      else if (e.key === "Home") { e.preventDefault(); flexMarker(0); }
      else if (e.key === "End") { e.preventDefault(); flexMarker(flexValg.length - 1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flexVaelg(flexAktiv); }
      else if (e.key === "Escape") { e.preventDefault(); flexLuk(true); }
      else if (e.key === "Tab") { flexLuk(false); }
    });
    flexValg.forEach(function (li, i) {
      li.addEventListener("click", function () { flexVaelg(i); });
      li.addEventListener("mousemove", function () { if (flexAktiv !== i) { flexMarker(i); } });
    });
    document.addEventListener("click", function (e) {
      if (!flexListe.hidden && !e.target.closest(".vaelger")) { flexLuk(false); }
    });

    // Nej/Ja: tidsrummene vises kun ved Ja.
    var tidsrum = $("#tidsrum");
    var tidsrumFejl = $("#tidsrum-fejl");
    function tidsrumJa() { return !!$('input[name="tidsrum_valg"][value="ja"]:checked', bestil); }
    $$('input[name="tidsrum_valg"]', bestil).forEach(function (r) {
      r.addEventListener("change", function () {
        tidsrum.hidden = !tidsrumJa();
        tidsrumFejl.classList.remove("vis");
      });
    });
    $$('input[type="checkbox"]', tidsrum).forEach(function (c) {
      c.addEventListener("change", function () { tidsrumFejl.classList.remove("vis"); });
    });
    $$('input[name="hvornaar_valg"]', bestil).forEach(function (r) {
      r.addEventListener("change", function () {
        $$(".datochip input", bestil).forEach(function (felt) { visFejl(felt, false); });
      });
    });

    // Valgt dato skal være udfyldt (og ikke ligge før i dag), og Ja kræver mindst ét tidsrum.
    function validerTid(fokus) {
      var foerste = null;
      var valg = $('input[name="hvornaar_valg"]:checked', bestil);
      $$(".tid__raekke", bestil).forEach(function (raekke) {
        var felt = $('input[type="date"]', raekke);
        if (!felt) { return; }
        var mangler = valg && raekke.contains(valg) && (!felt.value || felt.value < idag());
        visFejl(felt, !!mangler);
        if (mangler && !foerste) { foerste = felt; }
      });
      var udenTidsrum = tidsrumJa() && !$('input[type="checkbox"]:checked', tidsrum);
      tidsrumFejl.classList.toggle("vis", udenTidsrum);
      if (udenTidsrum && !foerste) { foerste = $('input[type="checkbox"]', tidsrum); }
      if (foerste && fokus) {
        foerste.focus({ preventScroll: true });
        foerste.closest(".tid").scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return !foerste;
    }

    // Sådan står valget i mailen.
    function hvornaarTekst() {
      var valg = $('input[name="hvornaar_valg"]:checked', bestil);
      if (!valg) { return "Ikke oplyst"; }
      if (valg.value === "specifik") { return "På en specifik dato: " + danskDato($("#b-dato-specifik").value); }
      if (valg.value === "foer") { return "Før en dato: " + danskDato($("#b-dato-foer").value); }
      return "Jeg er fleksibel: " + $("#flex-tekst").textContent.toLowerCase();
    }
    function tidsrumTekst() {
      if (!tidsrumJa()) { return "Nej"; }
      return "Ja: " + $$('input[type="checkbox"]:checked', tidsrum).map(function (c) { return c.value; }).join(", ");
    }

    /* --- afsendelse --- */
    var sendknap = $('button[type="submit"]', bestil);
    var sendbesked = $("#bestilstatus");

    /* Bygger det, der sendes. I andet forsøg (uden billeder) skrives der i stedet,
       hvorfor de mangler — så I kan se, at I skal bede om dem. */
    function byg(medBilleder, aarsag) {
      var data = new FormData(bestil);
      data.set("hvornaar", hvornaarTekst());
      data.set("tidsrum", tidsrumTekst());
      data.delete("hvornaar_valg");
      data.delete("tidsrum_valg");

      var status = "Ingen";
      if (valgte.length && medBilleder) {
        valgte.forEach(function (p, i) {
          // Løbenummer foran navnet: alt taget med iPhone-kameraet hedder "image.jpg".
          data.append("billede_" + (i + 1), p.fil, (i + 1) + "-" + p.navn);
        });
        status = valgte.length + " stk. (" + mb(samlet()) + ") — ligger som links i mailen";
      } else if (valgte.length) {
        status = "Kunden valgte " + valgte.length + " billede(r), men de kunne IKKE sendes med (" + aarsag +
          "). Kunden er bedt om at maile dem.";
      }
      data.append("billeder_status", status);

      data.append("_subject", "Ny forespørgsel fra prisberegneren — GarageKlar");
      data.append("_type", "Forespørgsel fra prisberegner");
      data.append("_side", location.href);
      return data;
    }

    // Årsagen, som den kommer til at stå i mailen til jer.
    function aarsagTil(svar) {
      var alt = svar.koder.concat(svar.beskeder).join(", ");
      if (/NO_FILE_UPLOADS|not permitted/i.test(alt)) {
        return "formularens abonnement hos Formspree tager ikke imod filer";
      }
      if (alt) { return alt; }
      return svar.status ? "fejl " + svar.status : "intet svar — forbindelsen var for langsom eller blev afbrudt";
    }

    /* Kan det hjælpe at sende én gang til uden billeder? Ja, medmindre fejlen
       tydeligt handler om noget andet. */
    function kanSkyldesBilleder(svar) {
      if (svar.filfejl) { return true; }            // Formspree siger det selv
      if (svar.status === 429) { return false; }    // for mange forsøg på kort tid — vent i stedet
      return !svar.felter.length;                   // et forkert felt bliver ikke rigtigt af at fjerne billederne
    }

    function kvitter(billederMangler) {
      var navn = ($("#b-navn").value || "").trim();
      var ekstra = "";
      if (billederMangler) {
        ekstra = "<strong>Dine billeder kom desværre ikke med.</strong> Send dem gerne på mail til " +
          '<a href="mailto:' + KONFIG.BILLED_MAIL + "?subject=" +
          encodeURIComponent("Billeder til forespørgsel" + (navn ? " — " + navn : "")) + '">' +
          KONFIG.BILLED_MAIL + "</a>, og skriv dit navn og telefonnummer i mailen.";
      }
      valgte.forEach(function (p) { URL.revokeObjectURL(p.url); });

      $("#bestilkort").innerHTML = kvittering(
        "Tak for din forespørgsel!",
        "Vi har modtaget dine oplysninger og vender tilbage hurtigst muligt for at aftale det videre forløb. Du hører fra os på telefon.",
        ekstra
      );
      // Flyt fokus til kvitteringen, så den også bliver læst op af en skærmlæser.
      var h = $("#bestilkort h2");
      h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function visSendfejl(svar) {
      var tekst = "Forespørgslen blev ikke sendt. Prøv igen om lidt — eller ring til os på 70 70 78 80.";
      if (svar.felter.indexOf("email") > -1) {
        var mail = $("#b-email");
        visFejl(mail, true);
        mail.focus();
        tekst = "E-mailadressen ser ikke rigtig ud. Ret den, eller lad feltet stå tomt, og send igen.";
      } else if (svar.status === 429) {
        tekst = "Der er sendt for mange forespørgsler på kort tid. Vent et minut, og prøv igen.";
      } else if (svar.status === 0) {
        tekst = "Vi kunne ikke få forbindelse. Tjek din internetforbindelse, og prøv igen — eller ring til os på 70 70 78 80.";
      }
      sendbesked.textContent = tekst;
    }

    function afsend() {
      var medBilleder = valgte.length > 0;
      sendbesked.textContent = "";

      send(bestil, byg(medBilleder), sendknap, function (ok, svar) {
        if (ok) { kvitter(false); return; }

        /* En forespørgsel må aldrig gå tabt på grund af billederne. Kan fejlen
           skyldes dem (ikke med i abonnementet, for store, for langsomt net),
           sendes den én gang til uden — og kunden bedes maile billederne. */
        if (medBilleder && kanSkyldesBilleder(svar)) {
          send(bestil, byg(false, aarsagTil(svar)), sendknap, function (ok2, svar2) {
            if (ok2) { kvitter(true); } else { visSendfejl(svar2); }
          }, "Sender uden billeder …");
          return;
        }
        visSendfejl(svar);
      }, medBilleder ? "Sender billeder …" : "");
    }

    ryd(bestil);
    bestil.addEventListener("submit", function (e) {
      e.preventDefault();
      if (naarKlar) return;                 // venter allerede på billederne
      var felterOk = valider(bestil);       // fokuserer selv det første forkerte felt
      if (!validerTid(felterOk) || !felterOk) return;

      // Billederne er stadig ved at blive gjort klar: vent, og send så af sig selv.
      if (arbejder) {
        var foer = sendknap.innerHTML;
        sendknap.disabled = true;
        sendknap.innerHTML = "Gør billederne klar …";
        naarKlar = function () {
          sendknap.disabled = false;
          sendknap.innerHTML = foer;
          afsend();
        };
        return;
      }
      afsend();
    });
  }

  /* =====================================================================
     10. SMÅTING
     ===================================================================== */
  var aar = $("#aar");
  if (aar) { aar.textContent = new Date().getFullYear(); }

})();
