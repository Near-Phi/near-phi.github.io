export const palettes = [
  { name: "ION", a: [0.48, 0.42, 0.36], b: [0.52, 0.44, 0.39], c: [1.00, 0.78, 0.58], d: [0.02, 0.18, 0.38] },
  { name: "FRACTURE", a: [0.36, 0.40, 0.46], b: [0.46, 0.35, 0.52], c: [0.74, 0.92, 0.66], d: [0.18, 0.04, 0.42] },
  { name: "EMBER", a: [0.42, 0.34, 0.28], b: [0.55, 0.39, 0.28], c: [0.72, 0.92, 1.18], d: [0.08, 0.22, 0.34] },
  { name: "GLASS", a: [0.34, 0.47, 0.52], b: [0.42, 0.48, 0.44], c: [1.20, 0.86, 0.68], d: [0.46, 0.12, 0.02] },
  { name: "ORCHID", a: [0.46, 0.35, 0.48], b: [0.44, 0.50, 0.37], c: [0.62, 1.12, 0.86], d: [0.10, 0.36, 0.55] },
  { name: "SIGNAL", a: [0.40, 0.43, 0.34], b: [0.50, 0.42, 0.48], c: [1.16, 0.70, 0.94], d: [0.28, 0.02, 0.20] },
  { name: "SOLAR", a: [0.50, 0.38, 0.30], b: [0.46, 0.46, 0.34], c: [0.82, 1.08, 0.60], d: [0.00, 0.24, 0.52] }
];

export class PaletteState {
  constructor() {
    this.index = 0;
    this.from = palettes[0];
    this.to = palettes[0];
    this.blend = 1;
  }

  next() {
    this.from = this.current();
    this.index = (this.index + 1) % palettes.length;
    this.to = palettes[this.index];
    this.blend = 0;
  }

  update(dt) {
    this.blend = Math.min(1, this.blend + dt * 1.8);
  }

  currentName() {
    return palettes[this.index].name;
  }

  current() {
    const p = { name: this.to.name, a: [], b: [], c: [], d: [] };
    const k = this.blend * this.blend * (3 - 2 * this.blend);
    for (const key of ["a", "b", "c", "d"]) {
      for (let i = 0; i < 3; i++) p[key][i] = this.from[key][i] * (1 - k) + this.to[key][i] * k;
    }
    return p;
  }
}
