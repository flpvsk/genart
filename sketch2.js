const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const load = require('load-asset');

random.setSeed('1');

const settings = {
  dimensions: [ 400, 400 ],
  animate: true,
  duration: 1,
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

const getR = (imgData, x, y) => getChannelData(imgData, x, y, 0);
const getG = (imgData, x, y) => getChannelData(imgData, x, y, 1);
const getB = (imgData, x, y) => getChannelData(imgData, x, y, 2);
const getA = (imgData, x, y) => getChannelData(imgData, x, y, 3);

const loadAndSketch = async ({ context, width, height }) => {
  const image = await load('assets/code.png');
  const moveInc = width;

  context.drawImage(image, 0, 0, width, height);

  const cols = new Set();
  for (let i = 0; i < width + moveInc; i++) {
    if (Math.abs(random.noise1D(i * 1000)) < 0.9) {
      cols.add(i);
    }
  }

  const original = context.getImageData(0, 0, width, height);
  const glitches = {};
  for (let col of cols) {
    glitches[col] = {
      col,
      a: Math.floor(
        Math.abs(4 * random.noise1D(col))
      ),
      b: Math.floor(
        Math.abs(2 * random.noise1D(col))
      ),
      alpha: Math.floor(random.noise1D(col) * 255),
    };
  }

  return {
    resize({ width, height }) {},
    render({ playhead }) {
      const pixels = context.createImageData(original);

      let i = 0;

      context.clearRect(0, 0, width, height);
      while (i < pixels.data.length) {

        const pixelNum = i / 4;
        const row = Math.floor(pixelNum / pixels.width);
        const col = pixelNum - row * pixels.width;


        const moveX = Math.abs(Math.floor(
          //Math.sin(playhead * 2 * Math.PI) *
          playhead *
          moveInc
         ));
        if (cols.has(col + moveX)) {
          const glitch = glitches[col + moveX];
          const r = glitch.a * row + glitch.b;
          pixels.data[i + 0] = getR(original, col, r);
          pixels.data[i + 1] = getG(original, col, r);
          pixels.data[i + 2] = getB(original, col, r);
          pixels.data[i + 3] = 255;
        }

        i = i + 4;
      }

      context.putImageData(pixels, 0, 0);
    },

    unload() {
    },
  };
};

canvasSketch(loadAndSketch, settings);
