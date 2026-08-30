import { deterministicScoop } from './catalog.mjs';

/* Scoopy — progressive product-demo interactivity. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var C = window.SCOOPY || { brand: "Scoopy", themes: [], scoops: [], tagline: "" };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- brand name + small bits ---- */
  $$(".brandname").forEach(function (el) { el.textContent = C.brand; });
  $$(".brandtag").forEach(function (el) { el.textContent = C.tagline; });
  var yearEl = $("#year"); if (yearEl) yearEl.textContent = new Date().getFullYear();
  var tc = $("#themeCount"); if (tc) tc.textContent = C.themeCount;
  var pc = $("#prodCount"); if (pc) pc.textContent = C.totalProducts;
  document.title = C.brand + " — " + C.tagline + " · Cute stationery in " + C.city;

  var randEmoji = ["🍓", "🩷", "⭐", "🌸", "🧸", "✏️", "🎀", "🧁", "🐹", "🍡", "☁️", "🫧"];

  /* ---- scoop tiers ---- */
  var sg = $("#scoopGrid");
  if (sg) {
    sg.innerHTML = C.scoops.map(function (s) {
      var f = s.featured;
      return '<article class="scoop-card reveal ' + (f ? "scoop-card--featured" : "") + '">' +
        (f ? '<div class="scoop-card__badge">Most loved</div>' : "") +
        '<div class="scoop-card__emoji">' + s.emoji + "</div>" +
        "<h3>" + s.name + "</h3>" +
        '<div class="scoop-card__items">' + s.items + "</div>" +
        '<div class="scoop-card__price">' + s.price + "</div>" +
        '<p class="scoop-card__desc">' + s.desc + "</p>" +
        '<a href="#build" class="btn ' + (f ? "btn--cta" : "btn--ghost") + '">Try this tier</a>' +
        "</article>";
    }).join("");
  }

  /* ---- collections ---- */
  var cg = $("#collectionGrid");
  if (cg) {
    cg.innerHTML = C.themes.map(function (t) {
      return '<article class="col-card reveal" data-launch="' + (t.launch ? "1" : "0") + '">' +
        (t.launch ? '<div class="col-card__launch">Featured in demo</div>' : "") +
        '<div class="col-card__top"><span class="col-card__emoji">' + t.emoji + "</span>" +
        '<span class="col-card__count">' + t.count + " items</span></div>" +
        "<h3>" + t.key + "</h3>" +
        '<p class="col-card__blurb">' + (t.blurb || "") + "</p>" +
        '<div class="col-card__samples">' +
        t.samples.slice(0, 4).map(function (s) { return '<span class="tag">' + s + "</span>"; }).join("") +
        "</div></article>";
    }).join("");
  }

  /* ---- filter chips ---- */
  $$(".filter .chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      $$(".filter .chip").forEach(function (c) { c.classList.remove("is-active"); });
      chip.classList.add("is-active");
      var f = chip.getAttribute("data-filter");
      $$(".col-card").forEach(function (card) {
        var show = f === "all" || (f === "launch" && card.getAttribute("data-launch") === "1");
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* ---- selects (build + waitlist) ---- */
  function themeOptions() {
    return C.themes.map(function (t) { return '<option value="' + t.key + '">' + t.emoji + " " + t.key + "</option>"; }).join("");
  }
  var bt = $("#buildTheme"); if (bt) bt.innerHTML = themeOptions();
  var wt = $("#wlTheme"); if (wt) wt.innerHTML = '<option value="">Surprise me ✨</option>' + themeOptions();
  var bs = $("#buildSize");
  if (bs) bs.innerHTML = C.scoops.map(function (s, i) { return '<option value="' + i + '">' + s.emoji + " " + s.name + " · " + s.price + "</option>"; }).join("");

  /* ---- build your scoop ---- */
  var stage = $("#buildStage");
  var scoopBtn = $("#scoopBtn");
  if (scoopBtn && stage) {
    scoopBtn.addEventListener("click", function () {
      var theme = C.themes.filter(function (t) { return t.key === bt.value; })[0] || C.themes[0];
      var sizeIdx = parseInt(bs.value, 10) || 0;
      var nPeek = [3, 4, 5, 5][sizeIdx] || 4;
      var show = deterministicScoop(
        theme.samples.map(function (name) { return { id: name, name: name }; }),
        nPeek,
        theme.key + ':' + C.scoops[sizeIdx].name
      );
      stage.innerHTML = "";
      show.forEach(function (item, i) {
        var d = document.createElement("div");
        d.className = "peek";
        d.style.animationDelay = (i * 90) + "ms";
        var icon = document.createElement("span");
        icon.textContent = randEmoji[i % randEmoji.length];
        d.append(icon, document.createTextNode(item.name));
        stage.appendChild(d);
      });
      var more = document.createElement("div");
      more.className = "peek";
      more.style.animationDelay = (show.length * 90) + "ms";
      var moreIcon = document.createElement("span");
      moreIcon.textContent = "🎁";
      more.append(moreIcon, document.createTextNode("+ simulated surprises inside"));
      stage.appendChild(more);
    });
  }

  /* ---- waitlist form ---- */
  var form = $("#waitlistForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = $("#wlEmail");
      if (!email.value || email.value.indexOf("@") < 0) { email.focus(); email.style.borderColor = "#C96A76"; return; }
      var name = ($("#wlName").value || "friend").trim().split(/\s+/)[0].slice(0, 40);
      form.classList.add("is-done");
      form.replaceChildren();
      var success = document.createElement("div");
      success.className = "join__success";
      var icon = document.createElement("span");
      icon.className = "big";
      icon.textContent = "🎉";
      var heading = document.createElement("h3");
      heading.textContent = "Demo state complete, " + name + ".";
      var message = document.createElement("p");
      message.textContent = "Nothing was stored or sent. This browser-only form exists to demonstrate the final product state.";
      success.append(icon, heading, message);
      form.appendChild(success);
    });
  }

  /* ---- reveal on scroll ---- */
  function observeReveals() {
    var els = $$(".reveal:not(.in)");
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (el) { el.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }
  observeReveals();

  /* ---- floaties parallax (layer-level, keeps per-element bob) ---- */
  var floaties = $(".floaties");
  if (floaties && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener("mousemove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 26;
      ty = (e.clientY / window.innerHeight - 0.5) * 26;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    function loop() {
      cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
      floaties.style.transform = "translate(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px)";
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) { raf = requestAnimationFrame(loop); } else { raf = null; }
    }
  }

  /* ---- mobile nav ---- */
  var nav = $(".nav"), toggle = $(".nav__toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav__links a, .nav__join").forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); });
    });
  }
})();
