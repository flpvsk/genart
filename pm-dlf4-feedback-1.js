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
  wave: 'hsl(0, 0, 10%)',
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

    c.beginPath();
    c.arc(
      marginX + sourceRadius,
      height * 0.5,
      sourceRadius,
      0, Math.PI * 2
    );
    c.fillStyle = C.source;
    c.fill();

    createShape(
      c,
      3,
      shapePosX - shapeSize,
      shapePosX + shapeSize,
      shapePosY - shapeSize,
      shapePosY + shapeSize,
    );
    c.fillStyle = 'red';
    c.fill();

  };
};

canvasSketch(sketch, settings);
