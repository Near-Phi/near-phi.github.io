const VERT = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const VISUAL_FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uResolution;
uniform float uTime;
uniform int uMode;
uniform float uBeat;
uniform float uCentroid;
uniform float uPitch;
uniform float uFlux;
uniform float uHistoryRow;
uniform sampler2D uSpectrum;
uniform sampler2D uWave;
uniform sampler2D uHistory;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uD;

#define PI 3.141592653589793

vec3 pal(float t) {
  return clamp(uA + uB * cos(6.2831853 * (uC * t + uD)), 0.0, 1.6);
}

float spec(float x) {
  x = clamp(x, 0.0, 1.0);
  return texture(uSpectrum, vec2(x, 0.5)).r;
}

float wave(float x) {
  return texture(uWave, vec2(fract(x), 0.5)).r * 2.0 - 1.0;
}

float history(float x, float y) {
  float row = fract((uHistoryRow - y * 255.0) / 256.0);
  return texture(uHistory, vec2(clamp(x, 0.0, 1.0), row)).r;
}

float line(float d, float w) {
  return 1.0 - smoothstep(w, w * 2.4, abs(d));
}

vec3 mandala(vec2 uv) {
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;
  float r = length(p);
  float a = atan(p.y, p.x);
  float ring = clamp((r - 0.08) / 0.86, 0.0, 1.0);
  float band = pow(ring, 1.75);
  float e = spec(band);
  float petals = 18.0 + floor(uCentroid / 780.0);
  float petal = pow(abs(cos(a * petals * 0.5 + sin(r * 12.0 - uTime * 0.7))), 14.0);
  float breath = 1.0 + uBeat * 0.16 + 0.025 * sin(uTime * 1.8);
  float body = line(r - (0.20 + 0.68 * e * breath), 0.018 + e * 0.030) * petal;
  float rings = 0.42 * line(sin(r * 58.0 - e * 4.0), 0.10) * (0.25 + e);
  float core = exp(-r * r * 8.0) * (0.35 + uBeat);
  float spokes = pow(abs(cos(a * 48.0)), 22.0) * (1.0 - smoothstep(0.08, 0.86, r)) * (0.18 + e);
  vec3 col = pal(band + e * 0.20 + uTime * 0.025) * (body * 3.2 + rings + core + spokes);
  col += pal(fract(a / 6.2831853 + 0.5)) * e * petal * 1.25;
  return col;
}

vec3 cymatics(vec2 uv) {
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= uResolution.x / uResolution.y;
  float low = 0.08;
  float high = 0.55;
  float e1 = 0.0;
  float e2 = 0.0;
  for (int i = 0; i < 64; i++) {
    float x = float(i) / 63.0;
    float e = spec(x);
    if (x < 0.45 && e > e1) { e1 = e; low = x; }
    if (x > 0.10 && e > e2) { e2 = e; high = x; }
  }
  float m = 2.0 + floor(low * 18.0);
  float n = 3.0 + floor(high * 24.0);
  float plate = sin(PI * m * (p.x + 1.0) * 0.5) * sin(PI * n * (p.y + 1.0) * 0.5);
  plate += sin(PI * n * (p.x + 1.0) * 0.5 + uTime * 0.25) * sin(PI * m * (p.y + 1.0) * 0.5) * 0.72;
  plate += 0.45 * sin((length(p) * (m + n) - uTime * 0.65));
  float nodal = 1.0 - smoothstep(0.018, 0.145, abs(plate));
  float sand = fract(sin(dot(floor((p + 1.0) * 520.0), vec2(12.9898, 78.233))) * 43758.5453);
  float grains = smoothstep(0.62, 1.0, sand) * smoothstep(0.25, 1.0, abs(plate));
  float vignette = 1.0 - smoothstep(0.35, 1.24, length(p));
  vec3 col = pal(abs(plate) * 0.38 + low + uTime * 0.018) * (nodal * 3.8 + grains * 0.72 + 0.13);
  col += vec3(1.25, 1.13, 0.92) * grains * 0.35;
  return col * vignette;
}

vec3 tunnel(vec2 uv) {
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= uResolution.x / uResolution.y;
  float r = length(p);
  float a = atan(p.y, p.x) / 6.2831853 + 0.5;
  float z = 1.0 / max(0.08, r);
  float rings = fract(z * 0.18 - uTime * 0.34);
  float x = fract(a + 0.08 * sin(z * 0.12 + uTime));
  float h = history(pow(x, 1.35), rings);
  float grid = line(fract(z * 0.38 - uTime * 0.55) - 0.5, 0.035) + line(fract(a * 32.0 + z * 0.02) - 0.5, 0.035);
  float fog = 1.0 - smoothstep(0.12, 1.45, r);
  vec3 col = pal(x + rings * 0.42 + uTime * 0.012) * (h * 3.6 + grid * 0.26);
  col += pal(h + 0.2) * h * h * 2.0;
  return col * fog;
}

uniform sampler2D uPersist;

vec3 weave(vec2 uv) {
  vec3 col = texture(uPersist, uv).rgb;
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;
  float r = length(p);
  col += pal(r + 0.4) * exp(-r * 2.5) * 0.10;
  return col * (0.85 + uBeat * 0.30);
}

void main() {
  vec3 col = vec3(0.0);
  if (uMode == 0) col = mandala(vUv);
  else if (uMode == 1) col = cymatics(vUv);
  else if (uMode == 2) col = tunnel(vUv);
  else col = weave(vUv);
  float vig = 1.0 - smoothstep(0.25, 0.92, length(vUv - 0.5));
  fragColor = vec4(col * (0.72 + vig * 0.55), 1.0);
}`;

// Oscilloscope weave line geometry: each strand is a triangle-strip ribbon,
// positions computed in the vertex shader from the live waveform texture.
// Ribbon width is applied in pixel space so the core stays 2-3px at any
// resolution; brightness lives in HDR and the bloom pass supplies the glow.
const LINE_VERT = `#version 300 es
precision highp float;
uniform sampler2D uWave;
uniform vec2 uResolution;
uniform float uTime;
uniform float uPitch;
uniform float uCurve;
uniform float uSamples;
out float vT;
out float vW;

vec2 braid(float t) {
  float w = texture(uWave, vec2(fract(t), 0.5)).r * 2.0 - 1.0;
  float w2 = texture(uWave, vec2(fract(t + 0.19), 0.5)).r * 2.0 - 1.0;
  float pitch = clamp(uPitch / 880.0, 0.08, 2.0);
  float ph = uCurve * 2.0943951;
  float ang = t * 6.2831853 * (3.0 + pitch * 3.0) + uTime * 0.65 + ph;
  float rad = 0.18 + 0.55 * t + w * 0.16;
  vec2 q = vec2(cos(ang + w2 * 1.6), sin(ang * (1.0 + 0.08 * pitch) + w * 1.2)) * rad;
  q += 0.12 * vec2(cos(uTime + t * 18.0 + ph), sin(uTime * 0.73 + t * 13.0 + ph));
  return q;
}

void main() {
  int i = gl_VertexID >> 1;
  float side = float((gl_VertexID & 1) * 2 - 1);
  float t = float(i) / (uSamples - 1.0);
  float aspect = uResolution.x / uResolution.y;
  vec2 p0 = braid(t);
  vec2 p1 = braid(min(1.0, t + 1.0 / uSamples));
  vec2 ndc0 = vec2(p0.x / aspect, p0.y);
  vec2 ndc1 = vec2(p1.x / aspect, p1.y);
  vec2 px0 = (ndc0 * 0.5 + 0.5) * uResolution;
  vec2 px1 = (ndc1 * 0.5 + 0.5) * uResolution;
  vec2 tang = px1 - px0;
  float len = max(length(tang), 1e-4);
  vec2 nrm = vec2(-tang.y, tang.x) / len;
  vec2 px = px0 + nrm * side * 1.35;
  vT = t;
  vW = texture(uWave, vec2(fract(t), 0.5)).r * 2.0 - 1.0;
  gl_Position = vec4(px / uResolution * 2.0 - 1.0, 0.0, 1.0);
}`;

const LINE_FRAG = `#version 300 es
precision highp float;
in float vT;
in float vW;
out vec4 fragColor;
uniform float uTime;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uD;
vec3 pal(float t) {
  return clamp(uA + uB * cos(6.2831853 * (uC * t + uD)), 0.0, 1.6);
}
void main() {
  vec3 col = pal(vT + vW * 0.15 + uTime * 0.025) * (0.55 + abs(vW) * 1.9);
  fragColor = vec4(col, 1.0);
}`;

// persistence decay: previous phosphor frame, dimmed
const DECAY_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform float uDecay;
void main() {
  fragColor = vec4(texture(uTex, vUv).rgb * uDecay, 1.0);
}`;

const BLUR_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uDir;
uniform vec2 uResolution;
void main() {
  vec2 px = uDir / uResolution;
  vec3 c = texture(uTex, vUv).rgb * 0.227027;
  c += texture(uTex, vUv + px * 1.384615).rgb * 0.316216;
  c += texture(uTex, vUv - px * 1.384615).rgb * 0.316216;
  c += texture(uTex, vUv + px * 3.230769).rgb * 0.070270;
  c += texture(uTex, vUv - px * 3.230769).rgb * 0.070270;
  fragColor = vec4(c, 1.0);
}`;

const POST_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform vec2 uResolution;
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec2 dir = vUv - 0.5;
  float ca = 0.012;
  vec3 s;
  s.r = texture(uScene, vUv + dir * ca).r;
  s.g = texture(uScene, vUv).g;
  s.b = texture(uScene, vUv - dir * ca).b;
  vec3 bloom = texture(uBloom, vUv).rgb;
  vec3 col = aces(s + bloom * 0.72);
  fragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl2", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "high-performance" });
    if (!this.gl) throw new Error("WebGL2 unavailable");
    const gl = this.gl;
    this.floatExt = gl.getExtension("EXT_color_buffer_float");
    this.linearExt = gl.getExtension("OES_texture_float_linear");
    if (!this.floatExt) throw new Error("EXT_color_buffer_float unavailable");
    this.visual = program(gl, VERT, VISUAL_FRAG);
    this.blur = program(gl, VERT, BLUR_FRAG);
    this.post = program(gl, VERT, POST_FRAG);
    this.line = program(gl, LINE_VERT, LINE_FRAG);
    this.decay = program(gl, VERT, DECAY_FRAG);
    this.vao = gl.createVertexArray();
    this.persist = null;               // ping-pong phosphor pair, created on resize
    this.lastMode = -1;
    this.spectrumTex = dataTex(gl, 512, 1);
    this.waveTex = dataTex(gl, 512, 1);
    this.historyTex = dataTex(gl, 512, 256);
    this.blackTex = dataTex(gl, 1, 1);
    this.targets = [];
    this.width = 0;
    this.height = 0;
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(2, Math.floor(this.canvas.clientWidth * dpr));
    const h = Math.max(2, Math.floor(this.canvas.clientHeight * dpr));
    if (w === this.width && h === this.height) return;
    this.width = this.canvas.width = w;
    this.height = this.canvas.height = h;
    for (const t of this.targets) destroyTarget(this.gl, t);
    this.targets = [target(this.gl, w, h), target(this.gl, Math.max(2, w >> 1), Math.max(2, h >> 1)), target(this.gl, Math.max(2, w >> 1), Math.max(2, h >> 1))];
    if (this.persist) { destroyTarget(this.gl, this.persist[0]); destroyTarget(this.gl, this.persist[1]); }
    this.persist = [target(this.gl, w, h), target(this.gl, w, h)];
  }

  // phosphor pass: decay the previous frame into the back buffer, lay the
  // fresh ribbons on top additively, swap. Returns the live phosphor texture.
  renderWeaveLines(state) {
    const gl = this.gl;
    const [front, back] = this.persist;
    gl.bindFramebuffer(gl.FRAMEBUFFER, back.fbo);
    gl.viewport(0, 0, back.w, back.h);
    gl.useProgram(this.decay.program);
    uniform1f(gl, this.decay, "uDecay", 0.90);
    tex(gl, this.decay, "uTex", front.tex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(this.line.program);
    const p = state.palette.current();
    uniform2f(gl, this.line, "uResolution", back.w, back.h);
    uniform1f(gl, this.line, "uTime", state.time);
    uniform1f(gl, this.line, "uPitch", state.audio.pitchHz);
    uniform3fv(gl, this.line, "uA", p.a);
    uniform3fv(gl, this.line, "uB", p.b);
    uniform3fv(gl, this.line, "uC", p.c);
    uniform3fv(gl, this.line, "uD", p.d);
    tex(gl, this.line, "uWave", this.waveTex, 0);
    const SAMPLES = 1024;
    uniform1f(gl, this.line, "uSamples", SAMPLES);
    for (let strand = 0; strand < 3; strand++) {
      uniform1f(gl, this.line, "uCurve", strand);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, SAMPLES * 2);
    }
    gl.disable(gl.BLEND);
    this.persist = [back, front];
    return back.tex;
  }

  render(state) {
    const gl = this.gl;
    this.resize();
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(this.vao);
    upload(gl, this.spectrumTex, 512, 1, state.audio.spectrum);
    upload(gl, this.waveTex, 512, 1, state.audio.wave);
    upload(gl, this.historyTex, 512, 256, state.audio.history);

    // phosphor lines for the weave; entering the mode starts from black
    let persistTex = this.blackTex;
    if (state.mode === 3) {
      if (this.lastMode !== 3) {
        for (const t of this.persist) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
      }
      persistTex = this.renderWeaveLines(state);
    }
    this.lastMode = state.mode;

    const scene = this.targets[0];
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo);
    gl.viewport(0, 0, scene.w, scene.h);
    gl.useProgram(this.visual.program);
    bindCommon(gl, this.visual, state, this.width, this.height);
    tex(gl, this.visual, "uSpectrum", this.spectrumTex, 0);
    tex(gl, this.visual, "uWave", this.waveTex, 1);
    tex(gl, this.visual, "uHistory", this.historyTex, 2);
    tex(gl, this.visual, "uPersist", persistTex, 3);   // blackTex off-mode: no dangling sampler
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const b1 = this.targets[1];
    const b2 = this.targets[2];
    gl.bindFramebuffer(gl.FRAMEBUFFER, b1.fbo);
    gl.viewport(0, 0, b1.w, b1.h);
    gl.useProgram(this.blur.program);
    uniform2f(gl, this.blur, "uResolution", b1.w, b1.h);
    uniform2f(gl, this.blur, "uDir", 1, 0);
    tex(gl, this.blur, "uTex", scene.tex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, b2.fbo);
    gl.viewport(0, 0, b2.w, b2.h);
    uniform2f(gl, this.blur, "uResolution", b2.w, b2.h);
    uniform2f(gl, this.blur, "uDir", 0, 1);
    tex(gl, this.blur, "uTex", b1.tex, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.post.program);
    uniform2f(gl, this.post, "uResolution", this.width, this.height);
    tex(gl, this.post, "uScene", scene.tex, 0);
    tex(gl, this.post, "uBloom", b2.tex, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return { program: p, locs: new Map() };
}

function shader(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function loc(gl, p, name) {
  if (!p.locs.has(name)) p.locs.set(name, gl.getUniformLocation(p.program, name));
  return p.locs.get(name);
}

function uniform1f(gl, p, name, x) { gl.uniform1f(loc(gl, p, name), x); }
function uniform1i(gl, p, name, x) { gl.uniform1i(loc(gl, p, name), x); }
function uniform2f(gl, p, name, x, y) { gl.uniform2f(loc(gl, p, name), x, y); }
function uniform3fv(gl, p, name, x) { gl.uniform3fv(loc(gl, p, name), x); }

function bindCommon(gl, prog, state, w, h) {
  const p = state.palette.current();
  uniform2f(gl, prog, "uResolution", w, h);
  uniform1f(gl, prog, "uTime", state.time);
  uniform1i(gl, prog, "uMode", state.mode);
  uniform1f(gl, prog, "uBeat", state.audio.beat);
  uniform1f(gl, prog, "uCentroid", state.audio.centroid);
  uniform1f(gl, prog, "uPitch", state.audio.pitchHz);
  uniform1f(gl, prog, "uFlux", state.audio.flux);
  uniform1f(gl, prog, "uHistoryRow", state.audio.historyRow);
  uniform3fv(gl, prog, "uA", p.a);
  uniform3fv(gl, prog, "uB", p.b);
  uniform3fv(gl, prog, "uC", p.c);
  uniform3fv(gl, prog, "uD", p.d);
}

function tex(gl, prog, name, texture, unit) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  uniform1i(gl, prog, name, unit);
}

function dataTex(gl, w, h) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, null);
  return t;
}

function upload(gl, t, w, h, data) {
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RED, gl.UNSIGNED_BYTE, data);
}

function target(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Framebuffer incomplete");
  return { tex, fbo, w, h };
}

function destroyTarget(gl, t) {
  gl.deleteFramebuffer(t.fbo);
  gl.deleteTexture(t.tex);
}
