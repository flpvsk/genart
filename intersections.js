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

function clipOrRestore(c, p) {
  if (p > 0.5) {
    c.clip();
    c.save();
  }

  if (p <= 0.5) {
    c.restore();
  }
}


const PRECISION = 10 ** 10;

function round(v, precision) {
  return Math.round(v * precision) / precision;
}

function circleAngle(c, p) {
  return round(
    Math.atan2(p[1] - c[1], p[0] - c[0]),
    PRECISION
  );
}


function circleIntersect(p1, r1, p2, r2) {
  const x1 = p1[0];
  const y1 = p1[1];
  const x2 = p2[0];
  const y2 = p2[1];

  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = round(Math.sqrt(dx ** 2 + dy ** 2), PRECISION);

  if (d > r1 + r2) {
    // The circles do not intersect
    console.log('not intersect');
    return [];
  }

  if (d < Math.abs(r2 - r1)) {
    console.log('contained');
    // One circle is contained within the other
    return [];
  }

  if (d === 0 && r1 === r2) {
    console.log('equal');
    // Circles are equal and coincident
    return [];
  }

  let isSinglePoint = false;
  if (d === r1 + r2 || d === r1 - r2) {
    // Single point
    isSinglePoint = true;
  }

  const chordDistance = (r1 ** 2 - r2 ** 2 + d ** 2) / (2 * d);
  const halfChordLength = Math.sqrt(r1 **2 - chordDistance ** 2);
  const chordMidPointX = x1 + (chordDistance * dx) / d;
  const chordMidPointY = y1 + (chordDistance * dy) / d;

  const i1 = [
    round(chordMidPointX + (halfChordLength * dy) / d, PRECISION),
    round(chordMidPointY - (halfChordLength * dx) / d, PRECISION),
  ];
  const theta1 = round(
    Math.atan2(i1[1] - y1, i1[0] - x1),
    PRECISION
  );

  const i2 = [
    round(chordMidPointX - (halfChordLength * dy) / d, PRECISION),
    round(chordMidPointY + (halfChordLength * dx) / d, PRECISION),
  ];
  const theta2 = round(
    Math.atan2(i2[1] - y1, i2[0] - x1),
    PRECISION
  );

  if (isSinglePoint) {
    return [ i1 ];
  }

  if (theta2 > theta1) {
    return [ i2, i1 ];
  }

  return [ i1, i2 ];
}


const sketch = async ({ context, width, height }) => {
  const c = context;
  const maxDimension = Math.max(width, height);
  const minDimension = Math.min(width, height);
  const marginX = 0.2 * maxDimension;
  const marginY = 0.2 * maxDimension;

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
  const palette = random.shuffle(
    random.pick(palettes)
  ).slice(1, colorCount);

  function drawCircleIntersection(c1, r1, c2, r2, fillColor) {
    const [u1, v1] = c1;
    const [u2, v2] = c2;

    c.lineWidth = 0.004 * minDimension;
    c.fillStyle = 'none';

    const x1 = lerpX(u1);
    const x2 = lerpX(u2);
    const y1 = lerpY(v1);
    const y2 = lerpY(v2);
    const R1 = lerpDim(r1);
    const R2 = lerpDim(r2);

    const points = circleIntersect(
      [x1, y1], R1,
      [x2, y2], R2,
    );

    // if (points.length < 2) {
    //   return;
    // }

    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.strokeStyle = palette[1];
    c.stroke();

    // c.beginPath();
    // c.moveTo(points[0][0], points[0][1]);
    // c.lineTo(points[1][0], points[1][1]);
    // c.strokeStyle = palette[1];
    // c.stroke();

    c.strokeStyle = fillColor;
    c.lineWidth = lerpDim(0.002);
    c.beginPath();
    c.arc(x1, y1, R1, 0, Math.PI * 2);
    c.stroke();

    c.beginPath();
    c.arc(x2, y2, R2, 0, Math.PI * 2);
    c.stroke();

    // for (let point of points) {
    //   c.beginPath();
    //   c.arc(
    //     point[0],
    //     point[1],
    //     0.1 * minDimension,
    //     0, Math.PI * 2
    //   );
    //   c.fillStyle = palette[1];
    //   c.fill();
    // }

    // c.fillStyle = 'none';
    // c.beginPath();
    // c.arc(
    //   x1, y1, R1,
    //   circleAngle([x1, y1], points[0]),
    //   circleAngle([x1, y1], points[1]),
    // );
    // c.strokeStyle = palette[0];
    // c.lineWidth = lerpDim(0.01);
    // c.fillStyle = fillColor;
    // // c.fillStyle = 'white';
    // c.fill();
    // c.stroke();

    // c.beginPath();
    // c.arc(
    //   x2, y2, R2,
    //   circleAngle([x2, y2], points[0]),
    //   circleAngle([x2, y2], points[1]),
    //   true
    // );
    // c.fillStyle = fillColor;
    // // c.fillStyle = 'white';
    // c.fill();
    // c.strokeStyle = palette[0];
    // c.lineWidth = lerpDim(0.01);
    // c.stroke();


  }

  const N = 10;
  const circles = [];
  for (let i = 0; i < N; i++) {
    const u = i / N; // random.gaussian(0.5, 0.4);
    const v = random.value() * 0.9 + 0.1;
    const r = Math.abs(random.gaussian(4 / N, 3 / N));
    circles.push([[ u, v ], r, random.pick(palette.slice(2))]);
  }

  return ({ context, width, height, playhead, }) => {

    c.fillStyle = palette[0];
    c.fillRect(0, 0, width, height);

    for (let i = 0; i < circles.length; i++) {
      const prev = wrap(i - 1, 0, circles.length);
      const circle1 = circles[prev];
      const circle2 = circles[i];

      const [ [ u1, v1 ], r1, color1 ] = circle1;
      const [ [ u2, v2 ], r2, color2 ] = circle2;

      drawCircleIntersection([u1, v1], r1, [u2, v2], r2, color1);
    }
  };
};

canvasSketch(sketch, settings);
