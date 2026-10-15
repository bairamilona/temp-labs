/* =============================================================================
   URA ORB  ·  v1.0
   One WebGL fragment shader, two surfaces:

     URAOrb.mount(el, {preset:'orb'})    the primary action button
     URAOrb.mount(el, {preset:'aura'})   the hero ring — light only, no glass

   The effect is offset colour channels (chromatic aberration) mixed with
   thin-film interference whose refraction samples the real backdrop at three
   different offsets, one per channel. CSS cannot do the second part — it has
   no access to what is behind an element — which is why this is a shader.

   No dependencies. ~9kb. Works down to WebGL1.

     <div id="orb" style="width:108px;height:108px"></div>
     <script src="ura-orb.js"></script>
     <script>
       const orb = URAOrb.mount(document.getElementById('orb'), {
         preset: 'orb',
         backdrop: 'bg.jpg'          // optional; what the ring refracts
       });
       orb.set({ mop: 0.8 });        // live tweak
       orb.destroy();                // tear down
     </script>

   Every look-affecting value lives in the preset objects below. Paste a config
   exported from the tuner straight over one of them.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.URAOrb = factory();
}(typeof self !== 'undefined' ? self : this, function () {
'use strict';

/* --------------------------------------------------------------------------
   PRESETS
   -------------------------------------------------------------------------- */

var SPECTRUM = [                      /* no red: warm reds read as an alert */
  { col:'#3FCF6A', op:1.02, soft:0.40, amp:9.5 },
  { col:'#79C0EC', op:0.66, soft:0.40, amp:9.5 },
  { col:'#612CC3', op:0.85, soft:0.86, amp:9.5 }
];

var BASE = {
  /* ring geometry — all normalised, so the look is size-independent */
  R:0.535, W:0.25, soft:1.06, sq:1, tilt:0,
  discScale:0.93,          /* visible disc as a fraction of the element box  */

  /* channels */
  channels:SPECTRUM, cblend:2, csoft:0.54, balance:1, path:0, drift:0,
  /* cblend 0 add · 1 screen · 2 colour-dodge · 3 lighten · 4 difference    */
  /* path   0 orbit · 1 figure-8 · 2 linear · 3 still · 4 counter-rotate    */

  /* thin film + refraction */
  film:120, fvar:0.8, noise:0.42, bands:3.5, redcut:0.9,
  ior:0.98, disp:1.1, warp:0.86, fres:1, spec:0,

  /* grade */
  mix:0.46, mop:0.55, sat:0.76, con:1.9, bri:1.16, gam:1.16,

  /* glass body */
  bare:0, gfill:0.16, gblur:49, gedge:0.12, gshade:0,

  /* top lens — its backdrop blur is what makes the light read as *under* glass */
  lensR:0.54, lensOp:0.55, lensFill:0.22, lensBg:34,
  lensScat:7, lensTr:0.45, lensEdge:0.1, lensFe:0.02,

  /* motion */
  spd:0.34, brt:0.055,

  /* backdrop: what the dispersion refracts. A flat colour works; an image
     works better, because then the colour separation is of something real. */
  backdrop:null, backdropColor:'#C8D1D8', backdropBrightness:1.00, veil:0.26
};

/* The hero ring is the same shader with the glass switched off. Opacity does
   most of the muting, but dropping CONTRAST matters nearly as much: at 1.9 the
   colour separates into bands that read as a deliberate object; at 1.35 it
   stays a wash. */
var PRESETS = {
  orb: {},
  aura: {
    bare:1,                /* no glass body, no lens disc, transparent ground */
    discScale:0.955,
    mop:0.187,             /* 0.34x */
    sat:0.547,             /* 0.72x */
    con:1.35,
    spd:0.177,             /* 0.52x */
    spec:0,
    gfill:0.03,
    lensR:0.62,            /* wider + more transmissive: more of the ring is  */
    lensTr:0.62,           /* seen *through* glass, so it sits further back   */
    lensOp:0.396,
    brt:0.115              /* a real swell — see the two-sine breath below    */
  }
};

/* --------------------------------------------------------------------------
   SHADER
   -------------------------------------------------------------------------- */

var VS = 'attribute vec2 a;varying vec2 vUv;' +
         'void main(){vUv=a*0.5+0.5;gl_Position=vec4(a,0.,1.);}';

var FS = [
'precision highp float;varying vec2 vUv;',
'uniform vec2 uRes,uCover,uOff;',
'uniform float uT,uR,uW,uSoft,uSq,uTilt,uMix,uMop,uSat,uCon,uBri,uGam,',
' uCount,uCBlend,uCSoft,uFilm,uFvar,uNoise,uBands,uRedCut,uIor,uDisp,uWarp,',
' uFres,uSpec,uGFill,uGBlur,uGEdge,uGShade,uBreath,uHasTex,uBri0,uVeil,uFit,uBare,',
' uLensR,uLensOp,uLensFill,uLensBg,uLensScat,uLensTr,uLensEdge,uLensFe;',
'uniform vec3 uFlat,uCol[6];uniform vec4 uCh[6];uniform sampler2D uTex;',

'float hash(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453);}',
'float nse(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
' return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),',
'            mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}',

/* The backdrop as it is actually rendered. If the page lifts or veils the
   image behind this element, mirror that here — otherwise the ring refracts a
   darker source than its surroundings and lays a dark wash over a light one. */
'vec3 bgAt(vec2 uv){',
/* brightness + veil describe how the PAGE renders a photo behind this
   element. A flat colour is already the rendered result, so lifting it
   again clips it to white and the whole disc blows out. */
' if(uHasTex<0.5) return uFlat;',
' vec3 c=texture2D(uTex,uv*uCover+uOff).rgb*uBri0;',
' return mix(min(c,vec3(1.0)),vec3(1.0),uVeil);}',
'vec3 bgBlur(vec2 uv,float rad){',
' vec3 s=vec3(0.);float k=rad/uRes.x;',
' for(int i=0;i<12;i++){float a=float(i)*2.399963;',
'  s+=bgAt(uv+vec2(cos(a),sin(a))*k*sqrt(float(i+1)/12.0));}',
' return s/12.0;}',

/* two-beam thin-film interference */
'vec3 filmc(float d){vec3 lam=vec3(612.,545.,464.);',
' return 0.5+0.5*cos(12.566370614*1.33*d*uBands/lam/3.0);}',
'vec3 sat3(vec3 c,float s){float l=dot(c,vec3(.2126,.7152,.0722));',
' return mix(vec3(l),c,s);}',
'float annulus(vec2 p,float soft){float h=(length(p)-uR)/max(uW,1e-4);',
' return pow(max(1.0-smoothstep(0.0,1.0,abs(h)),0.0),1.0+soft*3.0);}',

'vec3 glow(vec2 q,vec2 uv){',
' float r=length(q),ang=atan(q.y,q.x);',
/* --- offset colour channels: chromatic aberration --- */
' vec3 chs=vec3(0.0);',
' for(int i=0;i<6;i++){ if(float(i)>=uCount) break;',
'  vec4 c=uCh[i];vec2 o=vec2(cos(c.w),sin(c.w))*c.z*0.01;',
'  vec3 v=uCol[i]*annulus(q-o,uSoft+c.y*uCSoft)*c.x;',
'  if(uCBlend<0.5) chs+=v; else if(uCBlend<1.5) chs=1.0-(1.0-chs)*(1.0-v);',
'  else if(uCBlend<2.5) chs=min(vec3(4.0),chs+v*(0.6+chs*1.6));',
'  else if(uCBlend<3.5) chs=max(chs,v); else chs=abs(chs-v); }',
/* --- thin film + per-channel refraction of the real backdrop --- */
' vec3 flm=vec3(0.0);float band=annulus(q,uSoft);',
' if(band>0.002){',
'  float h=(r-uR)/max(uW,1e-4);',
'  vec3 N=normalize(vec3(q/max(r,1e-4)*clamp(h,-1.,1.),sqrt(max(0.0,1.0-h*h))));',
'  float fres=pow(1.0-abs(N.z),uFres);',
'  float nz=nse(vec2(ang*2.6+uT*0.22,r*7.0-uT*0.14));',
'  float d=uFilm*(1.0+uFvar*(fres*1.4+(nz-0.5)*uNoise*2.0+sin(ang*3.0+uT*0.55)*0.3));',
'  vec3 irid=filmc(d);vec2 dir=q/max(r,1e-4);',
'  vec2 off=dir*(uIor*clamp(h,-1.,1.)*0.045)+dir*uWarp*(nz-0.5)*0.03;',
'  vec3 bgr;',
'  bgr.r=bgAt(uv+off*(1.0+uDisp*0.6)).r;',    /* the three samples that make */
'  bgr.g=bgAt(uv+off).g;',                    /* this impossible in CSS      */
'  bgr.b=bgAt(uv+off*(1.0-uDisp*0.6)).b;',
'  float ex=max(irid.r-max(irid.g,irid.b),0.0);',
'  irid.r-=ex*uRedCut;irid.g+=ex*uRedCut*0.9;',  /* red wedge -> yellow-green */
'  flm=(bgr*0.45+irid*(0.5+fres*1.0)+pow(fres,3.0)*uSpec)*band; }',
' vec3 fx=mix(chs,flm,uMix);',
' fx=sat3(fx,uSat);fx=(fx-0.5)*uCon+0.5;fx*=uBri;',
' return pow(max(fx,0.0),vec3(1.0/uGam));}',

'void main(){',
' vec2 q=(vUv-0.5)*2.0/uFit;',          /* disc edge at r=1, canvas beyond */
' float ca=cos(uTilt),sa=sin(uTilt);',
' q=vec2(q.x*ca-q.y*sa,q.x*sa+q.y*ca);',
' q.y/=uSq; q/=uBreath;',
' float r=length(q);',
' float disc=1.0-smoothstep(0.985,1.0,r);',
' float lens=1.0-smoothstep(uLensR-uLensFe,uLensR+uLensFe,r);',

/* ---- BARE: no glass body, no lens disc, no backdrop. Only the light. ---- */
' if(uBare>0.5){',
'  vec3 lb=glow(q,vUv);',
'  if(lens>0.002 && uLensScat>0.0){',
'   vec3 ab=vec3(0.0);',
'   for(int i=0;i<8;i++){float a=float(i)*2.399963;',
'    vec2 o=vec2(cos(a),sin(a))*uLensScat*0.004*sqrt(float(i+1)/8.0);',
'    ab+=glow(q+o,vUv+o*0.06);}',
'   lb=mix(lb,ab/8.0*uLensTr,lens);',
'  } else if(lens>0.002){ lb=mix(lb,lb*uLensTr,lens); }',
'  vec3 L=max(lb*uMop,0.0);',
'  float al=clamp(max(L.r,max(L.g,L.b))*1.9,0.0,1.0);',
'  gl_FragColor=vec4(min(L,vec3(al)),al); return;',
' }',

' if(disc<0.001){gl_FragColor=vec4(0.0);return;}',
' vec3 col=bgAt(vUv);',
' vec3 g=mix(bgBlur(vUv,uGBlur),vec3(1.0),uGFill);',
' g*=1.0-uGShade*smoothstep(0.0,1.0,r);',
' col=mix(col,g,disc);',
' col+=uGEdge*smoothstep(0.86,1.0,r)*(1.0-smoothstep(0.99,1.0,r));',

' vec3 lit=glow(q,vUv);',
' if(lens>0.002 && uLensScat>0.0){',
'  vec3 acc=vec3(0.0);',
'  for(int i=0;i<8;i++){float a=float(i)*2.399963;',
'   vec2 o=vec2(cos(a),sin(a))*uLensScat*0.004*sqrt(float(i+1)/8.0);',
'   acc+=glow(q+o,vUv+o*0.06);}',
'  lit=mix(lit,acc/8.0*uLensTr,lens);',
' } else if(lens>0.002){ lit=mix(lit,lit*uLensTr,lens); }',
' col+=lit*uMop;',

' if(lens>0.002){',
'  vec3 lensCol=mix(bgBlur(vUv,uLensBg),vec3(1.0),uLensFill);',
'  col=mix(col,mix(col,lensCol,uLensOp),lens);',
'  col+=uLensEdge*smoothstep(uLensR-uLensFe*2.0,uLensR,r)',
'      *(1.0-smoothstep(uLensR,uLensR+uLensFe,r));',
' }',
' gl_FragColor=vec4(clamp(col,0.0,1.0)*disc, disc);}'
].join('\n');

var UNIFORMS = ('uRes uCover uOff uT uR uW uSoft uSq uTilt uMix uMop uSat uCon uBri ' +
  'uGam uCount uCBlend uCSoft uFilm uFvar uNoise uBands uRedCut uIor uDisp uWarp ' +
  'uFres uSpec uGFill uGBlur uGEdge uGShade uBreath uHasTex uBri0 uVeil uFit uBare ' +
  'uLensR uLensOp uLensFill uLensBg uLensScat uLensTr uLensEdge uLensFe uFlat uTex')
  .split(' ');

/* --------------------------------------------------------------------------
   HELPERS
   -------------------------------------------------------------------------- */

function hex(h) {
  h = String(h).replace('#', '');
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.substr(0,2),16)/255,
          parseInt(h.substr(2,2),16)/255,
          parseInt(h.substr(4,2),16)/255];
}
function assign(t) {
  for (var i = 1; i < arguments.length; i++) {
    var s = arguments[i]; if (!s) continue;
    for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
  }
  return t;
}
function compile(gl, type, src) {
  var o = gl.createShader(type);
  gl.shaderSource(o, src); gl.compileShader(o);
  if (!gl.getShaderParameter(o, gl.COMPILE_STATUS))
    console.warn('[URAOrb]', gl.getShaderInfoLog(o));
  return o;
}

/* --------------------------------------------------------------------------
   MOUNT
   -------------------------------------------------------------------------- */

var OVERFLOW = 1.24;   /* canvas headroom so the breathing disc is never clipped */

function mount(el, opts) {
  opts = opts || {};
  var P = assign({}, BASE, PRESETS[opts.preset || 'orb'], opts);
  var CH = P.channels || SPECTRUM;

  var cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:' + ((1 - OVERFLOW) / 2 * 100).toFixed(2) +
    '%;width:' + (OVERFLOW*100) + '%;height:' + (OVERFLOW*100) + '%;pointer-events:none';
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.appendChild(cv);

  var gl = cv.getContext('webgl', {alpha:true, antialias:true, premultipliedAlpha:true});
  if (!gl) { cv.remove(); return {set:function(){}, destroy:function(){}, ok:false}; }

  var prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  UNIFORMS.forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  U.uCol = gl.getUniformLocation(prog, 'uCol[0]');
  U.uCh  = gl.getUniformLocation(prog, 'uCh[0]');

  /* backdrop texture — optional; the dispersion is of this */
  var tex = gl.createTexture(), hasTex = 0, texAspect = 1;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([200,200,200,255]));
  if (P.backdrop) {
    var im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      texAspect = im.width / im.height; hasTex = 1;
    };
    im.src = P.backdrop;
  }

  var cols = new Float32Array(18), chs = new Float32Array(24);
  CH.forEach(function (c, i) { if (i < 6) cols.set(hex(c.col), i * 3); });

  var flat = hex(P.backdropColor);
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = 0, last = performance.now(), raf = 0, visible = true, dead = false;

  var io = window.IntersectionObserver ? new IntersectionObserver(function (e) {
    visible = e[0].isIntersecting;
  }, {rootMargin:'64px'}) : null;
  if (io) io.observe(el);

  function frame(now) {
    if (dead) return;
    var dt = Math.min((now - last) / 1000, 0.05); last = now;
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    if (!reduce) T += dt * P.spd;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth || (el.clientWidth * OVERFLOW) || 134;
    var px = Math.max(1, Math.round(w * dpr));
    if (cv.width !== px) { cv.width = cv.height = px; }
    gl.viewport(0, 0, cv.width, cv.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);

    /* cover-fit the backdrop across the canvas */
    var cov, off;
    if (texAspect > 1) { cov = [1 / texAspect, 1]; off = [(1 - cov[0]) / 2, 0]; }
    else               { cov = [1, texAspect];     off = [0, (1 - cov[1]) / 2]; }

    gl.uniform2fv(U.uRes, [cv.width, cv.height]);
    gl.uniform2fv(U.uCover, cov); gl.uniform2fv(U.uOff, off);
    gl.uniform1f(U.uT, T);
    gl.uniform1f(U.uFit, P.discScale / OVERFLOW);
    gl.uniform1f(U.uBare, P.bare ? 1 : 0);
    gl.uniform1f(U.uR, P.R); gl.uniform1f(U.uW, P.W); gl.uniform1f(U.uSoft, P.soft);
    gl.uniform1f(U.uSq, P.sq); gl.uniform1f(U.uTilt, P.tilt * Math.PI / 180);
    gl.uniform1f(U.uMix, P.mix); gl.uniform1f(U.uMop, P.mop); gl.uniform1f(U.uSat, P.sat);
    gl.uniform1f(U.uCon, P.con); gl.uniform1f(U.uBri, P.bri); gl.uniform1f(U.uGam, P.gam);
    gl.uniform1f(U.uCount, Math.min(CH.length, 6));
    gl.uniform1f(U.uCBlend, P.cblend); gl.uniform1f(U.uCSoft, P.csoft);
    gl.uniform1f(U.uFilm, P.film); gl.uniform1f(U.uFvar, P.fvar);
    gl.uniform1f(U.uNoise, P.noise); gl.uniform1f(U.uBands, P.bands);
    gl.uniform1f(U.uRedCut, P.redcut); gl.uniform1f(U.uIor, P.ior);
    gl.uniform1f(U.uDisp, P.disp); gl.uniform1f(U.uWarp, P.warp);
    gl.uniform1f(U.uFres, P.fres); gl.uniform1f(U.uSpec, P.spec);
    gl.uniform1f(U.uGFill, P.gfill); gl.uniform1f(U.uGBlur, P.gblur * dpr);
    gl.uniform1f(U.uGEdge, P.gedge); gl.uniform1f(U.uGShade, P.gshade);
    gl.uniform1f(U.uHasTex, hasTex); gl.uniform1f(U.uBri0, P.backdropBrightness);
    gl.uniform1f(U.uVeil, P.veil);
    gl.uniform3fv(U.uFlat, flat);
    gl.uniform1f(U.uLensR, P.lensR); gl.uniform1f(U.uLensOp, P.lensOp);
    gl.uniform1f(U.uLensFill, P.lensFill); gl.uniform1f(U.uLensBg, P.lensBg * dpr);
    gl.uniform1f(U.uLensScat, P.lensScat); gl.uniform1f(U.uLensTr, P.lensTr);
    gl.uniform1f(U.uLensEdge, P.lensEdge); gl.uniform1f(U.uLensFe, P.lensFe);

    /* Breathing: two sines at incommensurable rates (1.15 and 0.47 share no
       common factor) so the swell never repeats — it drifts in and out of
       phase forever. Weights sum to 1, so peak amplitude is exactly brt. */
    var br = P.brt * (0.62 * Math.sin(T * 1.15) + 0.38 * Math.sin(T * 0.47 + 1.9));
    gl.uniform1f(U.uBreath, 1 + br);

    /* Balance pulls the phases onto an even 360/n spacing, so the offset
       vectors cancel and the ring never swings off-axis — only the colours
       travel. At balance 0 the authored phases are used as-is. */
    var n = CH.length;
    CH.forEach(function (c, i) {
      if (i >= 6) return;
      var even = i * 360 / n;
      var ph   = ((c.ph != null ? c.ph : even) * (1 - P.balance) + even * P.balance) * Math.PI / 180;
      var spin = (P.path === 3) ? 0 : T * 1.4;
      var dir  = (P.path === 4 && i % 2) ? -1 : 1;
      var ax = c.amp, ay = (P.path === 1) ? c.amp * 0.55 : (P.path === 2 ? c.amp * 0.35 : c.amp);
      var dr = 1 + Math.sin(T * 0.37 + i) * P.drift * 0.25;
      var a  = spin * dir + ph;
      var bx = Math.cos(a) * ax * dr;
      var by = ((P.path === 1) ? Math.sin(a * 2) : Math.sin(a)) * ay * dr;
      chs.set([c.op, c.soft, Math.sqrt(bx*bx + by*by), Math.atan2(by, bx)], i * 4);
    });

    gl.uniform3fv(U.uCol, cols); gl.uniform4fv(U.uCh, chs);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(U.uTex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  raf = requestAnimationFrame(frame);

  return {
    ok: true,
    el: el,
    canvas: cv,
    config: P,
    set: function (next) { assign(P, next); if (next.channels) {
      CH = next.channels;
      CH.forEach(function (c, i) { if (i < 6) cols.set(hex(c.col), i * 3); });
    } return this; },
    destroy: function () {
      dead = true; cancelAnimationFrame(raf);
      if (io) io.disconnect();
      var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
      cv.remove();
    }
  };
}

return { mount: mount, PRESETS: PRESETS, BASE: BASE, SPECTRUM: SPECTRUM };
}));
