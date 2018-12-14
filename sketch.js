const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const palettes = require('nice-color-palettes');

const settings = {
  dimensions: [2048, 2048],
};

const sketch = () => {
  random.setSeed('1');
  const colorCount = random.rangeFloor(1, 6);
  const palette = random.shuffle(
    random.pick(palettes)
  ).slice(1, colorCount);

  const createGrid = () => {
    const points = [];
    const count = 50;
    for (let x = 0; x < count; x++) {
      for (let y = 0; y < count; y++) {
        const u = x / (count - 1);
        const v = y / (count - 1);
        const size = 0.5 + 0.5 * random.noise2D(u, v, 0.01, 10);
        const colorIndex = Math.floor(size * palette.length);
        points.push({
          color: palette[colorIndex],
          position: [ u, v ],
          size: 0.8 + size,
          rotation: Math.PI * 2 * size,
        });
      }
    }

    return points;
  };

  const points = createGrid()
    .filter(({ position: [u, v] }) => {
      return random.gaussian() > 0.6;
    });
  const margin = 200;

  return ({ context, width, height }) => {
    // context.fillStyle = '#afbdc4';
    // context.fillStyle = '#313131';
    context.fillStyle = palette[0];
    // context.fillStyle = 'white';
    context.fillRect(0, 0, width, height)

    points.forEach(({ position: [u, v], size, color, rotation }) => {
      const x = lerp(margin, width - margin, u);
      const y = lerp(margin, height - margin, v);
      // context.fillStyle = '#313131';
      context.fillStyle = color;
      // context.beginPath();
      // context.arc(x, y, width * 0.009, 0, Math.PI * 2, false);
      // context.fill();
      // context.fillRect(
      //   x - size / 2,
      //   y - size / 2,
      //   size * width * 0.013,
      //   size * height * 0.013
      // );
      context.save();
      context.font = `${size * width * 0.08}px Arial`;
      context.translate(x, y);
      context.rotate(rotation);
      const symbol = `|`;
      context.fillText(symbol, 0, 0);
      context.restore();
    });

  };
};

canvasSketch(sketch, settings);
