const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const palettes = require('nice-color-palettes');

// const seed = random.getRandomSeed();
const seed = '757361';
random.setSeed(seed);
console.log('seed', seed);

// 827014
// 507712
// 757361
// 759231

const encoder = new TextEncoder();

const encode = (text) => encoder.encode(text);

const settings = {
  dimensions: [ 512, 512 ],
  animate: true,
  duration: 2,
  fps: 2,
};

const createGrid = (countX, countY) => {
  const rects = [];
  const maxX = (countX - 1);
  const maxY = (countY - 1);
  const uSize = 1 / countX;
  const vSize = 1 / countY;
  for (let y = 0; y < countY; y++) {
    for (let x = 0; x < countX; x++) {
      const u = x / countX;
      const v = y / countY;
      rects.push({
        u,
        v,
        uSize,
        vSize,
        uBorder: uSize / 4,
      });
    }
  }

  return rects;
};

const sketchTextOrBytes = ({
  sourceText,
  sourceBytes,
  xMin,
  yMin,
  width,
  height,
  zeroColor,
  oneColor,
  backgroundColor,
  context,
}) => {
  let sourceBin;

  if (sourceText) {
    const sourceDec = parseInt(sourceText, 10);

    if (!Number.isNaN(sourceDec) && sourceDec !== null) {
      sourceBin = sourceDec.toString(2);
    } else {
      sourceBytes = encode(sourceText);
    }
  }

  if (sourceBytes) {
    sourceBin = sourceBytes
      .reduce((a, b) => a += b.toString(2), '');
  }

  if (!sourceBin) {
    throw new Error('no binary data');
  }

  const xMax = xMin + width;
  const yMax = yMin + height;

  context.fillStyle = backgroundColor;
  context.fillRect(xMin, yMin, width, height);

  let sourceGridSize = Math.sqrt(sourceBin.length);

  if (sourceGridSize !== Math.floor(sourceGridSize)) {
    let newSourceGridSize = Math.floor(sourceGridSize) + 1;
    sourceGridSize = newSourceGridSize;
  }

  const sourceGrid = createGrid(sourceGridSize, sourceGridSize);
  const sourceBinPadded = sourceBin.padStart(
    Math.pow(sourceGridSize, 2), '0'
  );

  for (let i = 0; i < sourceBinPadded.length; i++) {
    let color = zeroColor;

    if (sourceBinPadded[i] === '1') {
      color = oneColor;
    }

    const { u, v, uSize, vSize, uBorder, } = sourceGrid[i];
    const x = Math.floor(lerp(xMin, xMax, u));
    const y = Math.floor(lerp(yMin, yMax, v));
    const w = Math.ceil(lerp(0, xMax - xMin, uSize));
    const h = Math.ceil(lerp(0, yMax - yMin, vSize));
    const border = 4;
    context.beginPath();
    context.fillStyle = color;
    context.rect(x, y, w, h);
    context.fill();

    if (border > 0) {
      context.strokeStyle = backgroundColor;
      context.lineWidth = border;
      context.stroke();
    }
  }
};

const sketch = async ({ width, height, }) => {
  const palette = random.pick(palettes);
  // const zeroColor = 'hsla(0, 0%, 100%, 20%)';
  // const oneColor = 'hsl(100, 40%, 50%)';
  // const backgroundColor = 'hsl(0, 0%, 20%)';
  // const mainBackground = backgroundColor;


  const zeroColor = palette[1];
  const oneColor = palette[2];
  const backgroundColor = palette[0];
  const mainBackground = palette[0];

  const pairs = [];
  // const sources = [
  //   '1', '2', '3', '4', '5',
  //   '33', '34', '35', '36',
  //   '65', '66', '67', '68',
  //   '1025', '1026', '1027', '1028',
  // ];

  const sources = [
    'twitter',
    'glitter',
  ];
  const leftLegend = 'binary';
  const rightLegend = 'sha-256';

  for (let sourceText of sources) {
    const sha1Digest = await crypto.subtle.digest(
      'sha-256',
      encode(sourceText)
    );

    pairs.push({ sourceText, sha1Digest });
  }

  const hMargin = Math.floor(0.05 * width);
  const vMargin = Math.floor(0.55 * height);
  const textVMargin = Math.floor(0.28 * height);
  const legendVMargin = Math.floor(0.5 * height);
  const size = Math.floor(width / 2 - 2 * hMargin);

  return {
    render: ({ context, width, height, playhead, }) => {
      const pairIndex = Math.floor(playhead * pairs.length);
      const { sourceText, sha1Digest } = pairs[pairIndex];

      context.fillStyle = mainBackground;
      context.fillRect(0, 0, width, height);

      context.fillStyle = oneColor;
      context.font = `${height * 0.1}px Fira Code`;
      const textMetrics = context.measureText(sourceText);
      context.fillText(
        sourceText,
        (width - textMetrics.width) / 2,
        textVMargin
      );

      context.fillStyle = zeroColor;
      context.font = `${height * 0.08}px Futura`;
      const leftMetrics = context.measureText(leftLegend);
      const rightMetrics = context.measureText(rightLegend);
      context.fillText(
        leftLegend,
        (width / 2 - leftMetrics.width) / 2,
        legendVMargin
      );
      context.fillText(
        rightLegend,
        width / 2 + (width / 2 - rightMetrics.width) / 2,
        legendVMargin
      );


      sketchTextOrBytes({
        context,
        sourceText,
        zeroColor,
        oneColor,
        backgroundColor,
        xMin: hMargin,
        yMin: vMargin,
        width: size,
        height: size,
      });

      sketchTextOrBytes({
        context,
        sourceBytes: new Uint8Array(sha1Digest),
        zeroColor,
        oneColor,
        backgroundColor,
        xMin: Math.ceil(width / 2 + hMargin),
        yMin: vMargin,
        width: size,
        height: size,
      });
    }
  };
};

canvasSketch(sketch, settings);
