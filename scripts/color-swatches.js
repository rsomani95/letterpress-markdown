(function () {
  'use strict';

  var HEX_RE = /^#[0-9a-fA-F]{6}$/;
  var FLAG = 'letterpressColored';

  function decorate(code) {
    if (code.dataset[FLAG]) return;
    if (code.parentElement && code.parentElement.tagName === 'PRE') return;

    var text = code.textContent.trim();
    if (!HEX_RE.test(text)) return;

    var swatch = document.createElement('span');
    swatch.className = 'letterpress-color-swatch';
    swatch.style.backgroundColor = text;
    swatch.setAttribute('aria-hidden', 'true');

    code.insertBefore(swatch, code.firstChild);
    code.dataset[FLAG] = 'true';
  }

  function decorateAll() {
    document.querySelectorAll('code').forEach(decorate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateAll);
  } else {
    decorateAll();
  }

  var observer = new MutationObserver(function (mutations) {
    var hasNewCode = mutations.some(function (m) {
      return Array.from(m.addedNodes).some(function (n) {
        return n.nodeType === 1 && (
          n.tagName === 'CODE' ||
          (n.querySelector && n.querySelector('code'))
        );
      });
    });
    if (hasNewCode) decorateAll();
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
