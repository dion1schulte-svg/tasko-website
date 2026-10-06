/* ==========================================================================
   tasko – main.js (Vanilla, defer)
   Module: Nav-Scrollzustand · Aktiver Anker · Mobil-Menü · Tabs · Formular · Reveals · Hero-Mockup
   ========================================================================== */

(function () {
  "use strict";

  // <html class="js"> wird bereits synchron von early.js gesetzt
  var root = document.documentElement;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Nav: Glass-Pill ab 80px Scroll ---------- */
  function initNavScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var ticking = false;

    function update() {
      header.classList.toggle("is-scrolled", window.scrollY > 80);
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ---------- Aktiver Anker per IntersectionObserver ---------- */
  function initActiveAnchor() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".nav__link[href*='#'], .menu__link[href*='#']")
    );
    if (!links.length || !("IntersectionObserver" in window)) return;

    var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
    if (!sections.length) return;

    function setActive(id) {
      links.forEach(function (link) {
        var hash = link.getAttribute("href").split("#")[1];
        if (hash === id) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    }

    // Band im oberen Drittel des Viewports: die Sektion darin ist „aktiv“.
    // Sektionen ohne eigenen Nav-Link (Hero #top, #so-gehts, #umfrage) setzen den Zustand zurück,
    // dadurch ist am Seitenanfang kein Anker aktiv.
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }

  /* ---------- Mobil-Menü: Overlay, Fokusfalle, Escape ---------- */
  function initMobileMenu() {
    var toggle = document.querySelector(".nav__toggle");
    var menu = document.getElementById("menu");
    if (!toggle || !menu) return;

    var header = document.querySelector(".site-header");
    var inertTargets = Array.prototype.slice.call(document.querySelectorAll("main, .site-footer"));
    var desktop = window.matchMedia("(min-width: 960px)");
    var isOpen = false;

    function focusables() {
      var nodes = header.querySelectorAll("a[href], button:not([disabled])");
      var menuNodes = menu.querySelectorAll("a[href], button:not([disabled])");
      return Array.prototype.slice.call(nodes)
        .concat(Array.prototype.slice.call(menuNodes))
        .filter(function (el) { return el.getClientRects().length > 0; });
    }

    function open() {
      isOpen = true;
      menu.classList.add("is-open");
      root.classList.add("menu-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Menü schließen");
      inertTargets.forEach(function (el) { el.inert = true; });

      var first = menu.querySelector("a[href]");
      // Warten, bis visibility greift, sonst lässt sich nicht fokussieren
      window.requestAnimationFrame(function () {
        if (first) first.focus({ preventScroll: true });
      });
    }

    function close(returnFocus) {
      if (!isOpen) return;
      isOpen = false;
      menu.classList.remove("is-open");
      root.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Menü öffnen");
      inertTargets.forEach(function (el) { el.inert = false; });
      if (returnFocus) toggle.focus({ preventScroll: true });
    }

    toggle.addEventListener("click", function () {
      if (isOpen) {
        close(true);
      } else {
        open();
      }
    });

    // Klick auf einen Eintrag schließt das Menü, die Anker-Navigation läuft normal weiter
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) close(false);
    });

    document.addEventListener("keydown", function (event) {
      if (!isOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }

      if (event.key === "Tab") {
        var items = focusables();
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (items.indexOf(document.activeElement) === -1) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    // Beim Wechsel auf Desktop-Breite Menü schließen
    function onBreakpoint(mq) { if (mq.matches) close(false); }
    if (desktop.addEventListener) {
      desktop.addEventListener("change", onBreakpoint);
    } else if (desktop.addListener) {
      desktop.addListener(onBreakpoint);
    }
  }

  /* ---------- Scroll-Reveals ---------- */
  function initReveals() {
    var singles = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
    var groups = Array.prototype.slice.call(document.querySelectorAll("[data-reveal-group]"));

    // Stagger-Index für Kinder einer Gruppe (CSSOM, CSP-konform)
    groups.forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty("--reveal-i", i);
      });
    });

    var targets = singles.concat(groups);
    if (!targets.length) return;

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target); // einmalig
        }
      });
    }, { threshold: 0.15 });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Hero-Mockup: Scroll-Parallaxe + 3D-Neigung (nur Desktop) ---------- */
  function initHeroMockup() {
    var hero = document.querySelector(".hero");
    var wrap = document.querySelector(".hero__phone-wrap");
    var phone = document.querySelector(".phone");
    if (!hero || !wrap || !phone) return;

    var desktop = window.matchMedia("(min-width: 960px) and (hover: hover) and (pointer: fine)");
    var MAX_SHIFT = 30;  // px
    var MAX_TILT = 4;    // Grad

    var target = { x: 0, y: 0 };
    var current = { x: 0, y: 0 };
    var frame = null;

    function enabled() {
      return desktop.matches && !reducedMotion.matches;
    }

    function render() {
      frame = null;
      if (!enabled()) return;

      var shift = Math.min(MAX_SHIFT, Math.max(0, window.scrollY * 0.1));
      wrap.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";

      // Neigung weich nachziehen
      current.x += (target.x - current.x) * 0.12;
      current.y += (target.y - current.y) * 0.12;
      phone.style.transform =
        "rotateX(" + current.x.toFixed(3) + "deg) rotateY(" + current.y.toFixed(3) + "deg)";

      if (Math.abs(target.x - current.x) > 0.01 || Math.abs(target.y - current.y) > 0.01) {
        schedule();
      }
    }

    function schedule() {
      if (frame === null) frame = window.requestAnimationFrame(render);
    }

    function reset() {
      target.x = target.y = current.x = current.y = 0;
      wrap.style.removeProperty("transform");
      phone.style.removeProperty("transform");
    }

    window.addEventListener("scroll", function () {
      if (enabled() && window.scrollY < hero.offsetHeight) schedule();
    }, { passive: true });

    hero.addEventListener("pointermove", function (event) {
      if (!enabled() || event.pointerType !== "mouse") return;
      var rect = phone.getBoundingClientRect();
      var nx = (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2);
      var ny = (event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2);
      nx = Math.max(-1, Math.min(1, nx));
      ny = Math.max(-1, Math.min(1, ny));
      target.y = nx * MAX_TILT;
      target.x = -ny * MAX_TILT;
      schedule();
    });

    hero.addEventListener("pointerleave", function () {
      target.x = target.y = 0;
      schedule();
    });

    function onChange() {
      if (enabled()) {
        schedule();
      } else {
        reset();
      }
    }
    [desktop, reducedMotion].forEach(function (mq) {
      if (mq.addEventListener) {
        mq.addEventListener("change", onChange);
      } else if (mq.addListener) {
        mq.addListener(onChange);
      }
    });

    schedule();
  }

  /* ---------- Tabs (ARIA-Tablist, Pfeiltasten, automatische Aktivierung) ---------- */
  function initTabs() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-tabs]"), function (root) {
      var list = root.querySelector("[role='tablist']");
      var tabs = Array.prototype.slice.call(root.querySelectorAll("[role='tab']"));
      var panels = tabs.map(function (tab) {
        return document.getElementById(tab.getAttribute("aria-controls"));
      });
      if (!list || !tabs.length) return;

      function select(index, moveFocus) {
        tabs.forEach(function (tab, i) {
          var active = i === index;
          tab.setAttribute("aria-selected", active ? "true" : "false");
          tab.tabIndex = active ? 0 : -1;
          if (panels[i]) panels[i].hidden = !active;
        });
        list.setAttribute("data-active", String(index));
        if (moveFocus) tabs[index].focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { select(i, false); });

        tab.addEventListener("keydown", function (event) {
          var last = tabs.length - 1;
          var next = null;
          if (event.key === "ArrowRight") next = i === last ? 0 : i + 1;
          if (event.key === "ArrowLeft") next = i === 0 ? last : i - 1;
          if (event.key === "Home") next = 0;
          if (event.key === "End") next = last;
          if (next !== null) {
            event.preventDefault();
            select(next, true);
          }
        });
      });

      select(0, false);
    });
  }

  /* ---------- Kontaktformular (Formspree, fetch mit Fallback auf normales POST) ---------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form || !window.fetch || !window.FormData) return;

    var status = form.querySelector(".form__status");
    var submit = form.querySelector(".form__submit");
    var submitLabel = form.querySelector(".form__submit-label");
    var fields = Array.prototype.slice.call(form.querySelectorAll(".field__input"));
    var attempted = false;

    // Eigene, deutschsprachige Validierung statt Browser-Bubbles
    form.setAttribute("novalidate", "");

    function messageFor(field) {
      var error = document.getElementById(field.getAttribute("aria-describedby"));
      if (!error) return "";
      if (field.validity.valueMissing) return error.getAttribute("data-msg-missing") || "";
      if (field.validity.typeMismatch || field.validity.patternMismatch) {
        return error.getAttribute("data-msg-invalid") || "";
      }
      return "";
    }

    function check(field) {
      var error = document.getElementById(field.getAttribute("aria-describedby"));
      var valid = field.checkValidity();
      if (valid) {
        field.removeAttribute("aria-invalid");
        if (error) error.textContent = "";
      } else {
        field.setAttribute("aria-invalid", "true");
        if (error) error.textContent = messageFor(field);
      }
      return valid;
    }

    fields.forEach(function (field) {
      // Erst nach dem ersten Absendeversuch live prüfen, nicht beim ersten Tippen
      field.addEventListener("input", function () { if (attempted) check(field); });
      field.addEventListener("change", function () { if (attempted) check(field); });
      field.addEventListener("blur", function () { if (attempted) check(field); });
    });

    function setStatus(type) {
      status.classList.remove("is-success", "is-error");
      if (!type) {
        status.textContent = "";
        return;
      }
      status.classList.add(type === "success" ? "is-success" : "is-error");
      status.textContent = status.getAttribute(type === "success" ? "data-msg-success" : "data-msg-error");
    }

    function setBusy(busy) {
      submit.disabled = busy;
      submit.setAttribute("aria-busy", busy ? "true" : "false");
      submitLabel.textContent = busy ? "Wird gesendet …" : "Nachricht senden";
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      attempted = true;
      setStatus(null);

      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!check(field) && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      setBusy(true);

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (!response.ok) throw new Error("HTTP " + response.status);
          form.reset();
          attempted = false;
          setStatus("success");
        })
        .catch(function () {
          setStatus("error");
        })
        .then(function () {
          setBusy(false);
        });
    });
  }

  function init() {
    initNavScroll();
    initActiveAnchor();
    initMobileMenu();
    initTabs();
    initContactForm();
    initReveals();
    initHeroMockup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
