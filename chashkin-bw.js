const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const Color = require('canvas-sketch-util/color');
const math = require('canvas-sketch-util/math');
const mat4 = require('gl-mat4');
const createRegl = require('regl');
const glsl = require('glslify');
const palettes = require('nice-color-palettes');
const memoize = require('memoize');

// const seed = random.getRandomSeed();
// const seed = '88356';
// const seed = '69211';
// const seed = '300809';
// const seed = '288326';
// const seed = '323879';
// const seed = '272310';
// const seed = '918835';
// const seed = '32361';
const seed = '182141';
random.setSeed(seed);
console.log('seed', seed);

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true },
  dimensions: [ 1080, 1080 ],
  duration: 10,
};


const bmYellowColor = [ 0.922, 0.702, 0.043, 1];
const bmPinkColor = [ 0.5085, 0.2436, 0.2479, 1];
const white = [ 1, 1, 1, 1 ];
const black = [ 0.086, 0.086, 0.086, 1 ];
const mainColor = bmYellowColor;

function flatCos(b, x) {
  return (
    Math.sqrt(
      (1 + b ** 2) / (1 + b ** 2 ** Math.cos(x) ** 2)
    ) * Math.cos(x)
  );
}


const piramidsCount = random.rangeFloor(10, 20);
const piramids = [];
for (let i = 0; i < piramidsCount; i++) {
  const min = random.range(-1.0, +1.0);
  piramids.push({
    scale: random.rangeFloor(1, 20),
    min: min,
    max: min + 0.5,
    timeInc: random.rangeFloor(-100, 100),
    timeMult: random.rangeFloor(1, 10),
  });
}

function donutVerticies(n, ratio) {
  const arr = [];
  const r1 = 0.5;
  const r2 = r1 * ratio;
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 0; i < l; i += inc) {
    arr.push([ Math.cos(i) * r1, Math.sin(i) * r1, 0.0]);
    arr.push([ Math.cos(i) * r2, Math.sin(i) * r2, 0.0]);
  }
  return arr;
}

function donutVerticies3d(n, ratio) {
  const arr = [];
  const r1 = 0.5;
  const r2 = r1 * ratio;
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 0; i < l; i += inc) {
    arr.push([ Math.cos(i) * r1, Math.sin(i) * r1, -0.5]);
    arr.push([ Math.cos(i) * r2, Math.sin(i) * r2, -0.5]);
  }

  for (let i = 0; i < l; i += inc) {
    arr.push([ Math.cos(i) * r1, Math.sin(i) * r1, +0.5]);
    arr.push([ Math.cos(i) * r2, Math.sin(i) * r2, +0.5]);
  }

  return arr;
}

function donutElements(n) {
  const arr = [];
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 2; i < 2 * n; i++) {
    arr.push([i - 2, i - 1, i ]);
  }
  arr.push([2 * n - 2, 2 * n - 1, 0 ]);
  arr.push([ 0, 1, 2 * n - 1 ]);
  return arr;
}

function rect(a, b, r1, r2, z, arr = []) {
  arr.push([ Math.cos(a) * r1, Math.sin(a) * r1, z]);
  arr.push([ Math.cos(a) * r2, Math.sin(a) * r2, z]);
  arr.push([ Math.cos(b) * r1, Math.sin(b) * r1, z]);
  arr.push([ Math.cos(b) * r2, Math.sin(b) * r2, z]);
  arr.push([ Math.cos(a) * r2, Math.sin(a) * r2, z]);
  arr.push([ Math.cos(b) * r1, Math.sin(b) * r1, z]);
  return arr;
}

function donutVerticiesDup(n, ratio, z, arr = []) {
  const r1 = 0.5;
  const r2 = r1 * ratio;
  const l = 2 * Math.PI;
  const inc = l / n;

  for (let i = inc; i < l; i += inc) {
    rect(i - inc, i, r1, r2, z, arr);
  }
  rect(0, l - inc, r1, r2, z, arr);

  return arr;
}

function donutSidesDup(n, r, arr) {
  const l = 2 * Math.PI;
  const inc = l / n;

  for (let i = inc; i < l; i += inc) {
    const a = i - inc;
    const b = i;
    arr.push([ Math.cos(a) * r, Math.sin(a) * r, -0.5 ]);
    arr.push([ Math.cos(a) * r, Math.sin(a) * r, +0.5 ]);
    arr.push([ Math.cos(b) * r, Math.sin(b) * r, +0.5 ]);

    arr.push([ Math.cos(b) * r, Math.sin(b) * r, +0.5 ]);
    arr.push([ Math.cos(b) * r, Math.sin(b) * r, -0.5 ]);
    arr.push([ Math.cos(a) * r, Math.sin(a) * r, -0.5 ]);
  }

  const a = l - inc;
  const b = 0;
  arr.push([ Math.cos(a) * r, Math.sin(a) * r, -0.5 ]);
  arr.push([ Math.cos(a) * r, Math.sin(a) * r, +0.5 ]);
  arr.push([ Math.cos(b) * r, Math.sin(b) * r, +0.5 ]);

  arr.push([ Math.cos(b) * r, Math.sin(b) * r, +0.5 ]);
  arr.push([ Math.cos(b) * r, Math.sin(b) * r, -0.5 ]);
  arr.push([ Math.cos(a) * r, Math.sin(a) * r, -0.5 ]);

  return r;
}

const cache = new Map();
function toKey(n, ratio) { return `${n}|${ratio}`; }

function donutVerticies3dDup(n, ratio) {
  const key = toKey(n, ratio);
  if (cache.has(key)) {
    return cache.get(key);
  }

  const arr = [];
  const r1 = 0.5;
  const r2 = r1 * ratio;
  const l = 2 * Math.PI;
  const inc = l / n;
  let size = 0;

  donutVerticiesDup(n, ratio, -0.5, arr);
  size = arr.length;
  donutVerticiesDup(n, ratio, +0.5, arr);
  size = arr.length;

  // (n + 1) * 6 * 2
  // (n + 1) * 6 * 2

  // sides
  donutSidesDup(n, r2, arr);
  size = arr.length;
  donutSidesDup(n, r1, arr);
  size = arr.length;

  cache.set(key, arr);
  return arr;
}

function donutElements3d(n) {
  const arr = [];
  const l = 2 * Math.PI;

  // bottom
  for (let i = 2; i < 2 * n; i++) {
    arr.push([i - 2, i - 1, i ]);
  }

  arr.push([2 * n - 2, 2 * n - 1, 0 ]);
  arr.push([ 0, 1, 2 * n - 1 ]);

  // top
  for (let i = 2 * n + 2; i < 4 * n; i++) {
    arr.push([i - 2, i - 1, i ]);
  }

  arr.push([ 4 * n - 2, 4 * n - 1, 2 * n ]);
  arr.push([ 2 * n, 2 * n + 1, 4 * n - 1 ]);

  // sides
  for (let i = 0; i < 2 * n + 3; i += 2) {
    const d = 2 * n;
    const first = (i + 3) % (2 * n);
    const second = (i + 1) % (2 * n);
    arr.push([ first, second, first + d ]);
    arr.push([ first + d, second + d, second ]);
  }

  for (let i = 1; i < 2 * n + 3; i += 2) {
    const d = 2 * n;
    const first = (i + 3) % (2 * n);
    const second = (i + 1) % (2 * n);
    arr.push([ first, second, first + d ]);
    arr.push([ first + d, second + d, second ]);
  }

  return arr;
}

function circleVerticies(n) {
  const arr = [ [0, 0, 0], ];
  const r = 0.5;
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 0; i < l; i += inc) {
    arr.push([ Math.cos(i) * r, Math.sin(i) * r, 0.0]);
  }
  return arr;
}

function circleElements(n) {
  const arr = [];
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 2; i < n + 1; i++) {
    arr.push([i - 1, 0, i]);
  }
  arr.push([ 0, 1, n ]);
  return arr;
}


// const paletteAll = random.shuffle(
//   palettes[random.rangeFloor(0, palettes.length)]
// );

const paletteAll = random.shuffle(
  [ '#161616', '#424242', ],
);
const paletteMapped = ['#ffffff', ...paletteAll].map(hex => (
  [...Color.parse(hex).rgb.map(c => c / 255.0), 1]
));
const bgColor = '#fffff';
const palette = paletteMapped.slice(1);


function inRange(n, offset, count) {
  return n >= offset && n < offset + count;
}

const colorCache = new Map();
function calculateColor(nVerticies, palette) {
  const key = String(nVerticies) + '|' + palette.join('|');
  if (colorCache.has(key)) {
    return colorCache.get(key);
  }

  const arr = [];
  const basis = nVerticies % 6 === 0 ? (nVerticies + 1): nVerticies;
  const count = 4 * 6 * basis;
  const topSideOffset = 0;
  const topSideCount = 6 * basis;
  const bottomSideOffset = topSideOffset + topSideCount;
  const bottomSideCount = 6 * basis;
  const innerSidesOffset = bottomSideOffset + bottomSideCount;
  const innerSidesCount = 6 * basis;
  const outerSidesOffset = innerSidesOffset + innerSidesCount;
  const outerSidesCount = 6 * basis;

  for (let i = 0; i < count; i++) {

    if (inRange(i, topSideOffset, topSideCount)) {
      arr.push(palette[0]);
      continue;
    }

    if (inRange(i, bottomSideOffset, bottomSideCount)) {
      arr.push(palette[0 % palette.length]);
      continue;
    }

    if (inRange(i, innerSidesOffset, innerSidesCount)) {
      arr.push(palette[0 % palette.length]);
      continue;
    }

    if (inRange(i, outerSidesOffset, outerSidesCount / 2 + 1)) {
      arr.push(palette[1 % palette.length]);
    }

    if (inRange(i, outerSidesOffset + outerSidesCount / 2, outerSidesCount / 2)) {
      arr.push(palette[2 % palette.length]);
    }
  }

  colorCache.set(key, arr);
  return arr;
}

const modelProjectionCache = new Map();
function calculateModelProjection(context, opts) {
  const key = JSON.stringify(opts);
  if (modelProjectionCache.has(key)) {
    return modelProjectionCache.get(key);
  }

  const {
    scale,
    rotateRad,
    rotateAxis,
    translate,
  } = opts;

  const model = mat4.identity([]);
  mat4.rotate(model, model, rotateRad, rotateAxis);
  mat4.scale(model, model, scale);
  mat4.translate(model, model, translate);

  modelProjectionCache.set(key, model);
  return model;
}

const viewProjectionCache = new Map();
function calculateViewProjection(context, { time }) {
  const roundTo = 50;
  const timeRounded = Math.round(time * roundTo) / roundTo;
  if (viewProjectionCache.has(timeRounded)) {
    return viewProjectionCache.get(timeRounded);
  }

  let rad = 10 * Math.PI * timeRounded;

  if (rad > 0.5 * Math.PI && rad < 2.5 * Math.PI) {
    rad = 0.5 * Math.PI;
  }

  if (rad > 3 * Math.PI && rad < 5 * Math.PI) {
    rad = 3 * Math.PI;
  }

  if (rad > 5.5 * Math.PI && rad < 7.5 * Math.PI) {
    rad = 5.5 * Math.PI;
  }

  if (rad > 8 * Math.PI && rad < 10 * Math.PI) {
    rad = 8 * Math.PI;
  }

  const view =  mat4.lookAt(
    [],
    [
      20 * Math.sin(rad),
      0,
      20 * Math.cos(rad),
    ], // eye
    [0, 0.0, 0], // target
    [0, 1, 0]
  );

  viewProjectionCache.set(timeRounded, view);
  return view;
}

function generateWorld() {
  const world = [];
  let y = -3;
  for (let i = 0; i < random.rangeFloor(1, 32); i++) {
    const scaleX = random.range(0.5, 12);
    const scaleY = scaleX;
    // const scale = 3;
    const rotate = random.rangeFloor(2);
    const range = random.rangeFloor(10);
    const yInc = random.range(0, 1);
    const p = random.shuffle(palette);
    const shape = ({
      nVerticies: range > 3 ? random.rangeFloor(3, 6) : 101,
      radiusRatio: rotate ? 0.0 : random.range(0.1, 0.8),
      scale: [scaleX, scaleY, random.range(3, 25)],
      rotateRad: rotate * Math.PI / 2,
      rotateAxis: [ 1, 1, 0 ],
      translate: [
        0,
        y + yInc,
        0,
      ],
      palette: rotate ? p.slice(0, 1) : random.shuffle(p),
    });

    world.push(shape);
    y = y + yInc + scaleY * 0.5;
  }

  console.log('world', world.length);
  return world;
}

const world = generateWorld();

const sketch = ({ gl, viewportWidth, viewportHeight }) => {
  const regl = createRegl({ gl });
  // Setup REGL with our canvas context

  // const projection = mat4.perspectiveFromFieldOfView(
  //   [],
  //   Math.PI / 2,
  //   regl.context('viewportWidth') / regl.context('viewportHeight'),
  //   0.01,
  //   1000.0
  // );

  // const projection = mat4.perspectiveFromFieldOfView(
  //   [],
  //   {
  //     upDegrees: Math.PI / 59,
  //     downDegrees: Math.PI / 59,
  //     leftDegrees: Math.PI / 20,
  //     rightDegrees: Math.PI / 20,
  //   },
  //   0.01,
  //   1000.0
  // );


  const ratio = viewportWidth / viewportHeight;
  const drawShape = regl({
    vert: `
    precision mediump float;
    uniform mat4 projection, view, model;
    attribute vec3 aPosition;
    attribute vec4 aColor;

    varying vec3 vPos;
    varying vec4 vColor;

    void main() {
      vPos = aPosition;
      vColor = aColor;
      gl_Position = projection * view * model * vec4(aPosition, 1);
      // gl_Position = model * vec4(aPosition, 1);
      // gl_Position = vec4(aPosition, 1);
    }
    `,
    frag: glsl(`
    precision mediump float;

    // uniform vec4 mainColor;

    varying vec3 vPos;
    varying vec4 vColor;

    void main() {
      gl_FragColor = vColor;
      // gl_FragColor = mainColor;
      // gl_FragColor = vec4(vPos, 1.0);
    }
    `),
    attributes: {
      aPosition: (context, { radiusRatio, nVerticies, }) => {
        return donutVerticies3dDup(nVerticies, radiusRatio);
      },
      aColor: (context, { nVerticies, palette }) => calculateColor(nVerticies, palette),
    },
    primitive: 'triangles',
    count: (context, { nVerticies, radiusRatio }) => {
      return (
        4 * 6 * ((nVerticies % 6 === 0) ?
          (nVerticies + 1) :
          nVerticies
        )
      );
    },
    uniforms: {
      scale: regl.prop('scale'),
      time: regl.prop('time'),
      view: calculateViewProjection,
      projection: (
        mat4.ortho(
          [],
          -20 * ratio, 20 * ratio,
          -20, 20,
          0.0001,
          2000.0
        )
        // mat4.perspective(
        //   [],
        //   Math.PI / 4,
        //   viewportWidth / viewportHeight,
        //   0.01,
        //   100
        // )
      ),
      model: calculateModelProjection,
    },
  });

  // Regl GL draw commands
  // ...

  // Return the renderer function
  return {
    render ({ playhead }) {
      // let t = Math.floor(playhead * 200) / 5;
      // const delay = 0.5;
      // let t = playhead > delay ? (playhead - delay) / delay : 0;
      // t = 0.25;

      let t = playhead;

      // Update regl sizes
      regl.poll();

      // Clear back buffer
      regl.clear({
        color: bgColor,
      });

      drawShape(world.map(shape => ({
        ...shape,
        time: t,
      })));
    },
    unload () {
      // Unload sketch for hot reloading
      regl.destroy();
    }
  }
};

canvasSketch(sketch, settings);
