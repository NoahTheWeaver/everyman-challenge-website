/* The Everyman Challenge — lightweight runtime.
 * Reproduces the interactive behaviors that the design canvas handled at edit
 * time, with plain vanilla JS: hover styles, mobile nav, video play, the story
 * rail, lead-form submission, the footer year, and graceful image fallbacks. */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    // --- prototype splash (shown once per session; append ?nosplash to skip) ---
    (function () {
      try {
        if (location.search.indexOf("nosplash") !== -1) return;
        if (sessionStorage.getItem("emc-splash-seen-4")) return;
      } catch (e) { /* sessionStorage may be unavailable */ }

      var ov = document.createElement("div");
      ov.className = "emc-splash";
      ov.setAttribute("role", "dialog");
      ov.setAttribute("aria-modal", "true");
      ov.setAttribute("aria-label", "Prototype notice");
      ov.innerHTML =
        '<div class="emc-splash-card">' +
        '<img class="emc-splash-seal" src="assets/emc-logo.png" alt="">' +
        '<p class="emc-splash-eyebrow">Early Prototype</p>' +
        "<h2>Heads up — this is a work in progress</h2>" +
        "<p>This is an early prototype exploring new messaging for The Everyman " +
        "Challenge. Some of the copy is still placeholder, and it’s not fully " +
        "set up for mobile yet.</p>" +
        '<p>Spot something or have thoughts? Send feedback to Noah at ' +
        '<a class="emc-splash-mail" href="mailto:noah@nuggetscientific.com?subject=EMC%20prototype%20feedback">' +
        "noah@nuggetscientific.com</a>.</p>" +
        '<button type="button" class="emc-splash-go">Take me to the website&nbsp;&nbsp;→</button>' +
        "</div>";

      function close() {
        ov.classList.remove("emc-in");
        ov.classList.add("emc-out");
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        try { sessionStorage.setItem("emc-splash-seen-4", "1"); } catch (e) {}
        setTimeout(function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 460);
      }

      document.body.appendChild(ov);
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { ov.classList.add("emc-in"); });
      });
      ov.querySelector(".emc-splash-go").addEventListener("click", close);
      ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
      document.addEventListener("keydown", function onKey(e) {
        if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
      });
    })();

    // --- style-hover: apply the hover style on pointer enter, restore on leave ---
    document.querySelectorAll("[style-hover]").forEach(function (el) {
      var base = el.getAttribute("style") || "";
      var hover = el.getAttribute("style-hover") || "";
      var sep = base && !base.trim().endsWith(";") ? ";" : "";
      el.addEventListener("mouseenter", function () {
        el.setAttribute("style", base + sep + hover);
      });
      el.addEventListener("mouseleave", function () {
        el.setAttribute("style", base);
      });
    });

    // --- mobile nav toggle ---
    var header = document.querySelector(".emc-header");
    document.querySelectorAll('[data-emc="toggle-nav"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nav = document.querySelector(".emc-nav");
        if (nav) nav.classList.toggle("open");
        if (header) header.classList.remove("emc-hidden"); // keep header visible while menu is open
      });
    });

    // --- scroll-aware header: compact on scroll, hide on scroll-down, reveal on scroll-up ---
    if (header) {
      var lastY = window.scrollY || 0;
      var ticking = false;
      var update = function () {
        var y = window.scrollY || 0;
        header.classList.toggle("emc-scrolled", y > 8);
        var menuOpen = document.querySelector(".emc-nav.open");
        if (!menuOpen && y > 140 && y > lastY + 4) {
          header.classList.add("emc-hidden");        // scrolling down, past the fold
        } else if (y < lastY - 4 || y <= 140) {
          header.classList.remove("emc-hidden");      // scrolling up, or near the top
        }
        lastY = y;
        ticking = false;
      };
      window.addEventListener("scroll", function () {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      update();
    }

    // --- video: swap the poster for the (deferred) YouTube embed on click ---
    document.querySelectorAll('[data-emc="play-video"]').forEach(function (poster) {
      poster.addEventListener("click", function () {
        var notPlaying = poster.closest('[data-sc="notPlaying"]');
        var container = notPlaying ? notPlaying.parentElement : poster.closest("section");
        if (!container) return;
        var playing = container.querySelector('[data-sc="playing"]');
        var iframe = playing && playing.querySelector("iframe");
        if (iframe && iframe.dataset.src && !iframe.src) iframe.src = iframe.dataset.src;
        if (notPlaying) notPlaying.style.display = "none";
        if (playing) playing.style.display = "block";
      });
    });

    // --- story rail: arrow buttons scroll the track ---
    function rail() {
      return document.querySelector('[data-emc="rail-track"]');
    }
    document.querySelectorAll('[data-emc="rail-prev"]').forEach(function (b) {
      b.addEventListener("click", function () {
        var t = rail();
        if (t) t.scrollBy({ left: -380, behavior: "smooth" });
      });
    });
    document.querySelectorAll('[data-emc="rail-next"]').forEach(function (b) {
      b.addEventListener("click", function () {
        var t = rail();
        if (t) t.scrollBy({ left: 380, behavior: "smooth" });
      });
    });

    // --- lead forms: show the success state in place of the form on submit ---
    document.querySelectorAll('[data-emc="lead-form"]').forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var notSub = form.closest("[data-sc]");
        var col = notSub ? notSub.parentElement : form.parentElement;
        var sub = col && col.querySelector('[data-sc="ctaSubmitted"], [data-sc="submitted"]');
        if (notSub) notSub.style.display = "none";
        if (sub) sub.style.display = "block";
      });
    });

    // --- footer year ---
    document.querySelectorAll('[data-emc="year"]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    // --- hide images that fail to load (e.g. assets not yet supplied) ---
    function markMissing(img) {
      img.classList.add("emc-img-missing");
    }
    document.querySelectorAll("img").forEach(function (img) {
      if (img.complete && img.naturalWidth === 0) markMissing(img);
      else img.addEventListener("error", function () { markMissing(img); });
    });
  });
})();
