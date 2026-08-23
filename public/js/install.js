/**
 * AGRICHAIN 360 — Shared Installation Service
 *
 * One installation brain used by:
 *   - Public homepage CTAs (Get App / Download App)
 *   - The floating "Install App" tab (layout pages AND the landing page)
 *   - The /get-app installation page
 *
 * Guarantees:
 *   - Installation NEVER requires registration or login.
 *   - Uses the browser's native PWA prompt (beforeinstallprompt) when available.
 *   - Falls back to APK download (Android) or Add-to-Home-Screen instructions (iOS).
 *   - Detects the already-installed state and stops offering installation.
 *
 * Public API:
 *   AgriInstall.state                      - { platform, standalone, promptAvailable }
 *   AgriInstall.cta(event)                 - for <a href="/get-app" onclick="return AgriInstall.cta(event)">
 *   AgriInstall.trigger()                  - run the full decision flow now
 *   AgriInstall.promptNow()                - force the native prompt (used on /get-app)
 *   AgriInstall.bindFloating({ delay })    - wire the #installPrompt floating tab
 */
(function () {
  'use strict';

  var state = {
    platform: 'desktop',       // 'android' | 'ios' | 'desktop' | 'other'
    standalone: false,         // running as an installed PWA
    promptAvailable: false,    // native beforeinstallprompt captured
    dismissed: false
  };

  var promptEvent = null;

  // ── Platform detection ──────────────────────────────
  function detectPlatform() {
    var ua = navigator.userAgent || '';
    var maxTouch = navigator.maxTouchPoints || 0;

    // iPadOS 13+ reports as Mac with touch points
    var isIOS = /iPhone|iPod/.test(ua) ||
      (/iPad/.test(ua) || (navigator.platform === 'MacIntel' && maxTouch > 1));
    if (isIOS) return 'ios';

    if (/Android/i.test(ua)) return 'android';

    if (/Mobile|Tablet/i.test(ua)) return 'other';

    return /Windows|Macintosh|Linux|CrOS/i.test(ua) ? 'desktop' : 'other';
  }

  function isStandalone() {
    return !!(navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
      document.referrer.indexOf('android-app://') === 0);
  }

  // ── Service worker (needed for the browser install prompt) ──
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (navigator.serviceWorker.controller) return; // already registered
    try {
      navigator.serviceWorker.register('/sw.js').catch(function () { /* non-fatal */ });
    } catch (e) { /* non-fatal */ }
  }

  // ── Native prompt capture ───────────────────────────
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    promptEvent = e;
    state.promptAvailable = true;
    maybeShowFloating();
  });

  window.addEventListener('appinstalled', function () {
    promptEvent = null;
    state.promptAvailable = false;
    state.standalone = true;
    hideFloating();
    document.dispatchEvent(new CustomEvent('agriinstall:installed'));
  });

  // ── Floating tab (existing feature, kept) ───────────
  var floatingDelay = 4000;

  function floatingEl() { return document.getElementById('installPrompt'); }

  function maybeShowFloating() {
    var el = floatingEl();
    if (!el) return;
    if (state.standalone || state.dismissed) return;
    if (!state.promptAvailable) return; // only advertise when the native prompt is real
    setTimeout(function () {
      if (!state.standalone && !state.dismissed && state.promptAvailable) {
        el.style.display = 'block';
      }
    }, floatingDelay);
  }

  function hideFloating() {
    var el = floatingEl();
    if (el) el.style.display = 'none';
  }

  function bindFloating(opts) {
    opts = opts || {};
    floatingDelay = opts.delay || 4000;
    try {
      state.dismissed = sessionStorage.getItem('agriInstallDismissed') === '1';
    } catch (e) { /* private mode */ }
    maybeShowFloating();
  }

  function dismissFloating() {
    state.dismissed = true;
    try { sessionStorage.setItem('agriInstallDismissed', '1'); } catch (e) { /* ignore */ }
    hideFloating();
  }

  // ── The decision flow ───────────────────────────────
  /**
   * Runs the full installation decision.
   * Returns 'native' | 'page' | 'installed'.
   */
  function trigger() {
    if (state.standalone) {
      toast('AGRICHAIN 360 is already installed on this device.');
      return 'installed';
    }
    if (promptAvailable && promptEvent && typeof promptEvent.prompt === 'function') {
      var ev = promptEvent;
      ev.prompt();
      ev.userChoice.then(function () {
        promptEvent = null;
        state.promptAvailable = false;
        hideFloating();
      }).catch(function () { /* ignore */ });
      return 'native';
    }
    // No native prompt available — the /get-app page handles every platform
    if (window.location.pathname !== '/get-app') {
      window.location.href = '/get-app';
      return 'page';
    }
    return 'page';
  }

  /**
   * CTA click handler: <a href="/get-app" onclick="return AgriInstall.cta(event)">
   * If a native prompt exists it is triggered here (link default prevented);
   * otherwise the link navigates normally to /get-app.
   */
  function cta(event) {
    try {
      if (state.standalone) {
        if (event) event.preventDefault();
        toast('AGRICHAIN 360 is already installed on this device.');
        return false;
      }
      if (promptAvailable) {
        if (event) event.preventDefault();
        trigger();
        return false;
      }
      return true; // follow the href → /get-app
    } catch (e) {
      return true; // never block the link on a JS error
    }
  }

  /** Used by the /get-app page button: native prompt only (no navigation). */
  function promptNow() {
    if (promptAvailable && promptEvent && typeof promptEvent.prompt === 'function') {
      var ev = promptEvent;
      ev.prompt();
      return ev.userChoice.then(function (choice) {
        if (choice && choice.outcome === 'accepted') {
          promptEvent = null;
          state.promptAvailable = false;
        }
        return choice;
      });
    }
    return Promise.reject(new Error('Native install prompt is not available in this browser.'));
  }

  // ── Small toast (no dependencies) ───────────────────
  var toastTimer = null;
  function toast(message) {
    var t = document.getElementById('agriInstallToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'agriInstallToast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
        'background:#1B5E20;color:#fff;padding:12px 22px;border-radius:12px;font-size:.85rem;' +
        'font-weight:600;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90%;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent = message;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.display = 'none'; }, 3200);
  }

  // ── Legacy aliases (existing markup uses these) ────
  window.installApp = function () { trigger(); };
  window.dismissInstall = function () { dismissFloating(); };

  // ── Init ────────────────────────────────────────────
  state.platform = detectPlatform();
  state.standalone = isStandalone();
  registerSW();
  document.addEventListener('DOMContentLoaded', function () {
    state.standalone = isStandalone(); // re-check after render
  });

  window.AgriInstall = {
    state: state,
    cta: cta,
    trigger: trigger,
    promptNow: promptNow,
    bindFloating: bindFloating,
    dismiss: dismissFloating,
    toast: toast
  };
})();
