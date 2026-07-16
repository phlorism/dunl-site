# dunl.app — Design Language Kit

Everything in one place: all 13 design languages, their motion rules, and the shared glitch/error overlay.

## Contents
- **index.html** — interactive reference for all 13 languages. Switching languages morphs the whole page and replays it in the incoming language's own motion dialect (the same switch motion as the live site's Design Language section). ←/→ arrows browse. Works offline by double-clicking.
- **design-languages.json** — machine-readable tokens: 6-color palette + motion tokens per language.
- **glitch-overlay.js** — drop-in takeover/error component (`window.Glitch`). Used by the reference page's "Takeover & error states" card.
- **systems/** — the seven deep-dive system pages (Concentric, Commerce, Editorial, Atelier, Chaos, Woodland, Phosphor) with full motion sections and live demos, plus `design-tokens.json` (Tokens Studio format). The /systems session gate is removed so they open directly from disk.

## Glitch overlay API
```html
<script src="glitch-overlay.js"></script>
<script>
  Glitch.show('signal acquired');                        // 1.8s takeover
  Glitch.error('503', 'uplink lost — retrying');         // persistent error screen
  Glitch.show({ big:'HOLD', lines:['awaiting authorization'], theme:'amber' });
  Glitch.show({ lines:['DECRYPTING…'], theme:'cyan', duration:0 });  // persistent
  Glitch.hide();
</script>
```
Themes: green · red · amber · cyan. Esc or click dismisses. Honors prefers-reduced-motion.

## How to update the site on GitHub
The files that changed this round:
1. `index.html` (site root) — motion tokens per theme, design-language switch replay, scope-chip bottom sheets, updated motion descriptions.
2. `systems/<language>/index.html` × 7 — new Motion sections with live demos (use the originals from your working copy, not the gate-stripped ones in this kit).
3. `systems/design-tokens.json` — new `motion.duration` / `motion.easing` groups.

**Command line**
```bash
cd <your-repo>
git checkout -b motion-language
# copy the updated files over their old versions, keeping the same paths
git add -A
git commit -m "Motion language for all systems + scope chip sheets + glitch overlay"
git push -u origin motion-language
# open the PR on github.com and merge — Pages redeploys in ~1 minute
```

**Or in the browser:** repo → open the folder → "Add file → Upload files" → drag the updated files into the matching folders → commit to main. Hard-refresh (Cmd-Shift-R) after the Pages build finishes.
