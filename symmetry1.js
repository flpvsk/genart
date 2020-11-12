import haltonSeq from './haltonSequence';
import canvasSketch from 'canvas-sketch';
import { lerp, wrap, clamp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';
import load from 'load-asset';

import palettes from 'nice-color-palettes';

function getBaseLog(base, x) {
  return Math.log(x) / Math.log(base);
}

const settings = {
  dimensions: [ 1024, 1024 ],
  // dimensions: [ 608, 1080, ],
  // dimensions: [ 1200, 628 ],
  // animate: true,
  // duration: 15,
};

let seed = random.getRandomSeed();
console.log('seed', seed);
random.setSeed(seed);

function pointOnCircle([centerX, centerY], radius, angle) {
  return [
    centerX + Math.cos(angle) * radius,
    centerY + Math.sin(angle) * radius
  ];
}

const C1 = {
  guide0: 'hsla(80, 70%, 20%, 1)',
  guide1: 'hsla(55, 55%, 70%, 1)',
  guide2: 'hsla(30, 70%, 60%, 1)',
  guide3: 'hsla(30, 80%, 80%, 1)',
  guide4: 'hsla(100, 80%, 80%, 1)',
};

const C2 = {
  guide0: 'hsla(0, 0%, 20%, 1)',
  guide1: 'hsla(0, 0%, 20%, 1)',
  guide2: 'hsla(0, 0%, 20%, 1)',
  guide3: 'hsla(0, 0%, 20%, 1)',
  guide4: 'hsla(0, 0%, 20%, 1)',
};


const C = C1;



const sketch = async ({ context, width, height }) => {
  const c = context;
  const maxDimension = Math.max(width, height);
  const minDimension = Math.min(width, height);
  const marginX = 0.1 * maxDimension;
  const marginY = 0.1 * maxDimension;

  function lerpX(u) {
    return lerp(marginX, width - marginX, u);
  }

  function lerpY(v) {
    return lerp(marginY, height - marginY, v);
  }

  function lerpMin(val) {
    if (width <= height) {
      return lerpX(val);
    }

    return lerpY(val);
  }

  function lerpDim(val) {
    if (width < height) {
      return lerp(0, width - 2 * marginX, val);
    }

    return lerp(0, height - 2 * marginY, val);
  }

  const colorCount = 4;
  // const palette = random.shuffle(
  //   random.pick(palettes)
  // ).slice(1, colorCount);
  const palette = [
    `rgba(0,0,0,0)`,
    `rgba(1,1,1,1)`,
  ];


  const N = 1;
  const figures = [];
  for (let i = 0; i < N; i++) {
    const kind = random.pick(['arc']);
    if (kind === 'line') {
      figures.push([
        kind,
        random.value(),
        random.value(),
        random.value(),
        random.value(),
      ]);
    }

    if (kind === 'arc') {
      const startAngle = random.range(0, 2 * Math.PI);
      const endAngle = (
        startAngle + random.range(0, 2 * Math.PI - startAngle)
      );

      figures.push([
        kind,
        random.value(),
        random.value(),
        random.value(),
        startAngle,
        endAngle,
      ]);
    }
  }

  function drawFigure(c, figure, lX, lY, lD) {
    const kind = figure[0];
    if (kind === 'line') {
      const [ _, u1, v1, u2, v2 ] = figure;
      c.beginPath();
      c.moveTo(
        lX(u1),
        lY(v1),
      );
      c.lineTo(
        lX(u2),
        lY(v2),
      );
      c.strokeStyle = palette[1];
      c.lineWidth = lD(0.01);
      c.stroke();
    }

    if (kind === 'arc') {
      const [ _, u1, v1, r, start, end ] = figure;
      c.beginPath();
      c.arc(
        lX(u1),
        lY(v1),
        lD(r),
        start,
        end
      );
      c.strokeStyle = palette[1];
      c.lineWidth = lD(0.03);
      c.stroke();
    }
  }

  return ({ context, width, height, playhead, }) => {

    c.fillStyle = palette[0];
    c.fillRect(0, 0, width, height);

    const ROWS = 10;
    const COLS = 10;
    const SYMMETRY = 3;

    for (let j = 0; j < ROWS; j++) {
      for (let k = 0; k < COLS; k++) {
        const minX = lerpX(j / COLS);
        const maxX = lerpX((j + 1) / COLS);
        const minY = lerpY(k / ROWS);
        const maxY = lerpY((k + 1) / ROWS);

        function lX(x) {
          if (j % 2) {
            return lerp(minX, maxX, x);
          }
          return lerp(maxX, minX, x);
        }
        function lY(y) {
          if (k % 2) {
            return lerp(minY, maxY, y);
          }
          return lerp(maxY, minY, y);
        }
        function lD(v) {
          const width = maxX - minX;
          const height = maxY - minY;

          if (width < height) {
            return lerp(0, width, v);
          }

          return lerp(0, height, v);
        }

        for (let i = 0; i <= SYMMETRY; i++) {
          c.save();
          const angle = Math.PI * i / (SYMMETRY + 1);
          c.translate(
            lX(0.5),
            lY(0.5),
          );
          c.rotate(angle);
          c.translate(-lX(0.5), -lY(0.5));

          for (let figure of figures) {
            drawFigure(c, figure, lX, lY, lD);
          }

          c.restore();
        }

      }
    }


  };
};

canvasSketch(sketch, settings);
