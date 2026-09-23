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

    MAKS_FILER: 8,
    MAKS_FIL_MB: 12
  };

  /* ------------------------------------------------------------ hjælpere */
  var $ = function (s, k) { return (k || document).querySelector(s); };
  var $$ = function (s, k) { return Array.prototype.slice.call((k || document).querySelectorAll(s)); };

  function kr(n) {
    return new Intl.NumberFormat("da-DK").format(Math.round(n)) + " kr.";
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
  }

  // Alle vinduer på siden — både de netop byggede og undersidernes faste kort.
  $$("[data-fe]").forEach(function (vindue, i) {
    gorFeInteraktiv(vindue, i % 2 === 0 ? 50 : 46);
  });

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

  function valider(form) {
    var ok = true, foerste = null;
    $$("[required]", form).forEach(function (felt) {
      var v = (felt.value || "").trim();
      var gyldig = v !== "";
      if (gyldig && felt.type === "tel") { gyldig = cifre(v).length >= 8; }
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
    $$("[required]", form).forEach(function (felt) {
      felt.addEventListener("input", function () {
        if (felt.getAttribute("aria-invalid") === "true") { visFejl(felt, false); }
      });
    });
  }

  function kvittering(titel, tekst) {
    return '<div class="kvit">' +
      '<div class="kvit__ikon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<h2>' + titel + '</h2><p>' + tekst + '</p>' +
      '<a class="knap knap--sort" href="index.html">Tilbage til forsiden</a></div>';
  }

  /**
   * Sender formulardata. Er FORM_ENDPOINT tom, køres demo-tilstand:
   * data logges i konsollen og kvitteringen vises.
   */
  function send(form, data, knap, faerdig) {
    var oprindelig = knap.innerHTML;
    knap.disabled = true;
    knap.innerHTML = "Sender …";

    if (!KONFIG.FORM_ENDPOINT) {
      var udskrift = {};
      data.forEach(function (v, k) { udskrift[k] = (v instanceof File) ? v.name : v; });
      console.info("[GarageKlar] Demo-tilstand — intet er sendt. Data:", udskrift);
      setTimeout(function () { faerdig(true); }, 700);
      return;
    }

    Object.keys(KONFIG.FORM_EKSTRA).forEach(function (k) {
      data.append(k, KONFIG.FORM_EKSTRA[k]);
    });

    // Accept: application/json får Formspree til at svare med JSON i stedet for
    // at omdirigere til deres egen kvitteringsside.
    fetch(KONFIG.FORM_ENDPOINT, {
      method: "POST",
      body: data,
      headers: { "Accept": "application/json" }
    })
      .then(function (r) { faerdig(r.ok); })
      .catch(function () { faerdig(false); })
      .then(function () {
        knap.disabled = false;
        knap.innerHTML = oprindelig;
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
          alert("Noget gik galt. Prøv igen, eller ring til os på 29 33 36 40.");
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

    /* --- billedupload --- */
    var filfelt = $("#billeder");
    var liste = $("#filliste");
    var uploadboks = $("#uploadboks");
    var valgte = [];

    function tegnFiler() {
      liste.innerHTML = "";
      valgte.forEach(function (fil, i) {
        var d = document.createElement("div");
        d.className = "fil";
        var url = URL.createObjectURL(fil);
        d.innerHTML =
          '<img src="' + url + '" alt="">' +
          '<span class="fil__navn">' + fil.name + '</span>' +
          '<button type="button" aria-label="Fjern billede">' +
          '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></button>';
        $("button", d).addEventListener("click", function () {
          URL.revokeObjectURL(url);
          valgte.splice(i, 1);
          tegnFiler();
        });
        liste.appendChild(d);
      });
      $("#filtal").textContent = valgte.length
        ? valgte.length + " billede" + (valgte.length === 1 ? "" : "r") + " valgt"
        : "";
    }

    function tilfoej(filer) {
      Array.prototype.forEach.call(filer, function (f) {
        if (!/^image\//.test(f.type)) return;
        if (f.size > KONFIG.MAKS_FIL_MB * 1024 * 1024) {
          alert('"' + f.name + '" er for stor (maks ' + KONFIG.MAKS_FIL_MB + " MB).");
          return;
        }
        if (valgte.length >= KONFIG.MAKS_FILER) return;
        valgte.push(f);
      });
      tegnFiler();
    }

    filfelt.addEventListener("change", function () { tilfoej(filfelt.files); filfelt.value = ""; });

    ["dragenter", "dragover"].forEach(function (n) {
      uploadboks.addEventListener(n, function (e) { e.preventDefault(); uploadboks.classList.add("over"); });
    });
    ["dragleave", "drop"].forEach(function (n) {
      uploadboks.addEventListener(n, function (e) { e.preventDefault(); uploadboks.classList.remove("over"); });
    });
    uploadboks.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files) { tilfoej(e.dataTransfer.files); }
    });

    /* --- afsendelse --- */
    ryd(bestil);
    bestil.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!valider(bestil)) return;

      var data = new FormData(bestil);
      valgte.forEach(function (f, i) { data.append("billede_" + (i + 1), f, f.name); });
      data.append("_subject", "Ny forespørgsel fra prisberegneren — GarageKlar");
      data.append("_type", "Forespørgsel fra prisberegner");
      data.append("_side", location.href);

      send(bestil, data, $('button[type="submit"]', bestil), function (ok) {
        if (ok) {
          $("#bestilkort").innerHTML = kvittering(
            "Tak for din forespørgsel!",
            "Vi har modtaget dine oplysninger og vender tilbage hurtigst muligt for at aftale det videre forløb. Du hører fra os på telefon."
          );
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          alert("Noget gik galt. Prøv igen, eller ring til os på 29 33 36 40.");
        }
      });
    });
  }

  /* =====================================================================
     10. SMÅTING
     ===================================================================== */
  var aar = $("#aar");
  if (aar) { aar.textContent = new Date().getFullYear(); }

})();
