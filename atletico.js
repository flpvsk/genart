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
    [0, 0, 100, 100],
    // [233, 43, 27, 100], //'#272E61',
    [6, 70, 47, 100], // '#CB3524',
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

const createGrid = ({cols, rows,}) => {
  const points = [];
  const palette = atleticoPalettes.main;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1);
      const v = r / (rows - 1);
      const noise = 0.5 + 0.5 * random.noise2D(u, 3 * v);
      const colorIndex = Math.floor(noise * 10) % palette.length;
      const color = [...palette[colorIndex]];
      const colorStr =
        `hsla(${color[0]},${color[1]}%,${color[2]}%,${color[3]}%)`;
      points.push({
        position: [ u, v ],
        sizeX: noise,
        sizeY: lerp(0.6, 1, noise),
        rotation: noise * random.value(),
        color: colorStr,
        skip: false, //noise > 0.6,
        symbol: 10 * noise,
      });
    }
  }

  return points;
};



const sketchNoise = ({ context, width, height, }) => {
  const palette = atleticoPalettes.main;

  const sizeMult = 0.12;
  const gridMult = 7;
  const marginX = 0.18 * width;
  const marginY = 0.0 * height;

  const gridPoints = createGrid({
    cols: gridMult,
    rows: gridMult * height / width,
  });

  const cols = 4;
  const rows = 5;
  const nums = random.shuffle([...numbers]);
  const text = 'Aúpa Atleti';
  const textFontSize = 0.08 * width;
  const textFont = `${textFontSize}px Futura`;

  context.font = textFont;
  const centerX = width / 2;
  const centerY = height / 2;
  const textMetrics = context.measureText(text);
  const left = (width - textMetrics.width) / 2
  const right = centerX + textMetrics.width / 2;
  const top = (height - textFontSize) / 2 + textFontSize / 2;
  const bottom = centerY + textFontSize / 2 + textFontSize / 2;
  const textBlock = {
    left: Math.floor(left),
    right: Math.ceil(right),
    top: Math.floor(top),
    bottom: Math.ceil(bottom),
  };

  for (let i = 0; i < gridPoints.length; i++) {
    const p = gridPoints[i];

    if (p.skip) {
      continue;
    }

    const [u, v] = p.position;
    const { sizeX, sizeY, rotation, color, symbol } = p;
    const pX = lerp(marginX, width - marginX, u);
    const pY = lerp(marginY, height - marginY, v);
    context.save();

    const symbols = [ '●', '|', '.',/* '◆' */ ];
    context.translate(pX, pY);

    if (
      pX < textBlock.left - 0.03 * width ||
      pX > textBlock.right + 0.03 * width ||
      // pY < textBlock.top - 0.031 * height ||
      // pY > textBlock.bottom - 0.052 * height ||
      pY < textBlock.top - 0.081 * height ||
      pY > textBlock.bottom - 0.002 * height ||
      random.value() > 0.9
    ) {
      context.fillStyle = color;
      context.font = `${sizeMult * sizeY * width}px Arial`;
      context.rotate(rotation * Math.PI);
      context.fillText(
        symbols[Math.floor(10 * symbol) % symbols.length],
        0,
        0
      );
    }

    context.restore();
  }

  const shadowUnit = 0.001 * height;
  const shadows = [
    { x: 3, y: 6, opacity: 100 },
  ];

  for (let shadow of shadows) {
    // context.fillStyle = `hsla(0,0%,10%,${shadow.opacity}%)`;
    // 6, 70, 47
    context.fillStyle = `hsla(6,70%,47%,${shadow.opacity}%)`;
    context.fillText(
      text,
      textBlock.left + shadow.x * shadowUnit,
      textBlock.top + shadow.y * shadowUnit,
    );
  }

  context.fillStyle = 'white';
  // context.fillStyle = '#272E61';
  context.font = textFont;
  context.fillText(text, textBlock.left, textBlock.top);

};

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = '#272E61';
    context.fillRect(0, 0, width, height);
    sketchNoise({context, width, height });
  };
};

canvasSketch(sketch, settings);
