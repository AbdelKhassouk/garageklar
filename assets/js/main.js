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

    TIMEPRIS: 1195,      // kr. inkl. moms, pr. påbegyndt time
    MIN_TIMER: 1,        // ingen minimumsopgave — der betales for medgået tid
    START_TIMER: 2,      // beregnerens udgangspunkt
    MAKS_TIMER: 40,

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
     3. PRISBEREGNER
     ===================================================================== */
  var fTimer = $("#timer");
  if (fTimer) {
    var fType = $("#opgavetype");
    var uPris = $("#pris");
    var uSpec = $("#spec");
    var bVidere = $("#videre");
    var bMinus = $("#minus");
    var bPlus = $("#plus");

    // Beregneren findes både på forsiden og på /priser/. Basisstien læses fra
    // knappens eget href, så linket peger rigtigt uanset hvor siden ligger.
    var VIDERE_BASE = (bVidere.getAttribute("href") || "bestilling.html").split("?")[0];

    fTimer.min = KONFIG.MIN_TIMER;
    fTimer.max = KONFIG.MAKS_TIMER;
    if (Number(fTimer.value) < KONFIG.MIN_TIMER) { fTimer.value = KONFIG.START_TIMER; }

    function timer() {
      var v = parseInt(fTimer.value, 10);
      if (isNaN(v)) { v = KONFIG.MIN_TIMER; }
      return Math.min(KONFIG.MAKS_TIMER, Math.max(KONFIG.MIN_TIMER, v));
    }

    function opdater() {
      var t = timer();
      var pris = t * KONFIG.TIMEPRIS;

      uPris.textContent = kr(pris);
      uSpec.textContent = fType.value + " · " + t + " timer × " + kr(KONFIG.TIMEPRIS);

      bMinus.disabled = t <= KONFIG.MIN_TIMER;
      bPlus.disabled = t >= KONFIG.MAKS_TIMER;

      bVidere.href = VIDERE_BASE + "?opgave=" + encodeURIComponent(fType.value) +
        "&timer=" + t + "&pris=" + pris;
    }

    bMinus.addEventListener("click", function () {
      fTimer.value = Math.max(KONFIG.MIN_TIMER, timer() - 1); opdater();
    });
    bPlus.addEventListener("click", function () {
      fTimer.value = Math.min(KONFIG.MAKS_TIMER, timer() + 1); opdater();
    });
    fTimer.addEventListener("input", opdater);
    fTimer.addEventListener("blur", function () { fTimer.value = timer(); opdater(); });
    fType.addEventListener("change", opdater);
    $("#beregner").addEventListener("submit", function (e) { e.preventDefault(); });

    opdater();
  }

  /* =====================================================================
     4. FØR / EFTER — genereres og gøres interaktiv
     ===================================================================== */
  var FE = [
    { slug: "bryggers", titel: "Bryggers / depot", sted: "Privat bolig" },
    { slug: "carport",  titel: "Carport",          sted: "Privat bolig" },
    { slug: "entre",    titel: "Entré og gang",    sted: "Privat bolig" },
    { slug: "vaerelse", titel: "Lille værelse",    sted: "Privat bolig" },
    { slug: "stue",     titel: "Stue",             sted: "Privat bolig" }
  ];

  var feGrid = $("#fe-grid");
  if (feGrid) {
    FE.forEach(function (it, i) {
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

      var vindue = $("[data-fe]", art);
      var efter = $(".fe__efter", art);
      var slider = $(".fe__slider", art);

      // .fe__efter er et <picture> — clip-path sættes på elementet
      efter.classList.add("fe__efter");

      function saet(p) {
        p = Math.max(0, Math.min(100, p));
        vindue.style.setProperty("--split", p + "%");
      }
      slider.addEventListener("input", function () { saet(parseFloat(slider.value)); });

      function fraPunkt(clientX) {
        var r = vindue.getBoundingClientRect();
        var p = ((clientX - r.left) / r.width) * 100;
        slider.value = p;
        saet(p);
      }
      var traekker = false;
      vindue.addEventListener("pointerdown", function (e) {
        if (e.target === slider) return;
        traekker = true; vindue.setPointerCapture(e.pointerId); fraPunkt(e.clientX);
      });
      vindue.addEventListener("pointermove", function (e) { if (traekker) { fraPunkt(e.clientX); } });
      vindue.addEventListener("pointerup", function () { traekker = false; });
      vindue.addEventListener("pointercancel", function () { traekker = false; });

      saet(i % 2 === 0 ? 50 : 46);
    });
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
    var opgave = q.get("opgave") || "";
    var t = parseInt(q.get("timer"), 10);
    var p = parseInt(q.get("pris"), 10);

    if (!t || t < KONFIG.MIN_TIMER) { t = KONFIG.MIN_TIMER; }
    if (!p || p < 0) { p = t * KONFIG.TIMEPRIS; }

    var opsum = $("#opsum");
    if (opgave) {
      $("#opsum-opgave").textContent = opgave;
      $("#opsum-timer").textContent = t + " timer";
      $("#opsum-pris").textContent = kr(p);
    } else if (opsum) {
      opsum.innerHTML = '<span>Du har ikke beregnet en pris endnu.</span>' +
        '<a class="tekstlink ret" href="index.html#beregner">Beregn din pris →</a>';
    }

    $("#f-opgave").value = opgave;
    $("#f-timer").value = opgave ? t : "";
    $("#f-pris").value = opgave ? p : "";

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
