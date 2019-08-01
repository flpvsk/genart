const { lerp } = require('canvas-sketch-util/math');
const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const load = require('load-asset');

// random.setSeed('1');

const settings = {
  dimensions: [ Math.floor(1600 * 0.4), Math.floor(793 * 0.4) ],
  animate: true,
  duration: 2,
  fps: 24,
};

const modes = [
  // "normal",
  // "multiply",
  // "screen",
  // "overlay",
  // "darken",
  // "lighten",
  // "color-dodge",
  // "color-burn",
   "hard-light",
   "soft-light",
  // "difference",
  // "exclusion",
  // "hue",
  // "saturation",
  // "color",
  // "luminosity",
];

const shapes = [
  function triangle(context, { xStart, yStart, sizeX, sizeY, color, rotation }) {
    context.fillStyle =
      `rgb(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
    // context.fillRect(xStart, yStart, sizeX, sizeY);
    context.save();
    context.translate(xStart, yStart);
    context.rotate(rotation);
    context.beginPath();
    context.moveTo(0, sizeY);
    context.lineTo(Math.round(sizeX / 2), 0);
    context.lineTo(sizeX, sizeY);
    context.closePath()
    context.fill();
    context.restore();
  },

  function circle(context, {
    xStart,
    yStart,
    sizeX,
    sizeY,
    color,
    rotation
  }) {
    context.fillStyle =
      `rgb(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
    // context.fillRect(xStart, yStart, sizeX, sizeY);
    const centerX = Math.round(xStart + sizeX / 2);
    const centerY = Math.round(yStart + sizeY / 2);
    context.save();
    context.translate(centerX, centerY);
    context.rotate(rotation);
    context.beginPath();
    context.arc(0, 0, Math.min(sizeX / 2, sizeY / 2), 0, Math.PI * 2);
    context.closePath();
    context.fill();
    context.restore();
  },

  function rect(context, {
    xStart,
    yStart,
    sizeX,
    sizeY,
    color,
    rotation
  }) {
    context.fillStyle =
      `rgb(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
    context.save();
    context.translate(xStart, yStart);
    context.rotate(rotation);
    context.fillRect(xStart, yStart, sizeX, sizeY);
    context.restore();
  },
]

const createGrid = () => {
  const points = [];
  const count = 10;
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      const u = x / (count - 1);
      const v = y / (count - 1);
      const size = 2 * (0.5 + 0.5 * random.noise3D(u, v, 0.1));
      points.push({
        position: [ u, v ],
        size,
        shape: random.pick(shapes),
        mode: random.pick(modes),
        rotation: Math.PI * 2 * (0.5 + 0.5 * random.noise3D(u, v, 4))
      });
    }
  }

  return points;
};

const getChannelData = (imgData, x, y, c) => {
  if (x < 0) {
    x = imgData.width + x;
  }

  if (y < 0) {
    y = imgData.height + y;
  }

  const wrappedX = x % imgData.width;
  const wrappedY = y % imgData.height;
  return imgData.data[(wrappedX + wrappedY * imgData.width) * 4 + c];
};

const setChannelData = (imgData, x, y, c, v) => {
  if (x < 0) {
    x = imgData.width + x;
  }

  if (y < 0) {
    y = imgData.height + y;
  }

  const wrappedX = x % imgData.width;
  const wrappedY = y % imgData.height;
  imgData.data[(wrappedX + wrappedY * imgData.width) * 4 + c] = v;
};


const getR = (imgData, x, y) => getChannelData(imgData, x, y, 0);
const getG = (imgData, x, y) => getChannelData(imgData, x, y, 1);
const getB = (imgData, x, y) => getChannelData(imgData, x, y, 2);
const getA = (imgData, x, y) => getChannelData(imgData, x, y, 3);

const imgCanvas = document.createElement("canvas");
const getImageData = (img, scale = 1) => {
  let { width, height } = img;

  width = Math.floor(width * scale);
  height = Math.floor(height * scale);

  imgCanvas.width = width;
  imgCanvas.height = height;
  let ctx = imgCanvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
};

function arcRotation(pixels, {
  centerX,
  centerY,
  innerRadius,
  outerRadius,
  angle,
  origin,
}) {
  for (let phi = 0; phi >= -Math.PI * 2; phi -= 0.003) {
    for (let r = innerRadius; r <= outerRadius; r++) {
      const oldX = Math.floor(centerX + Math.cos(phi) * r);
      const oldY = Math.floor(centerY + Math.sin(phi) * r);

      const newX = Math.floor(centerX + Math.cos(phi + angle) * r);
      const newY = Math.floor(centerY + Math.sin(phi + angle) * r);

      for (let c = 0; c <= 3; c++) {
        const value = getChannelData(origin, oldX, oldY, c);
        setChannelData(pixels, newX, newY, c, value);
      }
    }
  }
}


const MARGIN_X = 100;
const MARGIN_Y = 40;

const loadAndSketch = async ({ context, width, height }) => {
  const image = await load('assets/band-2.jpg');
  const moveInc = width;

  context.drawImage(image, 0, 0, width, height);
  const imgData = context.getImageData(0, 0, width, height);
  const grid = createGrid();

  return {
    resize({ width, height }) {},
    render({ playhead, time }) {
      const pixels = context.createImageData(
        imgData.width,
        imgData.height
      );
      pixels.data.set(imgData.data);

      context.clearRect(0, 0, width, height);
      context.putImageData(pixels, 0, 0);


      for (let point of grid) {
        let [ u, v ] = point.position;
        const x = lerp(MARGIN_X, width - MARGIN_X, u);
        const y = lerp(MARGIN_Y, height - MARGIN_Y, v);
        const sizeX = lerp(0, 0.05 * width, point.size);
        const sizeY = lerp(0, 0.05 * height, point.size);
        const xStart = Math.floor(x - sizeX / 2);
        const yStart = Math.floor(y - sizeY / 2);
        let colors = [];
        for (let i = xStart; i < x + sizeX / 2; i++) {
          for (let j = yStart; j < y + sizeY / 2; j++) {
            colors.push([
              getR(imgData, i, j),
              getB(imgData, i, j),
              getG(imgData, i, j),
              getA(imgData, i, j),
            ]);
          }
        }
        const colorSum = colors.reduce((acc, c) => {
          for (let i = 0; i < acc.length; i++) {
            acc[i] += c[i];
          }
          return acc;
        }, [0, 0, 0, 0])

        if (colors.length === 0) {
          continue;
        }

        const colorAvg = [
          Math.round(colorSum[0] / colors.length),
          Math.round(colorSum[1] / colors.length),
          Math.round(colorSum[2] / colors.length),
          100, //1 - 2 * Math.sin(Math.PI * 2 * playhead)
        ];

        // context.globalCompositeOperation = point.mode;
        point.shape(context, {
          xStart,
          yStart,
          sizeX,
          sizeY,
          color: colorAvg,
          rotation: point.rotation * 2 * Math.PI,
        });
      }
      // context.putImageData(pixels, 0, 0);
    },

    unload() {
    },
  };
};

canvasSketch(loadAndSketch, settings);
