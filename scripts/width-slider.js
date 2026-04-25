(function () {
  'use strict';

  var STORAGE_KEY_LAST = 'letterpress.width.lastUsed';
  var STORAGE_KEY_BY_DOC = 'letterpress.width.byDoc';
  var SLIDER_ID = 'letterpress-width-slider-root';
  var MIN = 480;
  var MAX = 1280;
  var STEP = 20;
  var DEFAULT = 720;
  var BY_DOC_CAP = 200;

  // One-time migration from pre-rename `rocinante.width.*` keys. Runs every load
  // but no-ops once the legacy keys are gone. Remove after a couple of releases.
  function migrateLegacyKeys() {
    try {
      var oldLast = localStorage.getItem('rocinante.width.lastUsed');
      if (oldLast !== null) {
        if (localStorage.getItem(STORAGE_KEY_LAST) === null) {
          localStorage.setItem(STORAGE_KEY_LAST, oldLast);
        }
        localStorage.removeItem('rocinante.width.lastUsed');
      }
      var oldByDoc = localStorage.getItem('rocinante.width.byDoc');
      if (oldByDoc !== null) {
        if (localStorage.getItem(STORAGE_KEY_BY_DOC) === null) {
          localStorage.setItem(STORAGE_KEY_BY_DOC, oldByDoc);
        }
        localStorage.removeItem('rocinante.width.byDoc');
      }
    } catch (e) {}
  }

  function getSource() {
    var meta = document.getElementById('vscode-markdown-preview-data');
    if (!meta) return null;
    try {
      var settings = JSON.parse(meta.getAttribute('data-settings'));
      return settings && settings.source;
    } catch (e) {
      return null;
    }
  }

  function loadByDoc() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_BY_DOC) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveByDoc(map) {
    try {
      localStorage.setItem(STORAGE_KEY_BY_DOC, JSON.stringify(map));
    } catch (e) {}
  }

  function clamp(n) {
    if (isNaN(n)) return DEFAULT;
    return Math.max(MIN, Math.min(MAX, n));
  }

  function resolveInitialWidth(source) {
    var byDoc = loadByDoc();
    if (source && byDoc[source]) {
      return clamp(parseInt(byDoc[source], 10));
    }
    try {
      var last = parseInt(localStorage.getItem(STORAGE_KEY_LAST), 10);
      if (!isNaN(last)) return clamp(last);
    } catch (e) {}
    return DEFAULT;
  }

  function applyWidth(px) {
    document.documentElement.style.setProperty('--letterpress-width', px + 'px');
  }

  function persist(source, px) {
    try {
      localStorage.setItem(STORAGE_KEY_LAST, String(px));
    } catch (e) {}
    if (!source) return;
    var byDoc = loadByDoc();
    // Reinsert key to push it to the end (insertion-order LRU).
    delete byDoc[source];
    byDoc[source] = String(px);
    var keys = Object.keys(byDoc);
    if (keys.length > BY_DOC_CAP) {
      var excess = keys.length - BY_DOC_CAP;
      for (var i = 0; i < excess; i++) {
        delete byDoc[keys[i]];
      }
    }
    saveByDoc(byDoc);
  }

  function buildSlider() {
    var existing = document.getElementById(SLIDER_ID);
    if (existing) existing.remove();

    migrateLegacyKeys();

    var source = getSource();
    var initial = resolveInitialWidth(source);
    applyWidth(initial);

    var root = document.createElement('div');
    root.id = SLIDER_ID;
    root.className = 'letterpress-width-slider';

    var label = document.createElement('span');
    label.className = 'letterpress-width-slider__label';
    label.textContent = initial + ' px';

    var input = document.createElement('input');
    input.type = 'range';
    input.className = 'letterpress-width-slider__input';
    input.min = String(MIN);
    input.max = String(MAX);
    input.step = String(STEP);
    input.value = String(initial);
    input.setAttribute('aria-label', 'Preview column width');

    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'letterpress-width-slider__reset';
    reset.textContent = 'reset';
    reset.title = 'Reset to default (' + DEFAULT + 'px)';

    input.addEventListener('input', function () {
      var px = clamp(parseInt(input.value, 10));
      label.textContent = px + ' px';
      applyWidth(px);
    });

    input.addEventListener('change', function () {
      var px = clamp(parseInt(input.value, 10));
      persist(source, px);
    });

    reset.addEventListener('click', function () {
      input.value = String(DEFAULT);
      label.textContent = DEFAULT + ' px';
      applyWidth(DEFAULT);
      persist(source, DEFAULT);
    });

    root.appendChild(label);
    root.appendChild(input);
    root.appendChild(reset);

    document.body.insertBefore(root, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSlider);
  } else {
    buildSlider();
  }

  var observer = new MutationObserver(function (mutations) {
    var bodyChanged = mutations.some(function (m) {
      return Array.from(m.addedNodes).some(function (n) {
        return n.nodeType === 1 &&
          n.classList &&
          n.classList.contains('markdown-body');
      });
    });
    if (bodyChanged && !document.getElementById(SLIDER_ID)) {
      buildSlider();
    }
  });

  observer.observe(document.body, { childList: true, subtree: false });
})();
