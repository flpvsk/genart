const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');
const palettes = require('nice-color-palettes');

// random.setSeed(random.getRandomSeed());
random.setSeed(730948);

const settings = {
  dimensions: [5016, 5016 * 9 / 16],
  suffix: `${random.getSeed()}`,
};

const sketch = () => {
  const colorCount = random.rangeFloor(1, 6);
  const palette = random.shuffle(
    random.pick(palettes)
  ).slice(1, colorCount);

  const createGrid = () => {
    const points = [];
    const countX = Math.floor(100 * 16 / 9);
    const countY = 100;
    for (let x = 0; x < countX; x++) {
      for (let y = 0; y < countY; y++) {
        const u = x / (countX - 1);
        const v = y / (countY - 1);
        const size = 0.5 + 0.5 * random.noise2D(u * 0.02, v * 0.1);
        const colorIndex = Math.floor(size * palette.length) + 1;
        points.push({
          color: palette[colorIndex],
          position: [ u, v ],
          size: 1 * size,
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

  return ({ context, width, height }) => {
    const margin = 0; //0.1 * height;
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
      context.font = `${size * height * 0.02}px Arial`;
      context.translate(x, y);
      context.rotate(rotation);
      const symbol = `s`;
      context.fillText(symbol, 0, 0);
      context.restore();
    });

  };
};

canvasSketch(sketch, settings);
