const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const load = require('load-asset');
const p5 = require('p5');

const settings = {
  p5: true,
  dimensions: [ 200 * 16, 200 * 9],
  duration: 4,
  fps: 6,
  animate: false,
};

new p5();

function haltonSeq(index = 0, base) {
  let f = 1;
  let r = 0;

  while (index > 0) {
    f = f / base;
    r = r + f * (index % base);
    index = Math.floor(index / base);
  }

  return r;
}

const q = [
  0.1, 0.14,
  0.9, 0.1,
  0.9, 0.9,
  0.12, 0.92
];

const qBorder = [
  0.11, 0.15,
  0.89, 0.11,
  0.89, 0.89,
  0.13, 0.91
];

function pointInPolygon(poly, x, y) {
  const polyCorners = poly.length / 2;
  let i;
  let j = poly.length / 2 - 1;
  let oddNodes = false;

  for (i = 0; i < polyCorners; i++) {
    if (
      poly[i * 2 + 1] < y && poly[j * 2 + 1] >= y ||
      poly[j * 2 + 1] < y && poly[i * 2 + 1] >=y
    ) {
      if (
        poly[i * 2] +
        (
          (y - poly[i * 2 + 1]) /
          (poly[j * 2 + 1] - poly[i * 2 + 1]) *
          (poly[j * 2] - poly[i * 2])
        ) < x
      ) {
        oddNodes = !oddNodes;
      }
    }

    j = i;
  }

  return oddNodes;
}

const sketch = async () => {
  let grad;
  await new Promise((resolve, reject) => {
    grad = loadImage('assets/grad1.png', resolve, reject);
  });
  grad.loadPixels();

  return ({ context, width, height, playback }) => {
    stroke('black');
    strokeWeight(8);
    noFill();

    quad(
      q[0] * width, q[1] * height,
      q[2] * width, q[3]* height,
      q[4] * width, q[5] * height,
      q[6] * width, q[7] * height,
    );

    rectMode(CENTER)

    for (let i = 0; i < 10000 * 20 * 8; i++) {
      const x = haltonSeq(i, 2);
      const y = haltonSeq(i, 3);
      const deviation = random.gaussian(0, 0.5) - 0.5;
      if (pointInPolygon(q, x, y)) {
        const minMax = Math.min(
          Math.max(0, y + 0.21 * deviation),
          1
        );
        const imgX = Math.floor(minMax * (grad.width - 1));
        const imgIndex = imgX * 4;
        const r = grad.pixels[imgIndex + 0];
        const g = grad.pixels[imgIndex + 1];
        const b = grad.pixels[imgIndex + 2];
        const a = grad.pixels[imgIndex + 3];
        noStroke();
        fill(r, g, b, a);
        square(x * width, y * height, 4);
      }
    }
  };
};

canvasSketch(sketch, settings);
