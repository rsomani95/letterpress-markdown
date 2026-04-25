(function () {
  'use strict';

  var HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);
  var CHEVRON_EXPANDED = '\u25BC';
  var CHEVRON_COLLAPSED = '\u25B6';

  function getLevel(el) {
    return parseInt(el.tagName[1], 10);
  }

  function initFolding() {
    var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headings.forEach(function (heading) {
      if (heading.querySelector('.letterpress-fold-chevron')) return;

      var level = getLevel(heading);
      var chevron = document.createElement('span');
      chevron.className = 'letterpress-fold-chevron';
      chevron.setAttribute('data-level', String(level));
      chevron.setAttribute('aria-label', 'Collapse section');
      chevron.textContent = CHEVRON_EXPANDED;

      chevron.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleSection(heading, chevron, level);
      });

      heading.insertBefore(chevron, heading.firstChild);
    });
  }

  function toggleSection(heading, chevron, level) {
    var isCollapsed = heading.classList.contains('letterpress-collapsed');

    if (isCollapsed) {
      heading.classList.remove('letterpress-collapsed');
      chevron.textContent = CHEVRON_EXPANDED;
      chevron.setAttribute('aria-label', 'Collapse section');
      setSectionVisibility(heading, level, true);
    } else {
      heading.classList.add('letterpress-collapsed');
      chevron.textContent = CHEVRON_COLLAPSED;
      chevron.setAttribute('aria-label', 'Expand section');
      setSectionVisibility(heading, level, false);
    }
  }

  function setSectionVisibility(heading, level, visible) {
    var sibling = heading.nextElementSibling;
    while (sibling) {
      if (HEADING_TAGS.has(sibling.tagName) && getLevel(sibling) <= level) {
        break;
      }
      if (visible) {
        sibling.classList.remove('letterpress-folded');
      } else {
        sibling.classList.add('letterpress-folded');
      }
      sibling = sibling.nextElementSibling;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFolding);
  } else {
    initFolding();
  }

  var observer = new MutationObserver(function (mutations) {
    var hasNewHeadings = mutations.some(function (m) {
      return Array.from(m.addedNodes).some(function (n) {
        return n.nodeType === 1 && (
          HEADING_TAGS.has(n.tagName) ||
          (n.querySelector && n.querySelector('h1, h2, h3, h4, h5, h6'))
        );
      });
    });
    if (hasNewHeadings) {
      initFolding();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
