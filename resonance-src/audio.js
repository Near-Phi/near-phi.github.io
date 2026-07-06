const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export class AudioEngine {
  constructor() {
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0.65;
    this.analyser.connect(this.ctx.destination);
    this.freq = new Uint8Array(this.analyser.frequencyBinCount);
    this.prevFreq = new Float32Array(this.analyser.frequencyBinCount);
    this.time = new Float32Array(this.analyser.fftSize);
    this.spectrum = new Uint8Array(512);
    this.wave = new Uint8Array(512);
    this.history = new Uint8Array(512 * 256);
    this.historyRow = 0;
    this.sourceName = "DEMO";
    this.pitchHz = 0;
    this.note = "--";
    this.cents = 0;
    this.centroid = 0;
    this.flux = 0;
    this.beat = 0;
    this.bpm = 0;
    this.fluxAvg = 0;
    this.lastBeat = 0;
    this.beats = [];
    this.mediaStream = null;
    this.fileSource = null;
    this.demoNodes = [];
    this.startDemo();
  }

  async resume() {
    if (this.ctx.state !== "running") await this.ctx.resume();
  }

  disconnectInputs() {
    for (const node of this.demoNodes) {
      try { node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    }
    this.demoNodes = [];
    if (this.fileSource) {
      try { this.fileSource.stop(); } catch {}
      try { this.fileSource.disconnect(); } catch {}
      this.fileSource = null;
    }
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) track.stop();
      this.mediaStream = null;
    }
  }

  startDemo() {
    this.disconnectInputs();
    const master = this.ctx.createGain();
    master.gain.value = 0.16;
    master.connect(this.analyser);
    const base = 66;
    for (let i = 0; i < 8; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i % 3 === 0 ? "triangle" : "sine";
      osc.frequency.value = base * (i + 1) * (i % 2 ? 1.004 : 0.997);
      gain.gain.value = 0.22 / (i + 1);
      osc.connect(gain).connect(master);
      osc.start();
      this.demoNodes.push(osc, gain, master);
    }
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 30;
    lfo.connect(lfoGain);
    for (let i = 0; i < this.demoNodes.length; i += 3) lfoGain.connect(this.demoNodes[i].frequency);
    lfo.start();
    this.demoNodes.push(lfo, lfoGain);
    this.sourceName = "DEMO";
  }

  async useMic() {
    await this.resume();
    this.disconnectInputs();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false
    });
    this.mediaStream = stream;
    const src = this.ctx.createMediaStreamSource(stream);
    src.connect(this.analyser);
    this.sourceName = "MIC";
  }

  async useFile(file) {
    await this.resume();
    const array = await file.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(array);
    this.disconnectInputs();
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(this.analyser);
    src.start();
    this.fileSource = src;
    this.sourceName = "FILE";
  }

  update(now) {
    this.analyser.getByteFrequencyData(this.freq);
    this.analyser.getFloatTimeDomainData(this.time);
    let flux = 0;
    let energy = 0;
    let weighted = 0;
    const nyquist = this.ctx.sampleRate * 0.5;
    for (let i = 0; i < this.freq.length; i++) {
      const v = this.freq[i] / 255;
      const p = this.prevFreq[i];
      if (v > p) flux += v - p;
      this.prevFreq[i] = v;
      energy += v;
      weighted += v * (i / this.freq.length) * nyquist;
    }
    this.flux = flux / this.freq.length * 90;
    this.fluxAvg = this.fluxAvg * 0.96 + this.flux * 0.04;
    this.beat = Math.max(0, Math.min(1, (this.flux - this.fluxAvg * 1.55) * 3.8));
    if (this.beat > 0.35 && now - this.lastBeat > 0.28) {
      if (this.lastBeat > 0) this.beats.push(now - this.lastBeat);
      if (this.beats.length > 10) this.beats.shift();
      this.lastBeat = now;
      if (this.beats.length > 2) {
        const avg = this.beats.reduce((a, b) => a + b, 0) / this.beats.length;
        this.bpm = Math.round(60 / avg);
      }
    }
    this.centroid = energy > 0 ? weighted / energy : 0;
    this.pitchHz = autoCorrelate(this.time, this.ctx.sampleRate);
    const noteData = pitchToNote(this.pitchHz);
    this.note = noteData.note;
    this.cents = noteData.cents;
    downsample(this.freq, this.spectrum);
    waveformToBytes(this.time, this.wave);
    this.history.set(this.spectrum, this.historyRow * 512);
    this.historyRow = (this.historyRow + 1) & 255;
  }
}

function downsample(src, dst) {
  for (let i = 0; i < dst.length; i++) {
    const t0 = Math.pow(i / dst.length, 2.15);
    const t1 = Math.pow((i + 1) / dst.length, 2.15);
    const a = Math.max(0, Math.floor(t0 * src.length));
    const b = Math.max(a + 1, Math.floor(t1 * src.length));
    let m = 0;
    for (let j = a; j < b && j < src.length; j++) m = Math.max(m, src[j]);
    dst[i] = m;
  }
}

function waveformToBytes(src, dst) {
  for (let i = 0; i < dst.length; i++) {
    const v = src[Math.floor(i / dst.length * src.length)] || 0;
    dst[i] = Math.max(0, Math.min(255, Math.round((v * 0.5 + 0.5) * 255)));
  }
}

function autoCorrelate(buf, sampleRate) {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.012) return 0;
  let start = 0;
  let end = buf.length - 1;
  for (let i = 0; i < buf.length / 2; i++) {
    if (Math.abs(buf[i]) < 0.2) { start = i; break; }
  }
  for (let i = 1; i < buf.length / 2; i++) {
    if (Math.abs(buf[buf.length - i]) < 0.2) { end = buf.length - i; break; }
  }
  const slice = buf.slice(start, end);
  const size = slice.length;
  const correlations = new Float32Array(Math.floor(size / 2));
  for (let lag = 32; lag < correlations.length; lag++) {
    let sum = 0;
    for (let i = 0; i < correlations.length; i++) sum += Math.abs(slice[i] - slice[i + lag]);
    correlations[lag] = 1 - sum / correlations.length;
  }
  let best = 0;
  let bestVal = 0;
  for (let lag = 32; lag < correlations.length; lag++) {
    if (correlations[lag] > bestVal) {
      bestVal = correlations[lag];
      best = lag;
    }
  }
  if (bestVal < 0.32 || best === 0) return 0;
  const x1 = correlations[best - 1] || bestVal;
  const x2 = correlations[best];
  const x3 = correlations[best + 1] || bestVal;
  const shift = (x3 - x1) / (2 * (2 * x2 - x1 - x3));
  return sampleRate / (best + shift);
}

function pitchToNote(hz) {
  if (!Number.isFinite(hz) || hz < 30 || hz > 5000) return { note: "--", cents: 0 };
  const midi = 69 + 12 * Math.log2(hz / 440);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  const octave = Math.floor(rounded / 12) - 1;
  return { note: `${NOTE_NAMES[(rounded % 12 + 12) % 12]}${octave}`, cents };
}
