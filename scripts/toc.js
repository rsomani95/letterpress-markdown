(function () {
  'use strict';

  var STORAGE_MODE = 'letterpress.toc.mode';
  var DEFAULT_MODE = 'breadcrumb';   // 'breadcrumb' | 'rail'
  var MAX_DEPTH = 3;                  // H1–H3 in main TOC, H1–H4 in overlay
  var RAIL_MIN_WIDTH = 1080;          // px — below this, rail falls back to breadcrumb
  var CRUMB_HIDE_THRESHOLD_PX = 30;   // hide breadcrumb until first heading is mostly above viewport top
  var PATH_MAX_SEGMENTS = 3;          // collapse middle path segments beyond this

  var headings = [];
  var elements = { crumb: null, rail: null, overlay: null };
  var currentIdx = -1;
  var activeMode = null;
  var overlayItems = [];
  var overlayActive = 0;

  // ─── Helpers ─────────────────────────────────────────────────
  function getMode() {
    try {
      var m = localStorage.getItem(STORAGE_MODE);
      if (m === 'breadcrumb' || m === 'rail') return m;
    } catch (e) {}
    return DEFAULT_MODE;
  }

  function setMode(m) {
    try { localStorage.setItem(STORAGE_MODE, m); } catch (e) {}
    activeMode = null;   // force re-render
    renderTOC();
    updateCurrent();
  }

  function getHeadingText(heading) {
    // Strip the fold.js chevron span if present.
    return Array.from(heading.childNodes).filter(function (n) {
      return !(n.nodeType === 1 && n.classList && n.classList.contains('letterpress-fold-chevron'));
    }).map(function (n) {
      return n.textContent || '';
    }).join('').trim();
  }

  function collectHeadings() {
    var nodes = document.querySelectorAll('h1, h2, h3, h4');
    headings = [];
    nodes.forEach(function (el, i) {
      // Skip headings we injected ourselves (defensive).
      if (el.closest && el.closest('.letterpress-toc-rail, .letterpress-toc-crumb, .letterpress-toc-overlay')) return;
      if (!el.id) el.id = 'letterpress-h-' + i;
      headings.push({
        el: el,
        level: parseInt(el.tagName[1], 10),
        text: getHeadingText(el),
        id: el.id
      });
    });
  }

  function visibleHeadings(depth) {
    var max = depth || MAX_DEPTH;
    return headings.filter(function (h) { return h.level <= max; });
  }

  function pathFor(idx) {
    if (idx < 0 || idx >= headings.length) return [];
    var path = [headings[idx]];
    for (var i = idx - 1; i >= 0; i--) {
      if (headings[i].level < path[path.length - 1].level) {
        path.push(headings[i]);
      }
      if (headings[i].level === 1) break;
    }
    return path.reverse();
  }

  function jumpTo(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ─── Mode dispatcher ─────────────────────────────────────────
  function chooseEffectiveMode() {
    var mode = getMode();
    if (mode === 'rail' && window.innerWidth < RAIL_MIN_WIDTH) return 'breadcrumb';
    return mode;
  }

  function teardown() {
    if (elements.crumb) { elements.crumb.remove(); elements.crumb = null; }
    if (elements.rail) { elements.rail.remove(); elements.rail = null; }
  }

  function renderTOC() {
    var mode = chooseEffectiveMode();
    if (mode === activeMode) return;
    teardown();
    activeMode = mode;
    if (mode === 'breadcrumb') buildBreadcrumb();
    else if (mode === 'rail') buildRail();
    renderCurrent();
    updateCrumbVisibility();
  }

  // ─── Breadcrumb ──────────────────────────────────────────────
  function buildBreadcrumb() {
    var crumb = document.createElement('div');
    crumb.className = 'letterpress-toc-crumb';
    crumb.innerHTML =
      '<div class="letterpress-toc-crumb__path"></div>' +
      '<button class="letterpress-toc-crumb__expand" title="Show all headings" type="button">' +
        '<span class="letterpress-toc-crumb__expand-icon">☰</span>' +
        '<span>all</span>' +
      '</button>' +
      '<div class="letterpress-toc-crumb__menu"></div>';

    crumb.querySelector('.letterpress-toc-crumb__expand').addEventListener('click', function (e) {
      e.stopPropagation();
      crumb.classList.toggle('is-open');
    });

    document.body.appendChild(crumb);
    elements.crumb = crumb;
    renderCrumbMenu();
  }

  function renderCrumbPath() {
    if (!elements.crumb) return;
    var pathEl = elements.crumb.querySelector('.letterpress-toc-crumb__path');
    pathEl.innerHTML = '';
    var path = pathFor(currentIdx);
    if (path.length === 0) {
      var s = document.createElement('span');
      s.className = 'letterpress-toc-crumb__seg';
      s.textContent = 'Top';
      pathEl.appendChild(s);
      return;
    }
    var truncated = path.length > PATH_MAX_SEGMENTS;
    var displayed = truncated ? path.slice(-PATH_MAX_SEGMENTS) : path;
    if (truncated) {
      var ell = document.createElement('span');
      ell.className = 'letterpress-toc-crumb__seg';
      ell.textContent = '…';
      ell.title = path.slice(0, -PATH_MAX_SEGMENTS).map(function (h) { return h.text; }).join(' › ');
      ell.addEventListener('click', function () { jumpTo(path[0].id); });
      pathEl.appendChild(ell);
      var sep = document.createElement('span');
      sep.className = 'letterpress-toc-crumb__sep';
      sep.textContent = '›';
      pathEl.appendChild(sep);
    }
    displayed.forEach(function (h, i) {
      if (i > 0) {
        var s = document.createElement('span');
        s.className = 'letterpress-toc-crumb__sep';
        s.textContent = '›';
        pathEl.appendChild(s);
      }
      var seg = document.createElement('span');
      seg.className = 'letterpress-toc-crumb__seg';
      seg.textContent = h.text;
      seg.addEventListener('click', function () { jumpTo(h.id); });
      pathEl.appendChild(seg);
    });
  }

  function renderCrumbMenu() {
    if (!elements.crumb) return;
    var menu = elements.crumb.querySelector('.letterpress-toc-crumb__menu');
    menu.innerHTML = '';
    visibleHeadings().forEach(function (h) {
      var a = document.createElement('a');
      a.className = 'letterpress-toc-item letterpress-toc-item--h' + h.level;
      a.textContent = h.text;
      a.href = '#' + h.id;
      a.dataset.idx = headings.indexOf(h);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        jumpTo(h.id);
        elements.crumb.classList.remove('is-open');
      });
      menu.appendChild(a);
    });
    // Mode-switch footer
    var footer = document.createElement('div');
    footer.className = 'letterpress-toc-menu-footer';
    var sw = document.createElement('button');
    sw.type = 'button';
    sw.className = 'letterpress-toc-mode-switch';
    sw.textContent = 'Switch to rail view →';
    sw.addEventListener('click', function () {
      elements.crumb.classList.remove('is-open');
      setMode('rail');
    });
    footer.appendChild(sw);
    menu.appendChild(footer);
  }

  function updateCrumbVisibility() {
    if (!elements.crumb) return;
    var firstH = visibleHeadings()[0];
    if (!firstH) {
      elements.crumb.classList.remove('is-visible');
      return;
    }
    var show = firstH.el.getBoundingClientRect().bottom < CRUMB_HIDE_THRESHOLD_PX;
    if (!show) elements.crumb.classList.remove('is-open');
    elements.crumb.classList.toggle('is-visible', show);
  }

  // ─── Rail ────────────────────────────────────────────────────
  function buildRail() {
    var rail = document.createElement('aside');
    rail.className = 'letterpress-toc-rail';
    rail.innerHTML =
      '<div class="letterpress-toc-rail__head">' +
        '<span>Contents</span>' +
        '<button class="letterpress-toc-mode-switch" type="button" title="Switch to breadcrumb">← crumb</button>' +
      '</div>' +
      '<div class="letterpress-toc-rail__list"></div>';

    rail.querySelector('.letterpress-toc-mode-switch').addEventListener('click', function () {
      setMode('breadcrumb');
    });

    var list = rail.querySelector('.letterpress-toc-rail__list');
    visibleHeadings().forEach(function (h) {
      var a = document.createElement('a');
      a.className = 'letterpress-toc-item letterpress-toc-item--h' + h.level;
      a.textContent = h.text;
      a.href = '#' + h.id;
      a.dataset.idx = headings.indexOf(h);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        jumpTo(h.id);
      });
      list.appendChild(a);
    });

    document.body.appendChild(rail);
    elements.rail = rail;
  }

  // ─── Overlay (always available) ──────────────────────────────
  function buildOverlay() {
    if (elements.overlay) return;
    var overlay = document.createElement('div');
    overlay.className = 'letterpress-toc-overlay';
    overlay.innerHTML =
      '<div class="letterpress-toc-overlay__panel">' +
        '<input class="letterpress-toc-overlay__input" type="text" placeholder="Jump to heading…" autocomplete="off" spellcheck="false">' +
        '<div class="letterpress-toc-overlay__list"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    elements.overlay = overlay;

    var input = overlay.querySelector('.letterpress-toc-overlay__input');
    input.addEventListener('input', function () {
      overlayActive = 0;
      renderOverlayList();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        overlayActive = Math.min(overlayActive + 1, overlayItems.length - 1);
        renderOverlayList();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        overlayActive = Math.max(overlayActive - 1, 0);
        renderOverlayList();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var h = overlayItems[overlayActive];
        if (h) { jumpTo(h.id); closeOverlay(); }
      } else if (e.key === 'Escape') {
        closeOverlay();
      }
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeOverlay();
    });
  }

  function renderOverlayList() {
    if (!elements.overlay) return;
    var list = elements.overlay.querySelector('.letterpress-toc-overlay__list');
    var input = elements.overlay.querySelector('.letterpress-toc-overlay__input');
    var q = input.value.toLowerCase();
    list.innerHTML = '';
    // Overlay is one level deeper than the main TOC.
    overlayItems = visibleHeadings(MAX_DEPTH + 1).filter(function (h) {
      return !q || h.text.toLowerCase().indexOf(q) !== -1;
    });
    // Keep selection in range.
    if (overlayActive >= overlayItems.length) overlayActive = overlayItems.length - 1;
    if (overlayActive < 0) overlayActive = 0;
    overlayItems.forEach(function (h, i) {
      var row = document.createElement('div');
      row.className = 'letterpress-toc-item letterpress-toc-item--h' + h.level +
        (i === overlayActive ? ' is-active' : '');
      row.textContent = h.text;
      row.dataset.idx = headings.indexOf(h);
      row.addEventListener('click', function () {
        jumpTo(h.id);
        closeOverlay();
      });
      list.appendChild(row);
    });
  }

  function openOverlay() {
    if (!elements.overlay) buildOverlay();
    overlayActive = 0;
    var input = elements.overlay.querySelector('.letterpress-toc-overlay__input');
    input.value = '';
    renderOverlayList();
    elements.overlay.classList.add('is-open');
    setTimeout(function () { input.focus(); }, 0);
  }

  function closeOverlay() {
    if (elements.overlay) elements.overlay.classList.remove('is-open');
  }

  // ─── Current section ─────────────────────────────────────────
  function updateCurrent() {
    var threshold = window.scrollY + 80;
    var idx = -1;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].el.offsetTop <= threshold) idx = i;
      else break;
    }
    if (idx !== currentIdx) {
      currentIdx = idx;
      renderCurrent();
    }
    updateCrumbVisibility();
  }

  function renderCurrent() {
    if (elements.crumb) renderCrumbPath();
    document.querySelectorAll('.letterpress-toc-item').forEach(function (el) {
      el.classList.toggle('is-current', parseInt(el.dataset.idx, 10) === currentIdx);
    });
  }

  // ─── Init / re-init on preview re-render ─────────────────────
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateCurrent();
      ticking = false;
    });
  }

  function init() {
    collectHeadings();
    if (headings.length === 0) {
      teardown();
      activeMode = null;
      return;
    }
    buildOverlay();
    activeMode = null;
    renderTOC();
    updateCurrent();
  }

  // Outside-click closes the crumb dropdown.
  document.addEventListener('click', function (e) {
    if (elements.crumb && elements.crumb.classList.contains('is-open') && !elements.crumb.contains(e.target)) {
      elements.crumb.classList.remove('is-open');
    }
  });

  // `/` opens the overlay, Esc closes it. Skip when focus is on an input.
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var isEditable = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || (t.isContentEditable));
    if (isEditable && (!elements.overlay || !elements.overlay.contains(t))) return;
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      openOverlay();
    } else if (e.key === 'Escape') {
      closeOverlay();
    }
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    activeMode = null;
    renderTOC();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Detect preview re-render (markdown body replaced) and re-init.
  var observer = new MutationObserver(function (mutations) {
    var contentChanged = mutations.some(function (m) {
      return Array.from(m.addedNodes).some(function (n) {
        if (n.nodeType !== 1) return false;
        if (/^H[1-6]$/.test(n.tagName)) return true;
        if (n.classList && n.classList.contains('markdown-body')) return true;
        return false;
      });
    });
    if (contentChanged) init();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
