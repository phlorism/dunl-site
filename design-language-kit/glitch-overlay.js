/* ============================================================
   GLITCH OVERLAY — dunl.app shared takeover / error component
   Drop-in: <script src="glitch-overlay.js"></script>
   API:  Glitch.show(text | options) · Glitch.error(code, message, opts?) · Glitch.hide()
   Options: { big, lines[], text, theme: green|red|amber|cyan,
              color, splitA, splitB, background, duration (ms, 0 = persistent),
              dismissible (default true — esc or click) }
   Honors prefers-reduced-motion (static layers off, aberration hidden).
   ============================================================ */
(function () {
  if (window.Glitch) return;

  var css = [
    '#glitch-overlay {',
    '  --g-color: #5cff9a; --g-a: #ff2e63; --g-b: #2ee6ff; --g-bg: #05060a;',
    '  --g-mono: ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace;',
    '  position: fixed; inset: 0; z-index: 2147483600; display: none;',
    '  align-items: center; justify-content: center; flex-direction: column;',
    '  background: var(--g-bg); overflow: hidden;',
    '  box-shadow: inset 0 0 140px rgba(0,0,0,.85);',
    '}',
    '#glitch-overlay.on { display: flex; animation: g-flicker .11s steps(2) infinite; }',
    '#glitch-overlay .g-noise { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .32; mix-blend-mode: screen; pointer-events: none; }',
    '#glitch-overlay .g-scan {',
    '  position: absolute; inset: 0; z-index: 1; pointer-events: none;',
    '  background: repeating-linear-gradient(rgba(0,0,0,0) 0 2px, rgba(0,0,0,.5) 2px 3px);',
    '  animation: g-scan .25s steps(3) infinite;',
    '}',
    '#glitch-overlay .g-stack { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 0 20px; text-align: center; }',
    '#glitch-overlay .g-hint {',
    '  position: absolute; bottom: 30px; left: 0; right: 0; z-index: 2; pointer-events: none;',
    '  text-align: center; font-family: var(--g-mono); font-size: 11px; letter-spacing: .2em; text-transform: uppercase;',
    '  color: color-mix(in srgb, var(--g-color) 45%, transparent);',
    '  opacity: 0; transition: opacity .2s;',
    '}',
    '#glitch-overlay.g-show-hint .g-hint { opacity: .7; }',
    '#glitch-overlay .g-line {',
    '  position: relative; font-family: var(--g-mono); white-space: nowrap;',
    '  color: var(--g-color);',
    '  text-shadow: 0 0 5px color-mix(in srgb, var(--g-color) 55%, transparent), 0 0 14px color-mix(in srgb, var(--g-color) 22%, transparent);',
    '  animation: g-jit .18s steps(2) infinite;',
    '}',
    '#glitch-overlay .g-line:not(.g-big) { font-size: 15px; letter-spacing: .06em; }',
    '#glitch-overlay .g-line.g-big { font-size: clamp(40px, 12vw, 74px); font-weight: 700; letter-spacing: .02em; }',
    '#glitch-overlay .g-line::before, #glitch-overlay .g-line::after {',
    '  content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden;',
    '}',
    '#glitch-overlay .g-line::before { color: var(--g-a); clip-path: inset(0 0 55% 0); animation: g-a .5s steps(2) infinite; }',
    '#glitch-overlay .g-line::after  { color: var(--g-b); clip-path: inset(55% 0 0 0); animation: g-b .42s steps(2) infinite; }',
    '@keyframes g-flicker { 0% { opacity: 1; } 50% { opacity: .9; } 100% { opacity: 1; } }',
    '@keyframes g-scan { to { transform: translateY(3px); } }',
    '@keyframes g-jit { 0% { transform: translate(0,0); } 25% { transform: translate(-1px,0); } 50% { transform: translate(1px,0); } 75% { transform: translate(0,1px); } 100% { transform: translate(0,0); } }',
    '@keyframes g-a { 0% { clip-path: inset(0 0 62% 0); transform: translate(-2px,0); } 50% { clip-path: inset(38% 0 22% 0); transform: translate(2px,0); } 100% { clip-path: inset(8% 0 70% 0); transform: translate(-1px,0); } }',
    '@keyframes g-b { 0% { clip-path: inset(62% 0 0 0); transform: translate(2px,0); } 50% { clip-path: inset(22% 0 40% 0); transform: translate(-2px,0); } 100% { clip-path: inset(70% 0 8% 0); transform: translate(1px,0); } }',
    '@media (prefers-reduced-motion: reduce) {',
    '  #glitch-overlay.on, #glitch-overlay .g-line, #glitch-overlay .g-line::before, #glitch-overlay .g-line::after, #glitch-overlay .g-scan { animation: none !important; }',
    '  #glitch-overlay .g-noise { display: none; }',
    '  #glitch-overlay .g-line::before, #glitch-overlay .g-line::after { opacity: 0; }',
    '}'
  ].join('\n');

  var styleTag = document.createElement('style');
  styleTag.id = 'glitch-overlay-styles';
  styleTag.textContent = css;
  (document.head || document.documentElement).appendChild(styleTag);

  var THEMES = {
    green: { color: '#5cff9a', a: '#ff2e63', b: '#2ee6ff' },
    red:   { color: '#ff5c5c', a: '#ffd23b', b: '#2ee6ff' },
    amber: { color: '#ffc24b', a: '#ff2e63', b: '#2ee6ff' },
    cyan:  { color: '#5cd9ff', a: '#ff2e63', b: '#a05cff' }
  };

  var el = document.createElement('div');
  el.id = 'glitch-overlay';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<svg class="g-noise" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
      '<filter id="g-static" x="0%" y="0%" width="100%" height="100%">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="3" stitchTiles="stitch" result="n">' +
          '<animate attributeName="seed" values="1;7;3;9;2;8;4;6;1" dur="0.5s" repeatCount="indefinite"/>' +
        '</feTurbulence>' +
        '<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  4 0 0 0 -1.6"/>' +
      '</filter>' +
      '<rect width="100%" height="100%" filter="url(#g-static)"/>' +
    '</svg>' +
    '<div class="g-scan"></div>' +
    '<div class="g-stack"></div>' +
    '<div class="g-hint">esc or click to dismiss</div>';

  function mount() { if (!el.isConnected && document.body) document.body.appendChild(el); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  var stack = el.querySelector('.g-stack');
  var timer = null;

  function makeLine(text, big) {
    var d = document.createElement('div');
    d.className = 'g-line' + (big ? ' g-big' : '');
    d.textContent = text;
    d.setAttribute('data-text', text);
    return d;
  }

  function show(opts) {
    mount();
    if (typeof opts === 'string') opts = { lines: [opts] };
    opts = opts || {};
    var theme = THEMES[opts.theme] || THEMES.green;
    el.style.setProperty('--g-color', opts.color || theme.color);
    el.style.setProperty('--g-a', opts.splitA || theme.a);
    el.style.setProperty('--g-b', opts.splitB || theme.b);
    if (opts.background) el.style.setProperty('--g-bg', opts.background);

    stack.innerHTML = '';
    if (opts.big) stack.appendChild(makeLine(String(opts.big), true));
    var lines = opts.lines || (opts.text ? [opts.text] : []);
    lines.forEach(function (t) { stack.appendChild(makeLine(String(t), false)); });

    var dur = (opts.duration === undefined) ? 1800 : opts.duration;
    var dismissible = (opts.dismissible !== false);
    el.__dismissible = dismissible;
    el.style.cursor = dismissible ? 'pointer' : 'default';
    el.classList.toggle('g-show-hint', dismissible && dur === 0);

    el.classList.add('on');
    clearTimeout(timer);
    if (dur > 0) timer = setTimeout(hide, dur);
  }

  function hide() {
    el.classList.remove('on');
    el.classList.remove('g-show-hint');
    clearTimeout(timer);
  }

  el.addEventListener('click', function () { if (el.__dismissible) hide(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && el.__dismissible && el.classList.contains('on')) hide();
  });

  function error(code, message, opts) {
    opts = opts || {};
    show({
      big: String(code),
      lines: message ? [String(message)] : [],
      theme: opts.theme || 'red',
      color: opts.color, splitA: opts.splitA, splitB: opts.splitB, background: opts.background,
      duration: (opts.duration === undefined) ? 0 : opts.duration
    });
  }

  window.Glitch = { show: show, hide: hide, error: error, themes: THEMES, el: el };
})();
