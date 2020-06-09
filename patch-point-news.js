const canvasSketch = require('canvas-sketch');
const load = require('load-asset');
const getImageData = require('./getImageData').default;

const settings = {
  animate: true,
  duration: 10,
  dimensions: [ 1024, 2048 ]
};

const imgCanvas = document.createElement("canvas");

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
  const image1 = await load('assets/p-p-2.png');
  const original = getImageData(image1);

  return {
    render: ({ context, width, height, playhead }) => {
      context.fillStyle = 'white';
      context.fillRect(0, 0, width, height);

      const pixels = context.createImageData(original);

      let i = 0;
      while (i < pixels.data.length) {
        const pixelNum = i / 4;
        const row = Math.floor(pixelNum / pixels.width);
        const col = pixelNum - row * pixels.width;

        const move = Math.abs(Math.floor(
          (Math.floor(50 * playhead) / 50) *
          2048
         ));

        pixels.data[i + 0] = getR(original, col, row + move);
        pixels.data[i + 1] = getG(original, col, row + move);
        pixels.data[i + 2] = getB(original, col, row + move);
        pixels.data[i + 3] = 255;
        i = i + 4;
      }

      context.putImageData(pixels, 0, 0);
    },
  };
};

canvasSketch(loadAndSketch, settings);
