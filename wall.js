const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const palettes = require('nice-color-palettes');

random.setSeed(random.getRandomSeed());

const settings = {
  suffix: random.getSeed(),
  dimensions: [ 2048, 2048 ]
};

const sketch = () => {
  const palette = random.pick(palettes);

  const createGrid = () => {
    const points = [];
    const count = 4;

    for (let x = 0; x < count; x++) {
      for (let y = 0; y < count - 1; y++) {
        const u = x / (count - 1);
        const v = y / (count - 1);
        points.push([ u, v ]);
      }
    }

    return points;
  };

  const bgColor = '#303030';
  const margin = 100;

  return ({ context, width, height }) => {
    const lineWidth = Math.round(0.01 * width);

    context.fillStyle = bgColor;
    context.fillRect(0, 0, width, height);

    const points = random.shuffle(createGrid());
    const figures = [];
    while (points.length) {
      const p1 = points.pop();
      const p2 = points.pop();

      console.log(p1, p2);

      const p1x = lerp(margin, width - margin, p1[0]);
      const p1y = lerp(margin, height - margin, p1[1]);

      const p2x = lerp(margin, width - margin, p2[0]);
      const p2y = lerp(margin, height - margin, p2[1]);

      const p3x = p2x;
      const p3y = lerp(margin, height - margin, 1);

      const p4x = p1x;
      const p4y = p3y;


      figures.push({
        p1x, p1y,
        p2x, p2y,
        p3x, p3y,
        p4x, p4y,
        s: Math.max(p1y, p2y)
      });
    }

    figures.sort((f1, f2) => f1.s - f2.s);

    for (let figure of figures) {
      const {
        p1x, p1y,
        p2x, p2y,
        p3x, p3y,
        p4x, p4y,
      } = figure;

      context.beginPath();
      context.moveTo(p1x, p1y);
      context.lineTo(p2x, p2y);
      context.lineTo(p3x, p3y);
      context.lineTo(p4x, p4y);

      context.lineWidth = lineWidth;
      context.shadowColor = 'RGBA(48, 48, 48, 0.8)';
      context.shadowBlur = lineWidth * 2;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = -lineWidth / 2;
      context.strokeStyle = 'transparent';
      context.stroke();
      context.fillStyle = random.pick(palette);
      context.fill();
    }
  };
};

canvasSketch(sketch, settings);
