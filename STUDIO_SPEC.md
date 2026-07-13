# NEAR-PHI STUDIO — build spec (2026-07-13, Fable-authored)

Mission: out-produce the viral math-visual genre (OmniGeometry, Maths Town,
beesandbombs, Horsthuis, physarum lane). One studio, many stunning modules,
every module capture-ready for near_phi/video/render.py Shorts.

## Common law (every module)

- ONE self-contained .html file in C:\Users\damon\projects\mathtools\.
  No CDN, no external assets, no Web Workers (file:// + render.py friendly).
- WebGL2 preferred; graceful fallback message if unavailable. Pure-black bg.
- Additive glow/bloom aesthetic. Neon line-work: gold #ffcf6a, cyan #59f2ff,
  magenta #ff59d6, violet #9b6bff on #000. Full-sat only; NEVER mid-gray wash.
- MOTION NEVER STOPS. No static frame anywhere in the loop.
- Seamless loop where the format calls for it; loop period = integer seconds.
- Vertical-safe composition: the money structure must live in the center
  9:16 crop of a 16:9 window (render.py crops to 1080x1920).
- `?capture=1` in URL = hide ALL UI chrome, start the best preset immediately.
- Expose `window.studio = { presets: [...], setPreset(i), params: {...} }`
  so render.py SETUP_JS can drive it.
- Minimal elegant UI otherwise: bottom-corner preset dots + title, monospace,
  fades out after 3s idle. No sliders-wall; presets carry the taste.
- 60fps target at 1080p on RTX 3080; DPR cap 2.

## Scar tissue (paid for in prior sessions — violating these = rejected)

1. NEVER unbounded GPU work in one draw (Windows TDR at ~2s kills the
   context). Bound iterations/march steps/agent counts hard.
2. GLSL smoothstep(a,b,x) with a>b is UNDEFINED on this GPU. Use
   1.0 - smoothstep(b,a,x).
3. Never sample a texture bound to unit 0 while rendering to it
   (silent draw drop). Ping-pong FBOs must swap cleanly.
4. Chromatic aberration offsets in UV units (~0.012), not pixels.
5. requestAnimationFrame loop must survive context-loss with a loud
   on-screen message, never a silent black canvas.

## Self-gate (module is NOT done until this passes)

Playwright headless (--use-gl=angle --use-angle=d3d11), 1280x2276 viewport,
screenshots at t=2s, 8s, 20s:
- mean luminance of center crop between 12 and 140 (not black, not blown)
- >=30% of pixels saturated in hue (vivid, not gray)
- consecutive screenshots differ (motion)
- zero console errors
Then LOOK at the screenshots and judge vs the reference genre: would this
stop a thumb-scroll next to an OmniGeometry reel? Iterate until yes.

## The modules (9 new, each mapped to a Damon theme + a viral-proven lane)

| file | name | theme | core |
|---|---|---|---|
| spirograph.html | BLOOM | sacred geometry | recursive epicycles, 6/8/12-fold symmetry, trail ACCUMULATION (never clear, slow fade ~0.995), thin glowing lines, layered rotation + phase-offset petal bloom. 10s seamless loop. The OmniGeometry kill shot. |
| physarum.html | MYCELIUM | living networks | Sage Jenson physarum: 1M+ agents in a trail FBO (diffuse+decay ping-pong), sense-rotate-deposit. Seed agents on a Flower-of-Life layout that dissolves into living network and re-forms. Amber + bioluminescent teal. 25s escalation. |
| tesseract.html | HYPERSPACE | alternate dimensions | 4D polytopes (tesseract, 16-cell, 24-cell, 120-cell) double-rotation in 4D, perspective-projected; edges = neon tubes w/ depth fog, vertices = bloom points. 8s perfect loop. |
| hyperbolic.html | THE GATE | DMT geometry | {7,3} and {5,4} Poincaré-disk tilings, conformal scroll toward the boundary (infinitely self-similar = perfect loop), Escher Circle-Limit coloring + neon variant, slow rotation + hue drift. |
| glyphs.html | XENOGLOSSIA | alien/sacred languages | procedural alien script: seeded glyph generator (strokes on a lattice w/ symmetry rules), glyphs WRITE themselves stroke by stroke in glowing ink across a dark stele, then burn/fade; occasional "translation" flicker. Rows scroll like a living manuscript. Gold ink + cyan accents. |
| reaction.html | MORPHOGENESIS | emergence | Gray-Scott reaction-diffusion, feed/kill animated along a closed path so coral->fingerprint->leopard morph continuously; neon-gradient + emboss-lit mapping. Loops the parameter path. |
| quasicrystal.html | QUASICRYSTAL | forbidden symmetry | sum of 7-9 rotated plane waves, phase-animated (seamless at 2π); duotone electric-blue/black + gold variant; slow global drift. Pure hypnosis, dvdp texture. |
| corridor.html | TEMPLE | raymarched fractal worlds | SDF flythrough: Menger/Kleinian corridors, fog + orbit-trap coloring + god-ray fake, slow dolly forever forward (domain repetition = infinite). March steps HARD-capped (TDR). Horsthuis look, real-time. |
| collide.html | ORBITAL | particle physics x satisfying | balls inside nested rotating rings with gaps; every collision = glowing arc + particle burst; escape through a gap spawns 2; ends in fractal chaos then resets seamlessly. Physics correct (circle collision), music-sync-ready (collision events -> window.studio.events). 30s escalation. |

Existing tools (mandelbrot, lie-groups, schrodinger, double-slit, wave,
coherence, resonance, particle-accelerator) stay as-is; the hub unifies all.

## The hub (index.html rebuild — Fable builds this directly)

- THE STUDIO: near-black void, starfield hint, holo register (thin strokes,
  corner brackets) per hq DESIGN_LAW aesthetics, but public-facing clean.
- Every tool = a card with a LIVE animated preview. ONE shared WebGL context,
  full-page canvas, each card's mini-shader drawn into its rect via scissor
  (never 17 contexts). DPR 1 for previews, pause offscreen cards, TDR-safe.
- Keeps all SEO/JSON-LD (updated with new tools), keeps @Near_Phi links.
- APEIRON (:3542) and RESONANCE full app (:3640) get local-badge cards when
  fetch to localhost succeeds; on github.io they show as "studio-local".
- Works from file://, local server, and github.io unchanged.

## Wire-up after QA

- render.py: TOOL_FILES += 9 entries; SETUP_JS drives window.studio presets;
  new tools default GPU path (d3d11), physarum/corridor flagged hang-risk.
- Lattice decision recorded (scope near-phi).
