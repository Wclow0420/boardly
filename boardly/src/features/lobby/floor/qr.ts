// A small QR code encoder (ISO/IEC 18004), so the lobby can show a
// table's invite link as a code to scan without a native library: byte
// mode, error correction level M, versions 1–10 (up to 213 bytes, far
// more than a link needs), the mask with the lowest penalty. After
// Project Nayuki's reference encoder. Pure TypeScript, no Skia: the
// lobby draws the modules it returns.

/** The code's modules, `size` × `size`, row by row: true is dark. */
export interface QrCode {
  size: number;
  modules: boolean[][];
}

// level M, by version (index 0 unused)
const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const MAX_VERSION = 10;
/** Level M's two format bits. */
const ECL_BITS = 0;

function rawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const align = Math.floor(ver / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (ver >= 7) result -= 36;
  }
  return result;
}

const dataCodewords = (ver: number) => Math.floor(rawDataModules(ver) / 8) - ECC_PER_BLOCK[ver] * BLOCKS[ver];

// ---------------------------------------------------------- Reed–Solomon

function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= gfMul(coef, factor);
    });
  }
  return result;
}

// ---------------------------------------------------------- the bits

function utf8(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const c = ch.codePointAt(0) as number;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else {
      out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
  }
  return out;
}

/** The data codewords for `bytes` at version `ver` (null: they don't fit). */
function encodeData(bytes: number[], ver: number): number[] | null {
  const countBits = ver <= 9 ? 8 : 16;
  const capacity = dataCodewords(ver) * 8;
  const bits: number[] = [];
  const put = (value: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0100, 4);
  put(bytes.length, countBits);
  for (const b of bytes) put(b, 8);
  if (bits.length > capacity) return null;
  put(0, Math.min(4, capacity - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) put(pad, 8);
  const out: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
    out.push(b);
  }
  return out;
}

/** The data split into blocks, each with its error correction, and the
 *  blocks interleaved. */
function withEcc(data: number[], ver: number): number[] {
  const numBlocks = BLOCKS[ver];
  const eccLen = ECC_PER_BLOCK[ver];
  const raw = Math.floor(rawDataModules(ver) / 8);
  const numShort = numBlocks - (raw % numBlocks);
  const shortLen = Math.floor(raw / numBlocks);
  const divisor = rsDivisor(eccLen);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const dat = data.slice(k, k + shortLen - eccLen + (i < numShort ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, divisor);
    if (i < numShort) dat.push(0);
    blocks.push(dat.concat(ecc));
  }
  const out: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= numShort) out.push(block[i]);
    });
  }
  return out;
}

// ---------------------------------------------------------- the matrix

function alignmentPositions(ver: number, size: number): number[] {
  if (ver === 1) return [];
  const n = Math.floor(ver / 7) + 2;
  const step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < n; pos -= step) result.splice(1, 0, pos);
  return result;
}

const bit = (x: number, i: number) => ((x >>> i) & 1) !== 0;

class Matrix {
  modules: boolean[][];
  fixed: boolean[][];
  readonly size: number;
  constructor(size: number) {
    this.size = size;
    this.modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    this.fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  }
  set(x: number, y: number, dark: boolean) {
    this.modules[y][x] = dark;
    this.fixed[y][x] = true;
  }
}

function drawFunctions(m: Matrix, ver: number) {
  const { size } = m;
  for (let i = 0; i < size; i++) {
    m.set(6, i, i % 2 === 0);
    m.set(i, 6, i % 2 === 0);
  }
  const finder = (x: number, y: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) m.set(xx, yy, d !== 2 && d !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  const pos = alignmentPositions(ver, size);
  const last = pos.length - 1;
  pos.forEach((px, i) =>
    pos.forEach((py, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) m.set(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }),
  );
  drawFormat(m, 0);
  if (ver >= 7) {
    let rem = ver;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      m.set(a, b, bit(bits, i));
      m.set(b, a, bit(bits, i));
    }
  }
}

function drawFormat(m: Matrix, mask: number) {
  const { size } = m;
  const data = (ECL_BITS << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  const bits = ((data << 10) | rem) ^ 0x5412;
  for (let i = 0; i <= 5; i++) m.set(8, i, bit(bits, i));
  m.set(8, 7, bit(bits, 6));
  m.set(8, 8, bit(bits, 7));
  m.set(7, 8, bit(bits, 8));
  for (let i = 9; i < 15; i++) m.set(14 - i, 8, bit(bits, i));
  for (let i = 0; i < 8; i++) m.set(size - 1 - i, 8, bit(bits, i));
  for (let i = 8; i < 15; i++) m.set(8, size - 15 + i, bit(bits, i));
  m.set(8, size - 8, true);
}

function drawCodewords(m: Matrix, data: number[]) {
  const { size } = m;
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!m.fixed[y][x] && i < data.length * 8) {
          m.modules[y][x] = bit(data[i >>> 3], 7 - (i & 7));
          i++;
        }
      }
    }
  }
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask(m: Matrix, mask: number) {
  const test = MASKS[mask];
  for (let y = 0; y < m.size; y++) {
    for (let x = 0; x < m.size; x++) {
      if (!m.fixed[y][x] && test(x, y)) m.modules[y][x] = !m.modules[y][x];
    }
  }
}

/** How hard a pattern is to read (lower is better): long runs, 2 × 2
 *  blocks, finder look-alikes and an uneven balance of dark and light. */
function penalty(m: Matrix): number {
  const { size, modules } = m;
  let score = 0;
  const line = (get: (i: number) => boolean) => {
    let run = 1;
    for (let i = 1; i <= size; i++) {
      if (i < size && get(i) === get(i - 1)) run++;
      else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    // 1:1:3:1:1 with four light either side
    const at = (i: number) => (i < 0 || i >= size ? false : get(i));
    for (let i = 0; i + 6 < size; i++) {
      if (at(i) && !at(i + 1) && at(i + 2) && at(i + 3) && at(i + 4) && !at(i + 5) && at(i + 6)) {
        const before = !at(i - 1) && !at(i - 2) && !at(i - 3) && !at(i - 4);
        const after = !at(i + 7) && !at(i + 8) && !at(i + 9) && !at(i + 10);
        if (before || after) score += 40;
      }
    }
  };
  for (let y = 0; y < size; y++) line((x) => modules[y][x]);
  for (let x = 0; x < size; x++) line((y) => modules[y][x]);
  let dark = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (modules[y][x]) dark++;
      if (x + 1 < size && y + 1 < size) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
      }
    }
  }
  const total = size * size;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

/** `text` as a QR code (level M), or null if it is too long. */
export function qrEncode(text: string): QrCode | null {
  const bytes = utf8(text);
  for (let ver = 1; ver <= MAX_VERSION; ver++) {
    const data = encodeData(bytes, ver);
    if (!data) continue;
    const codewords = withEcc(data, ver);
    const size = ver * 4 + 17;
    let best: { score: number; modules: boolean[][] } | null = null;
    for (let mask = 0; mask < 8; mask++) {
      const m = new Matrix(size);
      drawFunctions(m, ver);
      drawCodewords(m, codewords);
      applyMask(m, mask);
      drawFormat(m, mask);
      const score = penalty(m);
      if (!best || score < best.score) best = { score, modules: m.modules };
    }
    return { size, modules: (best as { modules: boolean[][] }).modules };
  }
  return null;
}

/** The dark modules as one SVG path, a module a unit, `quiet` units of
 *  margin round it (the code's box is size + 2 × quiet square). */
export function qrPath(code: QrCode, quiet = 0): string {
  const d: string[] = [];
  code.modules.forEach((row, y) => {
    let x = 0;
    while (x < code.size) {
      if (!row[x]) {
        x++;
        continue;
      }
      let end = x;
      while (end < code.size && row[end]) end++;
      d.push(`M${x + quiet} ${y + quiet}h${end - x}v1h${x - end}Z`);
      x = end;
    }
  });
  return d.join("");
}
