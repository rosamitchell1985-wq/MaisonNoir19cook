/* ==========================================================================
   MAISON NOIR - shared behaviour
   Vanilla JS, no dependencies, no build step.
   Modules: overlay nav, nav dropdowns, scroll reveal, letter reveal,
            accordions, form validation, cookie consent, back to top,
            order-online quantity + basket, gift-card amount picker.
   No scroll event listeners anywhere: IntersectionObserver only.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. OVERLAY NAVIGATION
        Full-screen menu. Focus is trapped while open, Escape closes,
        focus returns to the toggle on close.
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.getElementById('navToggle');
    var overlay = document.getElementById('navOverlay');
    if (!toggle || !overlay) return;

    var closeBtn = overlay.querySelector('.navov__close');
    var lastFocused = null;

    function focusables() {
      return Array.prototype.filter.call(
        overlay.querySelectorAll('a[href], button:not([disabled])'),
        function (el) { return el.offsetParent !== null; }
      );
    }

    function open() {
      lastFocused = document.activeElement;
      overlay.hidden = false;
      // Force a reflow so the opacity transition actually runs.
      void overlay.offsetHeight;
      overlay.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('nav-open');
      var first = closeBtn || focusables()[0];
      if (first) first.focus();
    }

    function close() {
      overlay.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      var delay = reduceMotion ? 0 : 500;
      window.setTimeout(function () { overlay.hidden = true; }, delay);
      if (lastFocused) lastFocused.focus();
    }

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') { close(); } else { open(); }
    });
    if (closeBtn) closeBtn.addEventListener('click', close);

    document.addEventListener('keydown', function (e) {
      if (overlay.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var list = focusables();
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ------------------------------------------------------------------
     2. NAV DROPDOWN GROUPS (inside the overlay)
     ------------------------------------------------------------------ */
  function initNavDropdowns() {
    var btns = document.querySelectorAll('.navdrop__btn');
    Array.prototype.forEach.call(btns, function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      // A group containing the current page opens by default.
      if (panel.querySelector('[aria-current="page"]')) {
        btn.setAttribute('aria-expanded', 'true');
        panel.classList.add('is-open');
      }
      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        panel.classList.toggle('is-open', !isOpen);
      });
    });
  }

  /* ------------------------------------------------------------------
     3. SCROLL REVEAL - 1s fades, IntersectionObserver, once only
     ------------------------------------------------------------------ */
  function initReveal() {
    var items = document.querySelectorAll('.rv');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     4. LETTER-BY-LETTER TITLE REVEAL
        Only on elements marked .split. Whitespace is preserved and the
        original text stays available to screen readers via aria-label.
     ------------------------------------------------------------------ */
  function initSplit() {
    var targets = document.querySelectorAll('.split');
    if (!targets.length || reduceMotion) return;

    Array.prototype.forEach.call(targets, function (el) {
      var text = el.textContent;
      el.setAttribute('aria-label', text.trim());
      var frag = document.createDocumentFragment();
      var visible = 0;
      for (var i = 0; i < text.length; i++) {
        var chr = text.charAt(i);
        if (chr === ' ') {
          frag.appendChild(document.createTextNode(' '));
          continue;
        }
        var span = document.createElement('span');
        span.className = 'ch';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = chr;
        span.style.animationDelay = (visible * 38) + 'ms';
        visible++;
        frag.appendChild(span);
      }
      el.textContent = '';
      el.appendChild(frag);
    });
  }

  /* ------------------------------------------------------------------
     5. ACCORDIONS
     ------------------------------------------------------------------ */
  function initAccordions() {
    var btns = document.querySelectorAll('.acc__btn');
    Array.prototype.forEach.call(btns, function (btn) {
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        panel.classList.toggle('is-open', !isOpen);
      });
    });
  }

  /* ------------------------------------------------------------------
     6. FORM VALIDATION
        Inline errors below each field, announced, focus moves to the
        first invalid field. No native browser bubbles.
     ------------------------------------------------------------------ */
  var VALIDATORS = {
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v); },
    // Accepts +1 (212) 555-0142, 212-555-0142, 2125550142
    tel: function (v) { return /^\+?1?[\s.\-(]*\d{3}[\s.\-)]*\d{3}[\s.\-]*\d{4}$/.test(v.trim()); },
    number: function (v) { return v !== '' && !isNaN(Number(v)); }
  };

  function fieldWrap(input) {
    var node = input;
    while (node && node !== document.body) {
      if (node.classList && node.classList.contains('field')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function showError(input, message) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.add('has-error');
    var box = wrap.querySelector('.error');
    if (box) box.textContent = message;
    input.setAttribute('aria-invalid', 'true');
  }

  function clearError(input) {
    var wrap = fieldWrap(input);
    if (!wrap) return;
    wrap.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
  }

  function validateInput(input) {
    var value = (input.value || '').trim();
    var label = input.getAttribute('data-label') || 'This field';

    if (input.hasAttribute('required')) {
      if (input.type === 'checkbox' && !input.checked) {
        showError(input, label + ' is required to continue.');
        return false;
      }
      if (input.type !== 'checkbox' && value === '') {
        showError(input, label + ' is required.');
        return false;
      }
    }
    if (value === '') { clearError(input); return true; }

    if (input.type === 'email' && !VALIDATORS.email(value)) {
      showError(input, 'Enter a complete email address, for example name@example.com.');
      return false;
    }
    if (input.type === 'tel' && !VALIDATORS.tel(value)) {
      showError(input, 'Enter a 10 digit US phone number, for example (212) 555-0142.');
      return false;
    }
    if (input.type === 'number') {
      if (!VALIDATORS.number(value)) { showError(input, 'Enter a number.'); return false; }
      var n = Number(value);
      var min = input.getAttribute('min');
      var max = input.getAttribute('max');
      if (min !== null && n < Number(min)) { showError(input, label + ' must be at least ' + min + '.'); return false; }
      if (max !== null && n > Number(max)) { showError(input, label + ' cannot be more than ' + max + '.'); return false; }
    }
    if (input.type === 'date' && input.getAttribute('data-future') === 'true') {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      var picked = new Date(value + 'T00:00:00');
      if (picked < today) { showError(input, 'Choose today or a later date.'); return false; }
    }
    var minLen = input.getAttribute('data-minlength');
    if (minLen && value.length < Number(minLen)) {
      showError(input, label + ' needs at least ' + minLen + ' characters.');
      return false;
    }

    clearError(input);
    return true;
  }

  function initForms() {
    var forms = document.querySelectorAll('form[data-validate]');
    Array.prototype.forEach.call(forms, function (form) {
      var controls = form.querySelectorAll('input, select, textarea');

      Array.prototype.forEach.call(controls, function (input) {
        if (input.type === 'hidden' || input.type === 'submit') return;
        input.addEventListener('blur', function () { validateInput(input); });
        input.addEventListener('input', function () {
          var wrap = fieldWrap(input);
          if (wrap && wrap.classList.contains('has-error')) validateInput(input);
        });
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var firstBad = null;
        Array.prototype.forEach.call(controls, function (input) {
          if (input.type === 'hidden' || input.type === 'submit') return;
          if (!validateInput(input) && !firstBad) firstBad = input;
        });

        var status = form.querySelector('.formstatus');
        if (firstBad) {
          if (status) {
            status.textContent = 'Please correct the highlighted fields and submit again.';
            status.classList.add('is-shown');
          }
          firstBad.focus();
          return;
        }
        if (status) {
          status.textContent = form.getAttribute('data-success') ||
            'Thank you. Your request has been recorded and a member of our team will reply within one business day.';
          status.classList.add('is-shown');
          status.focus();
        }
        form.reset();
        // Clear any lingering error styling after a successful reset.
        Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) {
          f.classList.remove('has-error');
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     7. COOKIE CONSENT
        No non-essential cookie or tracking script is set before the
        visitor accepts. The stored record lives in localStorage, which
        is strictly necessary for honouring the choice itself.
     ------------------------------------------------------------------ */
  var CONSENT_KEY = 'mn_consent_v1';

  function readConsent() {
    try { return JSON.parse(window.localStorage.getItem(CONSENT_KEY)); }
    catch (err) { return null; }
  }

  function writeConsent(obj) {
    try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(obj)); }
    catch (err) { /* storage blocked: the banner simply reappears next visit */ }
  }

  function applyConsent(consent) {
    // Hook point for analytics and advertising tags. Nothing loads unless
    // the matching category was granted.
    window.MN_CONSENT = consent;
    if (consent && consent.analytics) {
      document.documentElement.setAttribute('data-analytics', 'granted');
    }
    if (consent && consent.advertising) {
      document.documentElement.setAttribute('data-advertising', 'granted');
    }
  }

  function initCookies() {
    var banner = document.getElementById('cookieBanner');
    if (!banner) return;

    var prefs = document.getElementById('cookiePrefs');
    var manageBtn = document.getElementById('cookieManage');
    var acceptBtn = document.getElementById('cookieAccept');
    var rejectBtn = document.getElementById('cookieReject');
    var saveBtn = document.getElementById('cookieSave');
    var analytics = document.getElementById('prefAnalytics');
    var advertising = document.getElementById('prefAdvertising');
    var openers = document.querySelectorAll('[data-cookie-open]');

    function show() {
      banner.hidden = false;
      void banner.offsetHeight;
      banner.classList.add('is-shown');
    }
    function hide() {
      banner.classList.remove('is-shown');
      window.setTimeout(function () { banner.hidden = true; }, reduceMotion ? 0 : 700);
    }
    function save(consent) {
      consent.date = new Date().toISOString();
      writeConsent(consent);
      applyConsent(consent);
      hide();
    }

    var existing = readConsent();
    if (existing) { applyConsent(existing); }
    else { window.setTimeout(show, 700); }

    if (acceptBtn) acceptBtn.addEventListener('click', function () {
      save({ essential: true, analytics: true, advertising: true });
    });
    if (rejectBtn) rejectBtn.addEventListener('click', function () {
      save({ essential: true, analytics: false, advertising: false });
    });
    if (manageBtn && prefs) manageBtn.addEventListener('click', function () {
      var isOpen = manageBtn.getAttribute('aria-expanded') === 'true';
      manageBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      prefs.classList.toggle('is-open', !isOpen);
      if (!isOpen && analytics) analytics.focus();
    });
    if (saveBtn) saveBtn.addEventListener('click', function () {
      save({
        essential: true,
        analytics: !!(analytics && analytics.checked),
        advertising: !!(advertising && advertising.checked)
      });
    });

    // Footer "Cookie Preferences" and "Do Not Sell or Share" reopen the banner.
    Array.prototype.forEach.call(openers, function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var current = readConsent();
        if (analytics) analytics.checked = !!(current && current.analytics);
        if (advertising) advertising.checked = !!(current && current.advertising);
        if (btn.getAttribute('data-cookie-open') === 'optout') {
          if (advertising) advertising.checked = false;
          if (analytics) analytics.checked = false;
        }
        if (prefs && manageBtn) {
          prefs.classList.add('is-open');
          manageBtn.setAttribute('aria-expanded', 'true');
        }
        show();
        if (saveBtn) saveBtn.focus();
      });
    });
  }

  /* ------------------------------------------------------------------
     8. BACK TO TOP - IntersectionObserver sentinel, no scroll listener
     ------------------------------------------------------------------ */
  function initToTop() {
    var btn = document.getElementById('toTop');
    var sentinel = document.getElementById('topSentinel');
    if (!btn || !sentinel || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      btn.classList.toggle('is-shown', !entries[0].isIntersecting);
    }, { threshold: 0 });
    io.observe(sentinel);

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      var skip = document.querySelector('.skip');
      if (skip) skip.focus();
    });
  }

  /* ------------------------------------------------------------------
     9. ORDER ONLINE - quantity steppers and a running order total
     ------------------------------------------------------------------ */
  function money(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function initOrder() {
    var root = document.getElementById('orderList');
    if (!root) return;

    var subtotalEl = document.getElementById('orderSubtotal');
    var taxEl = document.getElementById('orderTax');
    var feeEl = document.getElementById('orderFee');
    var totalEl = document.getElementById('orderTotal');
    var countEl = document.getElementById('orderCount');
    var methodInputs = document.querySelectorAll('input[name="fulfilment"]');
    var TAX_RATE = 0.08875; // New York City combined sales tax

    function recalc() {
      var subtotal = 0;
      var count = 0;
      Array.prototype.forEach.call(root.querySelectorAll('[data-price]'), function (row) {
        var qty = Number(row.querySelector('.qty__val').textContent) || 0;
        subtotal += qty * Number(row.getAttribute('data-price'));
        count += qty;
      });

      var method = 'pickup';
      Array.prototype.forEach.call(methodInputs, function (i) { if (i.checked) method = i.value; });

      var fee = 0;
      if (method === 'delivery') fee = subtotal >= 8500 ? 0 : 695;

      var tax = Math.round((subtotal + fee) * TAX_RATE);

      if (subtotalEl) subtotalEl.textContent = money(subtotal);
      if (feeEl) feeEl.textContent = fee === 0 ? (method === 'delivery' ? 'Included' : 'None') : money(fee);
      if (taxEl) taxEl.textContent = money(tax);
      if (totalEl) totalEl.textContent = money(subtotal + fee + tax);
      if (countEl) countEl.textContent = count === 1 ? '1 item' : count + ' items';
    }

    root.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.qty__btn') : null;
      if (!btn) return;
      var row = btn.closest('[data-price]');
      var valEl = row.querySelector('.qty__val');
      var val = Number(valEl.textContent) || 0;
      val += btn.getAttribute('data-step') === 'up' ? 1 : -1;
      if (val < 0) val = 0;
      if (val > 20) val = 20;
      valEl.textContent = val;
      var live = row.querySelector('.qty__live');
      if (live) live.textContent = row.getAttribute('data-name') + ': ' + val + ' in order';
      recalc();
    });

    Array.prototype.forEach.call(methodInputs, function (i) {
      i.addEventListener('change', recalc);
    });

    recalc();
  }

  /* ------------------------------------------------------------------
     10. GIFT CARD AMOUNT PICKER
     ------------------------------------------------------------------ */
  function initGift() {
    var group = document.getElementById('giftAmounts');
    if (!group) return;
    var custom = document.getElementById('giftCustom');
    var customField = document.getElementById('giftCustomField');
    var out = document.getElementById('giftTotal');

    function update() {
      var chosen = group.querySelector('input[name="amount"]:checked');
      if (!chosen) return;
      var isCustom = chosen.value === 'custom';
      if (customField) customField.hidden = !isCustom;
      if (isCustom && custom) {
        custom.setAttribute('required', 'required');
        var v = Number(custom.value);
        if (out) out.textContent = v > 0 ? '$' + v.toFixed(2) : 'Enter an amount';
      } else {
        if (custom) custom.removeAttribute('required');
        if (out) out.textContent = '$' + Number(chosen.value).toFixed(2);
      }
    }

    group.addEventListener('change', update);
    if (custom) custom.addEventListener('input', update);
    update();
  }

  /* ------------------------------------------------------------------
     11. RESERVATION TIER SUMMARY (deposit shown before submitting)
     ------------------------------------------------------------------ */
  function initReservationSummary() {
    var tiers = document.querySelectorAll('input[name="tier"]');
    var party = document.getElementById('resParty');
    var out = document.getElementById('resDeposit');
    if (!tiers.length || !out) return;

    function update() {
      var perGuest = 0;
      var name = '';
      Array.prototype.forEach.call(tiers, function (t) {
        if (t.checked) {
          perGuest = Number(t.getAttribute('data-deposit'));
          name = t.getAttribute('data-name');
        }
      });
      var guests = party ? (Number(party.value) || 1) : 1;
      out.textContent = name + ': $' + (perGuest * guests).toFixed(2) +
        ' held on your card (' + guests + (guests === 1 ? ' guest' : ' guests') +
        ' at $' + perGuest.toFixed(2) + ' each). Applied to your final bill.';
    }

    Array.prototype.forEach.call(tiers, function (t) { t.addEventListener('change', update); });
    if (party) party.addEventListener('input', update);
    update();
  }

  /* ------------------------------------------------------------------
     BOOT
     ------------------------------------------------------------------ */
  function boot() {
    initNav();
    initNavDropdowns();
    initReveal();
    initSplit();
    initAccordions();
    initForms();
    initCookies();
    initToTop();
    initOrder();
    initGift();
    initReservationSummary();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
