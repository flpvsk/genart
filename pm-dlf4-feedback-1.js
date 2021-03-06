import haltonSeq from './haltonSequence';
import canvasSketch from 'canvas-sketch';
import { lerp, wrap, clamp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';
import load from 'load-asset';

const settings = {
  dimensions: [ 1280, 128 ],
  // dimensions: [ 608, 1080, ],
  // dimensions: [ 1200, 628 ],
  animate: true,
  duration: 3,
};

let seed = random.getRandomSeed();
console.log('seed', seed);
random.setSeed(seed);

const C = {
  source: 'hsl(70, 80%, 80%)',
  wave: 'hsl(0, 0%, 20%)',
  waves: [
    'hsla(10, 40%, 10%, 0.4)',
    'hsla(120, 80%, 30%, 0.4)',
    'hsla(180, 40%, 40%, 0.4)',
  ],
};

function createShape(c, nSides, minX, maxX, minY, maxY) {
  const centerX = minX + (maxX - minX) / 2;
  const centerY = minY + (maxY - minY) / 2;
  const radius = Math.min(
    (maxX - minX) / 2,
    (maxY - minY) / 2
  );

  c.beginPath();
  for (let i = 0; i < nSides; i++) {
    const angle = 3 * Math.PI / 2  + 2 * Math.PI * i / nSides;
    let x = centerX + radius * Math.cos(angle);
    let y = centerY + radius * Math.sin(angle);

    if (i === 0) {
      c.moveTo(x, y);
      continue;
    }

    c.lineTo(x, y);
  }
  c.closePath();
}


function createWave(nPoints, pos, seed) {
  const points  = [];
  let firstY = 0.5;
  for (let i = 0; i < nPoints; i++) {
    let y = random.noise3D(i, pos, seed) / 2 + 0.5;

    y = Math.max(Math.min(y, 0.9), 0.1);

    if (i === 0) {
      firstY = y;
    }

    if (i === nPoints - 1) {
      y = firstY;
    }

    const p = [ i / (nPoints - 1), y ]
    points.push(p);
  }
  return points;
}

function uWrapOffset(arr, offset) {
  return arr.map(([u, v], i) => {
    const uWrapped = wrap(u + offset, 0, 1);
    return [ uWrapped, v ];
  }).sort(([x1], [x2]) => x1 - x2);
}

const sketch = async ({ width, height }) => {

  return ({ context, width, height, playhead, time }) => {
    const c = context;

    c.fillStyle = 'white';
    c.fillRect(0, 0, width, height);

    const sourceRadius = height * 0.3;
    const marginX = width * 0.01;

    const shapeSize = height * 0.1;
    const shapePosX = marginX + (width - marginX) * playhead;
    const shapePosY = height * 0.5;

    // c.beginPath();
    // c.arc(
    //   marginX + sourceRadius,
    //   height * 0.5,
    //   sourceRadius,
    //   0, Math.PI * 2
    // );
    // c.strokeStyle = 'none';
    // c.fillStyle = C.source;
    // c.fill();

    const waveMinX = marginX;
    const waveMaxX = width - marginX;
    const waveMinY = 0;
    const waveMaxY = height;


    const wave1 = createWave(40, 1, 0);
    const wave2 = createWave(60, 2, 0);
    const amplitude = 1.0;
    const offset = Math.floor(20 * playhead) / 20 + 0.01;

    const wave1Wrapped1 = uWrapOffset(wave1, 3.1 * offset);
    const wave1Wrapped2 = uWrapOffset(wave1, 2.0 * offset);
    const wave1Wrapped3 = uWrapOffset(wave1, 7.0 * offset);
    const wave2Wrapped1 = uWrapOffset(wave2, 1.0 * offset);

    const waves = [
      wave1Wrapped1,
      wave1Wrapped2,
      wave1Wrapped3,
      wave2Wrapped1,
    ];
    for (let i = 0; i < waves.length; i++) {
      const wave = waves[i];
      c.beginPath();
      for (let i = 0; i < wave.length; i++) {
        const [ u, v ] = wave[i];
        const x = lerp(0, width, u);
        const yCenter = 0.5 * height;
        const y = (
          lerp(-yCenter * amplitude , +yCenter * amplitude, v) +
          yCenter
        );

        if (i === 0) {
          c.moveTo(x, y);
          continue;
        }

        c.lineTo(x, y);
      }

      c.lineWidth = 0.03 * height;
      c.strokeStyle = C.waves[i];
      c.stroke();

      continue;
      for (let i = 0; i < wave.length; i++) {
        const [ u, v ] = wave[i];
        const x = lerp(0, width, u);
        const yCenter = 0.5 * height;
        const y = (
          lerp(-yCenter * amplitude , +yCenter * amplitude, v) +
          yCenter
        );
        c.beginPath();
        c.arc(x, y, 0.05 * height, 0, Math.PI * 2);
        c.fillStyle = C.waves[i];
        c.fill();
      }
    }
  };
};

canvasSketch(sketch, settings);
