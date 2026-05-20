(function () {
  'use strict';

  var STORAGE_MODE = 'letterpress.toc.mode';
  var DEFAULT_MODE = 'rail';         // 'breadcrumb' | 'rail'
  var MAX_DEPTH = 3;                  // H1–H3 in main TOC, H1–H4 in overlay
  var RAIL_WIDTH = 200;               // px — must match .letterpress-toc-rail width
  var RAIL_GAP = 24;                  // px — minimum gap between content column and rail
  var RAIL_EDGE = 16;                 // px — minimum gap between rail and viewport edge
  var SLIDER_MIN = 480;               // px — must match width-slider.js MIN
  var SLIDER_MAX = 1280;              // px — must match width-slider.js MAX
  var SLIDER_STEP = 20;               // px — must match width-slider.js STEP
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
    if (el) el.scrollIntoView({ block: 'start' });
  }

  // ─── Mode dispatcher ─────────────────────────────────────────
  function railSidePadding() {
    return RAIL_WIDTH + RAIL_GAP + RAIL_EDGE;
  }

  function chooseEffectiveMode() {
    var mode = getMode();
    if (mode === 'rail') {
      // Only fall back when the viewport is too narrow for the rail at
      // even the slider's minimum content width. Above that threshold we
      // keep rail and clip the slider's max instead.
      var minViewport = SLIDER_MIN + 2 * railSidePadding();
      if (window.innerWidth < minViewport) return 'breadcrumb';
    }
    return mode;
  }

  // ─── Slider constraint ───────────────────────────────────────
  // In rail mode the content column has to leave room for the rail. Rather
  // than auto-hiding the rail when the user widens, we cap how wide the
  // user can drag the width slider.
  function constrainSliderForRail() {
    var input = document.querySelector('#letterpress-width-slider-root .letterpress-width-slider__input');
    if (!input) return;
    var allowed;
    if (chooseEffectiveMode() === 'rail') {
      allowed = window.innerWidth - 2 * railSidePadding();
      allowed = Math.max(SLIDER_MIN, Math.min(SLIDER_MAX, allowed));
      allowed = Math.floor(allowed / SLIDER_STEP) * SLIDER_STEP;
    } else {
      allowed = SLIDER_MAX;
    }
    input.max = String(allowed);
    if (parseInt(input.value, 10) > allowed) {
      // Drive the slider through its own input/change handlers so it
      // updates label, applies --letterpress-width, and persists.
      input.value = String(allowed);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function teardown() {
    if (elements.crumb) { elements.crumb.remove(); elements.crumb = null; }
    if (elements.rail) { elements.rail.remove(); elements.rail = null; }
  }

  function renderTOC() {
    var mode = chooseEffectiveMode();
    if (mode !== activeMode) {
      teardown();
      activeMode = mode;
      if (mode === 'breadcrumb') buildBreadcrumb();
      else if (mode === 'rail') buildRail();
      renderCurrent();
    }
    constrainSliderForRail();
  }

  // ─── Breadcrumb ──────────────────────────────────────────────
  function buildBreadcrumb() {
    var crumb = document.createElement('div');
    crumb.className = 'letterpress-toc-crumb';
    crumb.innerHTML =
      '<div class="letterpress-toc-crumb__path"></div>' +
      '<div class="letterpress-toc-crumb__menu"></div>';

    // The whole bar is the expand affordance. Ancestor segments call
    // stopPropagation() so they jump instead of opening the dropdown.
    crumb.addEventListener('click', function () {
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
      ell.className = 'letterpress-toc-crumb__seg letterpress-toc-crumb__seg--ancestor';
      ell.textContent = '…';
      ell.title = path.slice(0, -PATH_MAX_SEGMENTS).map(function (h) { return h.text; }).join(' › ');
      ell.addEventListener('click', function (e) {
        e.stopPropagation();
        jumpTo(path[0].id);
      });
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
      var isCurrent = i === displayed.length - 1;
      var seg = document.createElement('span');
      seg.className = 'letterpress-toc-crumb__seg ' +
        (isCurrent ? 'letterpress-toc-crumb__seg--current' : 'letterpress-toc-crumb__seg--ancestor');
      seg.textContent = h.text;
      if (isCurrent) {
        // Append the chevron — its click bubbles to the crumb and toggles.
        var chev = document.createElement('span');
        chev.className = 'letterpress-toc-crumb__chevron';
        chev.textContent = '▾';
        seg.appendChild(chev);
      } else {
        // Ancestor — clicking jumps and shouldn't toggle the dropdown.
        seg.style.cursor = 'pointer';
        seg.addEventListener('click', function (e) {
          e.stopPropagation();
          jumpTo(h.id);
        });
      }
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
        e.stopPropagation();
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
    sw.textContent = 'Switch to Rail view →';
    sw.addEventListener('click', function (e) {
      e.stopPropagation();
      elements.crumb.classList.remove('is-open');
      setMode('rail');
    });
    footer.appendChild(sw);
    menu.appendChild(footer);
  }

  // ─── Rail ────────────────────────────────────────────────────
  function buildRail() {
    var rail = document.createElement('aside');
    rail.className = 'letterpress-toc-rail';
    rail.innerHTML =
      '<div class="letterpress-toc-rail__head">' +
        '<span>Contents</span>' +
        '<button class="letterpress-toc-mode-switch" type="button" title="Switch to Breadcrumb">← Breadcrumb</button>' +
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
      constrainSliderForRail();   // restore slider max if rail was previously active
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
    renderTOC();   // re-evaluates mode + re-applies slider cap for new viewport
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
