const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

random.setSeed(random.getRandomSeed());

const settings = {
  dimensions: 'A3',
  pixelsPerInch: 300,
  suffix: random.getSeed(),
};

const numbers = [
  1, 13, 2, 3, 4, 15,
  20, 21, 24, 5, 6, 8,
  11, 14, 18, 23, 7,
  9, 10, 19,
];

const atleticoPalettes = {
  main: [
    '#272E61',
    '#CB3524',
    '#FFFFFF',
  ],
  onMain: [
    '#FFFFFF',
  ],
  number1: [
    'rgb(250, 220, 110)',
    'rgb(80, 147, 107)',
    'rgb(42,42,37)',
  ],
  number13: [
    'rgb(40,40,40)',
    'rgb(250, 220, 110)',
    'rgb(255, 140, 170)',
  ],
};

function withClip({ context, x, y, width, height }, f) {
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  f();
  context.restore();
}

function createMainGrid() {
  const players = 20;
  const grid = [];
  const cols = 4;
  const rows = 5;
  for (let i = 0; i < players; i++) {
    const row = Math.floor(i / cols);
    grid.push({
      x: (i - row * cols) / cols,
      y: row / rows,
      width: 1 / cols,
      height: 1 / rows,
    });
  }
  return grid;
}


/*

<svg width="98px" height="302px" viewBox="0 0 98 302" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" fill-opacity="0.88">
        <g id="Square-logo" fill="#000000">
            <polygon id="1" points="52.1484375 42.578125 0 42.578125 25 0 97.65625 0 97.65625 301.5625 52.1484375 301.5625"></polygon>
        </g>
    </g>
</svg>
*/

const numberPaths = [
  [],
  [
    [ 0.5321269133, 0.1409871689, ],
    [ 0,            0.1409871689, ],
    [ 0.2551020408, 0, ],
    [ 0.9964923469, 0, ],
    [ 0.9964923469, 0.9985513245, ],
    [ 0.5321269133, 0.9985513245, ],
  ],
];

const createGrid = ({cols, rows, i, }) => {
  const points = [];

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const u = c / (cols - 1);
      const v = r / (rows - 1);
      const noise = 0.5 + 0.5 * random.noise3D(0.01 * u, 0.01 * v, i);
      points.push({
        position: [ u, v ],
        sizeX: noise,
        sizeY: 2 * noise,
        rotation: noise * random.value(),
        color: noise,
        skip: false, //noise > 0.6,
      });
    }
  }

  return points;
};

function sketchNumber({ i, context, x, y, width, height, number }) {
  context.save();
  context.translate(x, y);
  const palette = atleticoPalettes.main;
  const mainColorIndex = random.rangeFloor(0, palette.length);
  const mainColor = palette[mainColorIndex];
  const otherColors = random.shuffle(
    palette.filter((c, index) => (index + 1) !== mainColorIndex)
  );
  context.fillStyle = mainColor;
  context.fillRect(
    0, 0,
    width,
    height,
  );
  context.restore();

  const aspect = 0.3245033113;
  const marginX = 0.0 * width;
  const marginY = 0.0 * height;

  const points = numberPaths[1];
  const [startU, startV] = points;
  const startX = marginX + startU * width * aspect;
  const startY = marginY + startV * height;
  const numberHeight = height;
  const numberWidth = numberHeight * aspect;
  context.save();
  context.beginPath();
  context.moveTo(startX * numberWidth, startY * numberHeight);
  for (let i = 0; i < points.length; i++) {
    const [u, v] = points[i];
    const x = marginX + u * numberWidth;
    const y = v * height;
    context.lineTo(x, y);
  }
  context.lineTo(startU * numberWidth, startV * numberHeight);
  context.closePath();
  // context.strokeStyle = 'white';
  // context.lineWidth = 10;
  // context.stroke()
  // context.fillStyle = otherColors[0];
  // context.fill();
  // context.clip();

  const gridMult = 30;
  const gridPoints = createGrid({
    cols: gridMult,
    rows: gridMult * height / width,
    i,
  });

  for (let p of gridPoints) {
    if (p.skip) {
      continue;
    }

    const [u, v] = p.position;
    const { sizeX, sizeY, rotation, color, } = p;
    const pX = lerp(0, numberWidth, u);
    const pY = lerp(0, numberHeight / 2, v);
    context.fillStyle = otherColors[(color * 10) % otherColors.length];
    // context.save();
    // context.font = `${sizeY * 0.5 * numberHeight}px Arial`;
    // const symbol = '‹›';
    // context.translate(x, y);
    // context.rotate(sizeX * Math.PI);
    // context.fillText(symbol, 0, 0);
    // context.restore();

    context.save();
    context.translate(pX, pY);
    context.rotate(rotation * 2 * Math.PI);
    context.fillRect(
      pX,
      pY,
      0.02 * sizeX * numberWidth,
      0.025 * sizeY * numberHeight
    );
    context.restore();


    // context.beginPath();
    // context.arc(x, y, sizeX * 0.3 * numberWidth, 0, Math.PI * 2);
    // context.fill();
  }
  context.restore();
}

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);


    const nums = random.shuffle([...numbers]);
    let i = 0;
    for (let rect of createMainGrid()) {
      sketchNumber({
        i: i++,
        context,
        x: rect.x * width,
        y: rect.y * height,
        width: rect.width * width,
        height: rect.height * height,
        number: nums.pop(),
      });
    }
    // context.restore();
  };
};

canvasSketch(sketch, settings);
