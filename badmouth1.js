const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const load = require('load-asset');

random.setSeed('1');

const settings = {
  dimensions: [ Math.floor(1600 * 0.4), Math.floor(793 * 0.4) ],
  animate: true,
  duration: 2,
  fps: 24,
};


const createGrid = () => {
  const points = [];
  const count = 50;
  for (let x = 0; x < count; x++) {
    for (let y = 0; y < count; y++) {
      const u = x / (count - 1);
      const v = y / (count - 1);
      const size = 0.5 + 0.5 * random.noise2D(u, v, 0.01, 10);
      const colorIndex = Math.floor(size * palette.length);
      points.push({
        position: [ u, v ],
        size,
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


const loadAndSketch = async ({ context, width, height }) => {
  const image = await load('assets/band-2.jpg');
  const moveInc = width;

  context.drawImage(image, 0, 0, width, height);
  const imgData = context.getImageData(0, 0, width, height);

  return {
    resize({ width, height }) {},
    render({ playhead, time }) {
      const pixels = context.createImageData(
        imgData.width,
        imgData.height
      );
      pixels.data.set(imgData.data);
      arcRotation(pixels, {
        centerX: Math.round(width * .3),
        centerY: Math.round(height * .4),
        innerRadius: 0, //Math.round(height * 0.1),
        outerRadius: Math.round(height * 0.25),
        angle: playhead * 2 * Math.PI,
        origin: imgData
      });

      context.putImageData(pixels, 0, 0);
    },

    unload() {
    },
  };
};

canvasSketch(loadAndSketch, settings);
