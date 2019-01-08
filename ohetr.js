const canvasSketch = require('canvas-sketch');
const load = require('load-asset');

const settings = {
  dimensions: [ 3000, 3000 ]
};

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
  const [ image1, image2, ] = await Promise.all([
    load('assets/code.png'),
    load('assets/code1.png')
  ]);
  const original1 = getImageData(image1);
  const original2 = getImageData(image2);

  return {
    render: ({ context, width, height }) => {
      context.fillStyle = 'white';
      context.fillRect(0, 0, width, height);

      const pixels = context.createImageData(original1);

      let i = 0;
      while (i < pixels.data.length) {
        pixels.data[i + 0] = original1.data[i + 0];
        pixels.data[i + 1] = original1.data[i + 1];
        pixels.data[i + 2] = original1.data[i + 2];
        pixels.data[i + 3] = original1.data[i + 3];
        i = i + 4;
      }

      context.putImageData(pixels, 0, 0);
    },
  };
};

canvasSketch(loadAndSketch, settings);
