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
    document.querySelectorAll('[data-emc="toggle-nav"]').forEach(function (btn) {
      btn.addEventListener("click", function () {
        var nav = document.querySelector(".emc-nav");
        if (nav) nav.classList.toggle("open");
      });
    });

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
