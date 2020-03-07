const canvasSketch = require('canvas-sketch');
const { lerp, wrap } = require('canvas-sketch-util/math');

const settings = {
  dimensions: [ 2048, 2048 ],
  duration: 4,
  animate: true,
};


function drawPath(c, path, x, y, width, height) {
  if (!path.length || path.length < 4) {
    return;
  }

  c.beginPath();
  c.moveTo(lerp(x, width, path[0]), lerp(y, height, path[1]));

  for (let i = 2; i < path.length; i++) {
    c.lineTo(lerp(x, width, path[i]), lerp(y, height, path[i + 1]));
  }

  c.closePath();
}

const steps = 2;
const figureInit = [
  0.5, 0.1,
  0.1, 0.9,
  0.9, 0.9,
];
let figure = figureInit;
const points = [];

const sketch = () => {
  return ({ context, width, height, playhead }) => {
    const c = context;
    c.clearRect(0, 0, width, height);

    c.fillStyle = 'white';
    c.fillRect(0, 0, width, height);


    const currentStep = Math.floor(playhead * steps) % (steps * 2);

    if (currentStep >= 0) {
      const edgeStart = wrap(
        Math.floor(currentStep / 2),
        0,
        figure.length / 2
      );
      const edgeEnd = wrap(edgeStart + 1, 0, figure.length / 2);
      const x1 = figure[edgeStart * 2];
      const x2 = figure[edgeEnd * 2];
      const y1 = figure[edgeStart * 2 + 1]
      const y2 = figure[edgeEnd * 2 + 1];

      const point = [
        x1 + (x2 - x1) / 2,
        y1 + (y2 - y1) / 2,
      ];

      c.fillStyle = 'grey';
      drawPath(c, figure, 0, 0, width, height);
      c.fill();

      const pointX = lerp(0, width, point[0]);
      const pointY = lerp(0, height, point[1]);

      c.beginPath();
      c.arc(pointX, pointY, 20, 0, Math.PI * 2);
      c.lineWidth = 20;
      c.strokeStyle = 'blue';
      c.stroke();
    }
  };
};

canvasSketch(sketch, settings);
