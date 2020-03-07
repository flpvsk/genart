const canvasSketch = require('canvas-sketch');
const { lerp, wrap } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

let seed = random.getRandomSeed();
console.log('seed', seed);
random.setSeed(seed);

const settings = {
  dimensions: [ 1024 * 0.5, 1024 * 0.5 ],
  duration: 4,
  animate: true,
};

function createPoints(n) {
  let nextX = 0;
  const incX = 1 / n;
  const points = [];

  while (n >= 0) {
    // const y = 0.25 + 0.5 * random.value();
    const y = random.gaussian(0.5, 0.1);
    points.push([ nextX, y ]);
    nextX = nextX + incX;
    n--;
  }

  return points;
}

const sketch = () => {
  const playheadFraction = 0.05;
  const points = createPoints(1 / playheadFraction);
  return ({ context, width, height, playhead }) => {
    const c = context;
    c.fillStyle = 'white';
    c.fillRect(0, 0, width, height);

    const radius = width * 0.004;

    function toX(u) {
      return lerp(32, width - 32, u);
    }
    function toY(v) {
      return lerp(0, height, v);
    }

    const stage = Math.round(
      3 * playhead /
      playheadFraction
    );

    const pointsCount = Math.min(
      stage,
      points.length
    );

    if (stage > points.length) {
      c.beginPath();
      for (let i = 0; i < stage - points.length; i++) {
        if (i >= points.length) {
          break;
        }

        const point = points[i];
        if (i === 0) {
          c.moveTo(toX(point[0]), toY(point[1]));
          continue;
        }

        c.lineTo(toX(point[0]), toY(point[1]));
      }
      c.stroke();
    }

    for (let i = 0; i < pointsCount; i++) {
      const point = points[i];
      c.beginPath();
      c.arc(
        toX(point[0]),
        toY(point[1]),
        radius,
        0, Math.PI * 2
      );
      c.closePath();
      c.stroke();
      c.fillStyle = 'white';
      c.fill();
    }

  };
};

canvasSketch(sketch, settings);
