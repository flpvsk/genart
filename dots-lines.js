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

const sketch = ({ width, height, context }) => {
  const c = context;
  const playheadFraction = 0.05;
  const points = createPoints(1 / playheadFraction);
  const radius = width * 0.004;

  function toX(u) {
    return ;
  }
  function toY(v) {
    return lerp(0, height, v);
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

  return ({ context, width, height, playhead }) => {
    c.fillStyle = 'white';
    c.fillRect(0, 0, width, height);



    const drawDotsScene = makeScene(
      points.length,
      pos => {
        drawDots(c, pos, 32, width - 32, 32, height - 32);
      }
    );
    const drawLinesScene = makeScene(
      points.length,
      pos => {
        drawLines(c, pos, 32, width - 32, 32, height - 32);
      }
    );
    const showLinesScene = makeScene(
      points.length,
      () => {
        drawLines(c, 1, 32, width - 32, 32, height - 32);
      }
    );
    let seq = appendToSequence(drawDotsScene);
    seq = appendToSequence(drawLinesScene, seq);
    seq = appendToSequence(showLinesScene, seq);

    runSequence(seq, playhead);
  };
};

canvasSketch(sketch, settings);
