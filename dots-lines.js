import getImageData from './getImageData';
const canvasSketch = require('canvas-sketch');
const memoize = require('lodash/memoize');
const { lerp, wrap, clamp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const load = require('load-asset');

let seed = random.getRandomSeed();
console.log('seed', seed);
random.setSeed(seed);

const settings = {
  dimensions: [ 1024, 1024 ],
  duration: 10,
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

function makeScene(duration, draw) {
  return {
    duration,
    draw,
  };
}

function appendToSequence(scene, seq) {
  if (!seq) {
    seq = [];
  }

  return seq.concat([scene]);
}

function runSequence(seq, playhead) {
  const duration = seq.reduce((acc, scene) => acc + scene.duration, 0);

  if (!duration) {
    return;
  }

  const partSize = 1 / duration;
  const currentPart = playhead / partSize;
  const currentPartNumber = Math.floor(currentPart);
  const currentPartProgress = currentPart - currentPartNumber;

  let durationAcc = 0;
  for (let scene of seq) {
    durationAcc += scene.duration;
    if (durationAcc >= currentPart) {
      scene.draw(
        (currentPart - durationAcc + scene.duration) / scene.duration
      );
      return;
    }
  }
}

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

const sketch = async ({ width, height, context }) => {
  const c = context;
  const playheadFraction = 0.2;
  const points = createPoints(1 / playheadFraction);
  const radius = width * 0.004;
  const haltonCache = [];
  const haltonCount = 1000 * 200;
  const haltonColor = [];

  let gradImg = await load('assets/grad2.png');;
  const grad = getImageData(gradImg);

  function getLineY(x) {
    let i = 1;
    while (x > points[i][0] && i < points.length) {
      i++;
    }
    const p1 = points[i - 1];
    const p2 = points[i];
    return (
      p1[1] + (p2[1] - p1[1]) * (x - p1[0]) / (p2[0] - p1[0])
    );
  }

  let maxY = 1;
  let minY = 0;
  for (let p of points) {
    maxY = Math.max(p[1], maxY);
    minY = Math.min(p[1], minY);
  }
  const maxDiff = Math.max(1 - minY, maxY) / 2;

  for (let i = 0; i < haltonCount; i++) {
    const x = haltonSeq(i, 2);
    let y = haltonSeq(i, 3);

    const lineY = getLineY(x);
    const diff = Math.abs(lineY - y) / maxDiff;
    let prob = random.gaussian(1 - diff, 0.25);

    haltonCache.push(x);
    haltonCache.push(y);

    if (Math.sign(lineY - y) > 0) {
      prob = prob - 0.3;
    }

    const colorFix = clamp(0, 1, random.gaussian(0.0, 0.1));

    const imgX = Math.floor((diff + colorFix) * (grad.width - 1));
    const imgIndex = imgX * 4;
    const r = grad.data[imgIndex + 0];
    const g = grad.data[imgIndex + 1];
    const b = grad.data[imgIndex + 2];

    if (prob > 0.9) {
      haltonColor.push([r, g, b, 1]);
    }

    if (prob <= 0.9) {
      haltonColor.push([0, 0, 0, 0]);
    }
  }


  function drawDots(c, pos, minX, maxX, minY, maxY) {
    for (let i = 0; i < pos * points.length; i++) {
      const point = points[i];
      c.beginPath();
      c.arc(
        lerp(minX, maxX, point[0]),
        lerp(minY, maxY, point[1]),
        radius,
        0, Math.PI * 2
      );
      c.closePath();
      c.stroke();
      c.fillStyle = 'white';
      c.fill();
    }
  }

  function drawLines(c, pos, minX, maxX, minY, maxY) {
    c.beginPath();
    for (let i = 0; i < pos * points.length; i++) {
      const point = points[i];
      const x = lerp(minX, maxX, point[0]);
      const y = lerp(minY, maxY, point[1]);
      if (i === 0) {
        c.moveTo(x, y);
        continue;
      }

      c.lineTo(x, y);
    }
    c.stroke();

    drawDots(c, 1, minX, maxX, minY, maxY);
  }

  function drawShade(c, pos, minX, maxX, minY, maxY) {
    for (let i = 0; i < haltonCount; i++) {
      const x = haltonCache[i * 2];
      const y = haltonCache[i * 2 + 1];
      const color = haltonColor[i];

      if (color[3] === 0) {
        continue;
      }

      c.beginPath();
      c.arc(
        lerp(minX, maxX, x),
        lerp(minY, maxY, y),
        radius * 0.45,
        0, Math.PI * 2
      );
      c.fillStyle =
        `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${pos})`;
      c.fill();
      c.closePath();
    }
  }

  return ({ context, width, height, playhead }) => {
    c.fillStyle = 'white';
    c.fillRect(0, 0, width, height);

    const drawDotsScene = makeScene(
      points.length,
      pos => {
        drawDots(c, pos, 4, width - 4, 0.0 * height, 1.0 * height);
      }
    );
    const drawLinesScene = makeScene(
      points.length,
      pos => {
        drawLines(c, pos, 4, width - 4, 0.0 * height, 1.0 * height);
      }
    );
    const showLinesScene = makeScene(
      points.length,
      () => {
        drawLines(c, 1.0, 4, width - 4, 0.0 * height, 1.0 * height);
      }
    );
    const revealShadeScene = makeScene(
      2 * points.length,
      pos => {
        drawShade(c, pos, 4, width - 4, 0.0 * height, 1.0 * height);
        drawLines(c, 1.0, 4, width - 4, 0.0 * height, 1.0 * height);
      }
    );
    const showShadeScene = makeScene(
      2 * points.length,
      () => {
        drawShade(c, 1.0, 4, width - 4, 0.0 * height, 1.0 * height);
        drawLines(c, 1.0, 4, width - 4, 0.0 * height, 1.0 * height);
      }
    );
    const showShadeNoLinesScene = makeScene(
      points.length,
      () => {
        drawShade(c, 1.0, 4, width - 4, 0.0 * height, 1.0 * height);
        // drawLines(c, 1.0, 4, width - 4, 0.0 * height, 1.0 * height);
      }
    );

    let seq = appendToSequence(drawDotsScene);
    seq = appendToSequence(drawLinesScene, seq);
    seq = appendToSequence(showLinesScene, seq);
    seq = appendToSequence(revealShadeScene, seq);
    seq = appendToSequence(showShadeScene, seq);

    runSequence(seq, playhead);
  };
};

canvasSketch(sketch, settings);
