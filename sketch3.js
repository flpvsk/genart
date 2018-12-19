const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const load = require('load-asset');

random.setSeed('1');

const settings = {
  dimensions: [ 600, 600 ],
  animate: true,
  duration: 4,
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

const loadAndSketch = async ({ context, width, height }) => {
  const image = await load('assets/code.png');
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  const videoElement = document.createElement('video');
  videoElement.width = width;
  videoElement.height = height;
  videoElement.srcObject = mediaStream;
  videoElement.play();



  const moveInc = width;

  context.drawImage(image, 0, 0, width, height);

  const cols = new Set();
  for (let i = 0; i < width + moveInc; i++) {
    if (Math.abs(random.noise1D(i * 100)) < 0.98) {
      cols.add(i);
    }
  }

  const glitches = {};
  for (let col of cols) {
    glitches[col] = {
      col,
      a: Math.floor(
        Math.abs(4 * random.noise1D(col))
      ),
      b: Math.floor(
        Math.abs(100 * random.noise1D(col))
      ),
      alpha: Math.floor(random.noise1D(col) * 255),
    };
  }

  const grayCoef = 0.4;
  const saturationCoef = 0.1;

  return {
    resize({ width, height }) {},
    render({ playhead, time }) {
      if (playhead) {
        time = playhead;
      }
      const original = getImageData(videoElement);
      const pixels = context.createImageData(original);

      let i = 0;

      context.clearRect(0, 0, width, height);
      while (i < pixels.data.length) {

        const pixelNum = i / 4;
        const row = Math.floor(pixelNum / pixels.width);
        const col = pixelNum - row * pixels.width;


        const moveX = Math.abs(Math.floor(
          //Math.sin(playhead * 2 * Math.PI) *
          time *
          moveInc
         ));

        if (cols.has(col + moveX)) {
          const glitch = glitches[col + moveX];
          const r = glitch.a * row + glitch.b;
          const c = (
            0.2989 * getR(original, col, r) +
            0.5870 * getG(original, col, r) +
            0.1140 * getB(original, col, r)
          ) * grayCoef;
          pixels.data[i + 0] = c;
          pixels.data[i + 1] = c;
          pixels.data[i + 2] = c;
          pixels.data[i + 3] = 255;
        }

        if (!cols.has(col + moveX)) {
          const r = getR(original, col, height / 2);
          const g = getG(original, col, height / 2);
          const b = getB(original, col, height / 2);
          const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;

          pixels.data[i + 0] = (
            r * (1 + saturationCoef) -
            gray * saturationCoef
          );
          pixels.data[i + 1] = (
            g * (1 + saturationCoef) -
            gray * saturationCoef
          );
          pixels.data[i + 2] = (
            b * (1 + saturationCoef) -
            gray * saturationCoef
          );
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
