/* ============================================================
   squircle.js — superellipse corners for browsers without
   CSS `corner-shape: squircle` (Safari, Firefox).

   Chromium: does nothing at all, native corner-shape wins.
   Elsewhere: replaces each element's rounded-rect with a real
   superellipse via clip-path, and redraws the hairline outline
   as an SVG <path> so the border survives the clip.

   Caveat: clip-path also clips box-shadow. Elements with a
   shadow are skipped and keep the arc fallback — the shadow is
   worth more than the corner. Move the shadow to a wrapper if
   you need both.
   ============================================================ */
(function () {
  'use strict';

  /* Surfaces are held at opacity 0 (html.sq-wait) until the corner shape is
     final, so a card is never seen as a plain rounded rect that then pops
     into a superellipse. Released below, on both code paths. */
  var root = document.documentElement;
  function release(){ root.classList.remove('sq-wait'); }

  if (CSS.supports('corner-shape', 'squircle')) { release(); return; }   // native

  var N        = 4.2;   // superellipse exponent. 4.0–4.5 ≈ Apple. 2 = circle.
  var SAMPLES  = 22;    // points per corner
  var SELECTOR = '.sq, .card, .tile, .pillrow, .chip, .field, .inline-card, .pbtn, .msg-me';

  /* one corner of the superellipse, emitted as L commands.
     The top-right and bottom-left corners leave along x; the other two leave
     along y, so their axes swap (without the swap they cut a notch). */
  function corner(cx, cy, rx, ry, sx, sy, out, swap) {
    for (var i = 1; i <= SAMPLES; i++) {
      var t = i / SAMPLES;
      var c = Math.pow(1 - Math.pow(t, N), 1 / N);
      var a = swap ? 1 - c : t, b = swap ? t : 1 - c;
      out.push('L ' + (cx + sx * rx * a).toFixed(2) + ' ' + (cy + sy * ry * b).toFixed(2));
    }
  }

  function pathFor(w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    var p = ['M ' + r.toFixed(2) + ' 0', 'L ' + (w - r).toFixed(2) + ' 0'];
    corner(w - r, 0, r, r,  1,  1, p);                       // top-right
    p.push('L ' + w.toFixed(2) + ' ' + (h - r).toFixed(2));
    corner(w, h - r, r, r, -1,  1, p, true);                 // bottom-right
    p.push('L ' + r.toFixed(2) + ' ' + h.toFixed(2));
    corner(r, h, r, r, -1, -1, p);                           // bottom-left
    p.push('L 0 ' + r.toFixed(2));
    corner(0, r, r, r,  1, -1, p, true);                     // top-left
    p.push('Z');
    return p.join(' ');
  }

  var NS = 'http://www.w3.org/2000/svg';

  function apply(el) {
    var cs = getComputedStyle(el);

    /* skip anything with a real shadow — clip-path would eat it */
    if (cs.boxShadow && cs.boxShadow !== 'none' && !/inset/.test(cs.boxShadow)) {
      el.dataset.sqSkipped = 'shadow';
      return;
    }

    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;

    var r = parseFloat(cs.borderTopLeftRadius) || 0;
    if (cs.borderTopLeftRadius.indexOf('%') > -1) r = w * parseFloat(cs.borderTopLeftRadius) / 100;
    if (r > Math.min(w, h) / 2) r = Math.min(w, h) / 2;      // pill
    if (r < 3) return;                                        // not worth it

    var d = pathFor(w, h, r);
    el.style.clipPath = 'path("' + d + '")';

    /* Only drop the border-radius once the clip has actually taken. Zeroing it
       first leaves a sharp-cornered rectangle for a frame — visible as a flash
       of square cards during load, and permanent if path() is unsupported. */
    if (getComputedStyle(el).clipPath === 'none') { el.style.clipPath = ''; return; }
    el.style.borderRadius = '0';

    /* redraw the hairline, which the clip has just cut off */
    var bw = parseFloat(cs.borderTopWidth) || 0;
    var bc = cs.borderTopColor;
    var svg = el.querySelector(':scope > svg[data-squircle]');

    if (bw > 0 && bc && bc !== 'rgba(0, 0, 0, 0)') {
      if (!svg) {
        svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('data-squircle', '');
        svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
                            'pointer-events:none;overflow:visible;z-index:99';
        var pa = document.createElementNS(NS, 'path');
        pa.setAttribute('fill', 'none');
        pa.setAttribute('vector-effect', 'non-scaling-stroke');
        svg.appendChild(pa);
        if (cs.position === 'static') el.style.position = 'relative';
        el.appendChild(svg);
      }
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      var path = svg.firstChild;
      path.setAttribute('d', d);
      path.setAttribute('stroke', bc);
      path.setAttribute('stroke-width', bw * 2);   // half is clipped away
      el.style.borderColor = 'transparent';
    } else if (svg) {
      svg.remove();
    }
  }

  function run() {
    document.querySelectorAll(SELECTOR).forEach(apply);
  }

  /* re-run on resize — clip-path: path() is in absolute px */
  var ro = window.ResizeObserver ? new ResizeObserver(function (entries) {
    entries.forEach(function (e) { apply(e.target); });
  }) : null;

  function observe() {
    if (!ro) return;
    document.querySelectorAll(SELECTOR).forEach(function (el) { ro.observe(el); });
  }

  function boot(){ requestAnimationFrame(function(){ run(); observe(); release(); }); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

  /* fonts change metrics — re-measure once they land */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  window.addEventListener('resize', run);

  window.squircle = { refresh: run, pathFor: pathFor };
})();
