const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const palettes = require('nice-color-palettes');
const eases = require('eases');
const hexToHsl = require('hex-to-hsl');

// const seed = random.getRandomSeed();
const seed = 177648;
console.log('seed', seed);
random.setSeed(seed);

const settings = {
  animate: true,
  duration: 2,
  context: '2d',
  fps: 24,
  dimensions: [600, 600],
  attributes: { antialias: true }
};


function drawWideArc(
  context,
  {
    centerX,
    centerY,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    color,
    contextPattern,
  }
) {
  context.beginPath();
  context.arc(
    centerX,
    centerY,
    innerRadius,
    startAngle,
    endAngle,
    false
  );

  context.arc(
    centerX,
    centerY,
    outerRadius,
    endAngle,
    startAngle,
    true
  );

  // context.fillStyle = contextPattern;
  // context.fill();

  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = 0;

  // context.globalCompositeOperation = 'hard-light';
  context.fill();
  // context.globalCompositeOperation = 'source-over';
}

function findAnglesForWidth({
  centerX,
  centerY,
  baseAngle,
  radius,
  width,
}) {
  const alpha = Math.acos(width / (2 * radius));
  const beta = Math.PI - 2 * alpha;
  return [baseAngle - beta / 2, baseAngle + beta / 2];
}

function drawDelimiter(
  context,
  { centerX, centerY, innerRadius, outerRadius, angle, width, color }
) {
  context.beginPath();

  const [startInner, endInner] = findAnglesForWidth({
    centerX,
    centerY,
    baseAngle: angle,
    radius: innerRadius,
    width,
  });

  const [startOuter, endOuter] = findAnglesForWidth({
    centerX,
    centerY,
    baseAngle: angle,
    radius: outerRadius,
    width,
  });

  context.arc(
    centerX,
    centerY,
    innerRadius,
    startInner,
    endInner,
    false
  );

  context.arc(
    centerX,
    centerY,
    outerRadius,
    endOuter,
    startOuter,
    true
  );
  context.fillStyle = color;
  context.fill();
}

function hslToStr(hsl, a) {
  let alpha = (a || 1) * 100;
  alpha = eases.expoOut(alpha / 100) * 100;
  return `hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, ${alpha}%)`;
}

const circles = [
  [ 0, 1 ],
  [ 0, 0.33, 0.66, 1, ],
  [ 0, 0.25, 0.75, 1, ],
  [ 0, 0.5, 0.75, 1, ],
];

const delimWidth = 12;


const sketch = () => {
  const palette = random.shuffle(random.pick(palettes));
  const progressColor = palette.slice(-1)[0];
  const circlePalette = palette.slice(1).map(hexToHsl);

  return ({ context, width, height, time, playhead }) => {
    context.fillStyle = palette[0];
    context.fillRect(0, 0, width, height);

    const centerX = Math.round(width * 0.5);
    const centerY = centerX;

    drawWideArc(context, {
      centerX,
      centerY,
      innerRadius: 0.44 * width,
      outerRadius: 0.45 * width,
      startAngle: 0 - Math.PI / 2,
      endAngle: 2 * Math.PI - Math.PI / 2,
      color: 'hsla(0, 0%, 0%, 8%)'
    });

    drawWideArc(context, {
      centerX,
      centerY,
      innerRadius: 0.44 * width,
      outerRadius: 0.45 * width,
      startAngle: 0 - Math.PI / 2,
      endAngle: 2 * Math.PI * playhead - Math.PI / 2,
      color: progressColor,
    });


    for (let i = 0; i < circles.length; i++) {
      const circle = circles[i];
      const baseRadius = (
        width * i * 0.07 + i * 8 + width * 0.1
      );

      const innerRadius = baseRadius - width * 0.028;
      const outerRadius = baseRadius + width * 0.028;

      drawWideArc(context, {
        centerX,
        centerY,
        innerRadius,
        outerRadius,
        startAngle: 0,
        endAngle: 2 * Math.PI,
        color: 'hsla(0, 0%, 0%, 24%)'
      });

      for (let j = 0; j < circle.length - 1; j++) {
        const arcStart = circle[j] * Math.PI * 2;
        const arcEnd = circle[j + 1] * Math.PI * 2;
        const curEnd = playhead * 2 * Math.PI;

        if (circle[j] <= playhead && circle[j + 1] >= playhead) {
          drawWideArc(context, {
            centerX,
            centerY,
            innerRadius,
            outerRadius,
            startAngle: arcStart - Math.PI / 2,
            endAngle: arcEnd - Math.PI / 2,
            color: hslToStr(
              circlePalette[i],
              (arcEnd - curEnd) / (arcEnd - arcStart)
            )
          });
        }


        drawDelimiter(context, {
          centerX,
          centerY,
          innerRadius,
          outerRadius,
          angle: arcStart - Math.PI / 2,
          width: delimWidth,
          color: palette[0],
        });

        drawDelimiter(context, {
          centerX,
          centerY,
          innerRadius,
          outerRadius,
          angle: arcEnd - Math.PI / 2,
          width: delimWidth,
          color: palette[0],
        });
      }
    }
  };
};

canvasSketch(sketch, settings);
