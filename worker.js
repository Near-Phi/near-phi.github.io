// ==================== Mandelbrot deep-zoom reference-orbit worker ====================
// Computes the high-precision reference orbit Z_n for a center point using pure-JS
// BigInt fixed-point arithmetic (no external wasm dependency, works offline).
// The main thread renders every other pixel as a perturbation delta off this orbit.
//
// Protocol:
//   <- { type:'ready' }                              on startup
//   -> { type:'computeReference', centerRe, centerIm, maxIter, zoomExponent, taskId }
//   <- { type:'progress', iteration, maxIter }       occasionally
//   <- { type:'referenceReady', taskId, escapeIter, orbitRe, orbitIm, orbitMag2,
//        centerReF, centerImF, saSkip }
//   <- { type:'error', message }                     on failure

'use strict';

// ---- BigInt fixed-point helpers (binary fixed point with P fractional bits) ----

// Parse a decimal string (supports sign, fraction, and e-notation) into a
// fixed-point BigInt scaled by 2^P, with round-to-nearest.
function parseToFixed(str, P) {
  str = String(str).trim();
  let sign = 1n;
  if (str[0] === '-') { sign = -1n; str = str.slice(1); }
  else if (str[0] === '+') { str = str.slice(1); }

  let [mant, eStr] = str.split(/[eE]/);
  let e = eStr ? parseInt(eStr, 10) : 0;
  let [ip, fp] = mant.split('.');
  ip = ip || '0';
  fp = fp || '';

  const digits = ip + fp;
  const intVal = digits.length ? BigInt(digits) : 0n;
  // decimal exponent so that value === intVal * 10^tenExp
  const tenExp = e - fp.length;

  const scale = 1n << BigInt(P);
  let num, den;
  if (tenExp >= 0) {
    num = intVal * (10n ** BigInt(tenExp)) * scale;
    den = 1n;
  } else {
    num = intVal * scale;
    den = 10n ** BigInt(-tenExp);
  }
  let q = num / den;
  const r = num % den;
  if (2n * r >= den) q += 1n; // round half up (magnitude)
  return sign * q;
}

// Multiply two fixed-point BigInts, round-to-nearest, keep P fractional bits.
function fpmul(x, y, P) {
  const p = x * y;
  const half = 1n << BigInt(P - 1);
  if (p >= 0n) return (p + half) >> BigInt(P);
  return -(((-p) + half) >> BigInt(P));
}

// Convert a fixed-point BigInt (scale 2^P) to a JS double.
function toFloat(x, P) {
  if (x === 0n) return 0;
  const neg = x < 0n;
  let ax = neg ? -x : x;
  const bits = ax.toString(2).length;
  let shift = bits - 53;
  if (shift < 0) shift = 0;
  const mant = Number(ax >> BigInt(shift));
  const val = mant * Math.pow(2, shift - P);
  return neg ? -val : val;
}

// ---- Reference orbit ----

function computeReference(msg) {
  const { centerRe, centerIm, maxIter, zoomExponent, taskId } = msg;

  // Fractional bits: enough to resolve the pixel grid at this zoom, plus guard
  // digits for the iteration. log2(10) ~ 3.3219. Clamp to a sane range.
  const P = Math.min(1024, Math.max(64, Math.ceil((zoomExponent || 0) * 3.3219 + 96) | 0));

  const Cr = parseToFixed(centerRe, P);
  const Ci = parseToFixed(centerIm, P);

  const cap = Math.min(Math.max(1, maxIter | 0), 200000);
  const escapeThresh = 256n << BigInt(P); // |Z|^2 > 256

  const orbitRe = new Float32Array(cap);
  const orbitIm = new Float32Array(cap);
  const orbitMag2 = new Float32Array(cap);

  let Zr = 0n, Zi = 0n;
  let n = 0;

  for (; n < cap; n++) {
    const Zr2 = fpmul(Zr, Zr, P);
    const Zi2 = fpmul(Zi, Zi, P);
    const mag2 = Zr2 + Zi2;

    // store this iterate (as double -> cast to float32 on write)
    orbitRe[n] = toFloat(Zr, P);
    orbitIm[n] = toFloat(Zi, P);
    orbitMag2[n] = orbitRe[n] * orbitRe[n] + orbitIm[n] * orbitIm[n];

    if (mag2 > escapeThresh) { n++; break; }

    // Z_{n+1} = Z_n^2 + C ;  (a+bi)^2 = (a^2-b^2) + 2ab i
    const newZi = 2n * fpmul(Zr, Zi, P) + Ci;
    const newZr = Zr2 - Zi2 + Cr;
    Zr = newZr;
    Zi = newZi;

    if ((n & 8191) === 0) {
      self.postMessage({ type: 'progress', iteration: n, maxIter: cap });
    }
  }

  const escapeIter = n; // number of stored orbit entries

  self.postMessage({
    type: 'referenceReady',
    taskId,
    escapeIter,
    orbitRe: orbitRe.subarray(0, escapeIter),
    orbitIm: orbitIm.subarray(0, escapeIter),
    orbitMag2: orbitMag2.subarray(0, escapeIter),
    centerReF: toFloat(Cr, P),
    centerImF: toFloat(Ci, P),
    saSkip: 0, // series approximation disabled; shader starts perturbation at iter 0
  });
}

self.onmessage = (e) => {
  const data = e.data || {};
  try {
    if (data.type === 'computeReference') {
      computeReference(data);
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: (err && err.message) || String(err) });
  }
};

self.postMessage({ type: 'ready' });
