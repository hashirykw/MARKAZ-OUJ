/* ==================================================================
   UNIFIED SHELL — behaviour shared by every page.
   1. Founder story chapters collapse to preview cards that open in
      a reading modal.
   2. Horizontal rails follow the finger (and the mouse) instead of
      relying on a flick.
   ================================================================== */
(function () {
  'use strict';

  /* ---------------- 1. story chapters -> preview + modal ---------- */
  function buildChapters() {
    var cards = document.querySelectorAll('.jrn__c');
    if (!cards.length || document.getElementById('chapOv')) return;

    var ov = document.createElement('div');
    ov.className = 'chapov';
    ov.id = 'chapOv';
    ov.setAttribute('role', 'dialog');
    ov.setAttribute('aria-modal', 'true');
    ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML =
      '<div class="chapov__bd" data-chap-close></div>' +
      '<div class="chapov__sheet" role="document">' +
        '<button class="chapov__x" data-chap-close aria-label="Close">' +
          '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
        '<div class="chapov__in" id="chapIn" tabindex="-1"></div>' +
      '</div>';
    document.body.appendChild(ov);

    var sheet = ov.querySelector('.chapov__in');
    var lastFocus = null;

    function open(html) {
      sheet.innerHTML = html;
      ov.classList.add('on');
      ov.setAttribute('aria-hidden', 'false');
      document.body.classList.add('chap-open');
      sheet.scrollTop = 0;
      sheet.focus();
    }
    function close() {
      ov.classList.remove('on');
      ov.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('chap-open');
      if (lastFocus) lastFocus.focus();
    }

    ov.addEventListener('click', function (e) {
      if (e.target.closest('[data-chap-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ov.classList.contains('on')) close();
    });

    Array.prototype.forEach.call(cards, function (card) {
      var full = card.innerHTML;
      var eyebrow = card.querySelector('.jrn__yr');
      var head = card.querySelector('h3');
      var paras = card.querySelectorAll('p');
      if (!head || !paras.length) return;

      /* the preview keeps the first paragraph, trimmed to a clean stop */
      var text = paras[0].textContent.trim();
      if (text.length > 168) {
        var cut = text.slice(0, 168);
        var stop = cut.lastIndexOf(' ');
        text = cut.slice(0, stop > 120 ? stop : 168).replace(/[,;:.\s]+$/, '') + '…';
      }
      var count = paras.length + (card.querySelector('.jrn__q') ? 1 : 0);

      card.innerHTML =
        (eyebrow ? '<div class="jrn__yr">' + eyebrow.innerHTML + '</div>' : '') +
        '<h3>' + head.innerHTML + '</h3>' +
        '<p class="jrn__prev">' + text + '</p>' +
        '<span class="jrn__more">' +
          'Read the full chapter' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
        '</span>';

      card.classList.add('jrn__c--tap');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', head.textContent.trim() + ' — read the full chapter');

      function fire() { lastFocus = card; open(full); }
      card.addEventListener('click', fire);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); }
      });
    });
  }

  /* ---------------- 2. rails that follow the finger --------------- */
  function dragRails() {
    var rails = document.querySelectorAll(
      '.sq,.deck,.dstrip,.fbar,.mkc-chips,.chips,.tl-row,.cgrid,[data-rail]'
    );

    Array.prototype.forEach.call(rails, function (rail) {
      if (rail.dataset.railReady) return;
      rail.dataset.railReady = '1';
      rail.classList.add('rail-drag');

      var down = false, moved = false, startX = 0, startScroll = 0, id = null;

      rail.addEventListener('pointerdown', function (e) {
        /* touch already scrolls natively and does it better — only take
           over for mouse and pen, so momentum is never fought */
        if (e.pointerType === 'touch') return;
        if (e.button !== 0) return;
        down = true; moved = false;
        startX = e.clientX;
        startScroll = rail.scrollLeft;
        id = e.pointerId;
        rail.classList.add('is-drag');
      });

      rail.addEventListener('pointermove', function (e) {
        if (!down || e.pointerId !== id) return;
        var dx = e.clientX - startX;
        if (!moved && Math.abs(dx) > 4) {
          moved = true;
          if (rail.setPointerCapture) rail.setPointerCapture(id);
        }
        if (moved) { e.preventDefault(); rail.scrollLeft = startScroll - dx; }
      });

      function release(e) {
        if (!down || (e && e.pointerId !== id)) return;
        down = false;
        rail.classList.remove('is-drag');
        if (moved) {
          /* swallow the click that ends a drag */
          rail.addEventListener('click', function stop(ev) {
            ev.stopPropagation(); ev.preventDefault();
            rail.removeEventListener('click', stop, true);
          }, true);
        }
        moved = false;
      }
      rail.addEventListener('pointerup', release);
      rail.addEventListener('pointercancel', release);
      rail.addEventListener('pointerleave', release);
    });
  }

  function init() { buildChapters(); dragRails(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
