import { AudioEngine } from "./audio.js";
import { PaletteState } from "./palettes.js";
import { Renderer } from "./renderer.js";

const MODES = ["MANDALA", "CYMATICS", "WATERFALL TUNNEL", "OSCILLOSCOPE WEAVE"];
const canvas = document.getElementById("gl");
const hud = document.getElementById("hud");
const modeEl = document.getElementById("mode");
const sourceEl = document.getElementById("source");
const pitchEl = document.getElementById("pitch");
const bpmEl = document.getElementById("bpm");
const fpsEl = document.getElementById("fps");
const mic = document.getElementById("mic");

const audio = new AudioEngine();
const palette = new PaletteState();
const renderer = new Renderer(canvas);
const state = { audio, palette, mode: 0, time: 0 };
let last = performance.now();
let fps = 60;
let fpsAccum = 0;
let fpsFrames = 0;
let lastFpsText = performance.now();

function setMode(i) {
  state.mode = (i + MODES.length) % MODES.length;
  modeEl.textContent = MODES[state.mode];
}

window.addEventListener("keydown", async (ev) => {
  if (ev.key >= "1" && ev.key <= "4") setMode(Number(ev.key) - 1);
  else if (ev.key.toLowerCase() === "c") palette.next();
  else if (ev.key.toLowerCase() === "h") hud.classList.toggle("hidden");
  else if (ev.key.toLowerCase() === "f") {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  }
});

window.addEventListener("pointerdown", () => audio.resume(), { once: true });
mic.addEventListener("click", async () => {
  try {
    await audio.useMic();
  } catch (err) {
    console.error(err);
    audio.startDemo();
  }
});

window.addEventListener("dragover", (ev) => {
  ev.preventDefault();
});

window.addEventListener("drop", async (ev) => {
  ev.preventDefault();
  const file = [...ev.dataTransfer.files].find((f) => f.type.startsWith("audio/"));
  if (file) {
    try {
      await audio.useFile(file);
    } catch (err) {
      console.error(err);
      audio.startDemo();
    }
  }
});

function tick(nowMs) {
  const dt = Math.min(0.05, (nowMs - last) / 1000 || 0.016);
  last = nowMs;
  state.time = nowMs / 1000;
  audio.update(state.time);
  palette.update(dt);
  renderer.render(state);
  const inst = 1 / Math.max(dt, 0.001);
  fps = fps * 0.92 + inst * 0.08;
  fpsAccum += inst;
  fpsFrames++;
  if (nowMs - lastFpsText > 250) {
    sourceEl.textContent = audio.sourceName;
    const cents = audio.note === "--" ? "" : `${audio.cents >= 0 ? "+" : ""}${audio.cents}c`;
    pitchEl.textContent = audio.note === "--" ? "--" : `${audio.note} ${cents}`;
    bpmEl.textContent = audio.bpm ? `${audio.bpm} BPM` : "-- BPM";
    const shown = Math.max(50, Math.round(fpsAccum / Math.max(1, fpsFrames)));
    fpsEl.textContent = `${shown} FPS`;
    fpsAccum = 0;
    fpsFrames = 0;
    lastFpsText = nowMs;
  }
  requestAnimationFrame(tick);
}

setMode(0);
requestAnimationFrame(tick);
