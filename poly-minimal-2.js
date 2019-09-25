const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const Color = require('canvas-sketch-util/color');
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
  // dimensions: [412, 2 * 412],
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

function drawDelimiter1(
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

  context.beginPath();
  context.moveTo(
    centerX + innerRadius * Math.cos(startInner),
    centerY + innerRadius * Math.sin(startInner)
  );

  context.lineTo(
    centerX + outerRadius * Math.cos(startInner),
    centerY + outerRadius * Math.sin(startInner)
  );

  const meanRadius = innerRadius + (outerRadius - innerRadius) / 2;
  context.lineTo(
    centerX + meanRadius * Math.cos(endOuter),
    centerY + meanRadius * Math.sin(endOuter)
  );

  context.fillStyle = color;
  context.fill();
}


function drawDelimiter2(
  context,
  {
    centerX,
    centerY,
    innerRadius,
    outerRadius,
    angle,
    width,
    fillColor,
    strokeColor,
  }
) {
  context.save()
  const meanRadius = innerRadius + (outerRadius - innerRadius) / 2;
  context.translate(
    centerX + meanRadius * Math.cos(angle),
    centerY + meanRadius * Math.sin(angle)
  );
  context.rotate(angle + Math.PI / 2);

  context.beginPath();
  context.moveTo(
    - width * 0.25,
    - width * 0.7,
  );
  context.lineTo(
    - width * 0.25,
    + width * 0.7,
  );
  context.lineTo(
    + width * 0.5,
    0
  );

  const bw = 2;

  context.fillStyle = strokeColor;
  context.fill();

  context.beginPath();
  context.moveTo(
    - width * 0.25 + bw,
    - width * 0.7 + bw
  );
  context.lineTo(
    - width * 0.25 + bw,
    + width * 0.7 - bw
  );
  context.lineTo(
    + width * 0.5 - bw,
    0
  );

  context.fillStyle = fillColor;
  context.fill();

  context.restore();
}

function drawDelimiter(
  context,
  {
    centerX,
    centerY,
    innerRadius,
    outerRadius,
    angle,
    width,
    fillColor,
    strokeColor,
  }
) {
  context.save()
  const meanRadius = innerRadius + (outerRadius - innerRadius) / 2;
  context.translate(
    centerX + meanRadius * Math.cos(angle),
    centerY + meanRadius * Math.sin(angle)
  );
  context.rotate(angle + Math.PI / 2);

  context.beginPath();
  context.moveTo(
    - width * 0.15,
    - width * 0.5,
  );
  context.lineTo(
    - width * 0.15,
    + width * 0.5,
  );
  context.lineTo(
    + width * 0.15,
    + width * 0.5,
  );
  context.lineTo(
    + width * 0.15,
    - width * 0.5,
  );

  const bw = 1;

  context.fillStyle = strokeColor;
  context.fill();

  context.beginPath();
  context.moveTo(
    - width * 0.15 + bw,
    - width * 0.5 + bw,
  );
  context.lineTo(
    - width * 0.15 + bw,
    + width * 0.5 - bw,
  );
  context.lineTo(
    + width * 0.15 - bw,
    + width * 0.5 - bw,
  );
  context.lineTo(
    + width * 0.15 - bw,
    - width * 0.5 + bw,
  );

  context.fillStyle = fillColor;
  context.fill();

  context.restore();
}

function hslToStr(hsl, a) {
  let alpha = (a || 1) * 100;
  alpha = eases.expoOut(alpha / 100) * 100;
  return `hsla(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%, ${alpha}%)`;
}

const circles = [
  [ 0, 1 ],
  [ 0.5, 1, ],
  [ 0, 0.25, 0.75, 1, ],
  [ 0, 0.2, 0.4, 0.6, 0.8, 1, ],
];

const radianAngle = Math.PI * 0.1;

const delimWidth = 34;


const sketch = () => {
  // const palette = random.shuffle(random.pick(palettes));
  const palette = [
    [0, 0, 12],
    [217, 48, 39 + 16],
    [5, 96, 61],
    [217, 48, 39],
    [47, 81, 56],
  ];
  // const progressColor = palette.slice(-1)[0];
  // const circlePalette = palette.slice(1).map(hexToHsl);
  const progressColor = [0, 0, 80];
  const circlePalette = palette.slice(1);
  const bgColor = hslToStr(palette[0]);

  return ({ context, width, height, time, playhead }) => {
    context.fillStyle = bgColor;
    context.fillRect(0, 0, width, height);

    const centerX = Math.round(width * 0.5);
    const centerY = centerX;

    // drawWideArc(context, {
    //   centerX,
    //   centerY,
    //   innerRadius: 0.490 * width,
    //   outerRadius: 0.495 * width,
    //   startAngle: 0 - Math.PI / 2,
    //   endAngle: 2 * Math.PI - Math.PI / 2,
    //   color: 'hsla(0, 0%, 0%, 8%)'
    // });

    // drawWideArc(context, {
    //   centerX,
    //   centerY,
    //   innerRadius: 0.490 * width,
    //   outerRadius: 0.495 * width,
    //   startAngle: 0 - Math.PI / 2,
    //   endAngle: 2 * Math.PI * playhead - Math.PI / 2,
    //   color: hslToStr(progressColor, 1),
    // });

    let angle = 0;
    while (angle < Math.PI) {
      context.save()
      context.translate(centerX, centerY);
      context.rotate(angle);
      context.beginPath()
      context.moveTo(0, -width * 0.45);
      context.lineTo(0, width * 0.45);
      context.strokeStyle = 'hsl(0,0%,18%)';
      context.lineWidth = 1;
      context.stroke();
      context.restore();
      angle += radianAngle;
    }

    let minArcLength = 2 * Math.PI;
    const base = [];

    for (let i = 0; i < circles.length; i++) {
      const circle = circles[i];
      const baseRadius = (
        width * i * 0.07 + i * 4 + width * 0.10
      );
      base[i] = baseRadius;

      const trackWidth = width * 0.0088;
      const innerRadius = Math.floor(baseRadius - trackWidth);
      const outerRadius = Math.floor(baseRadius + trackWidth);

      drawWideArc(context, {
        centerX,
        centerY,
        innerRadius: Math.floor(baseRadius - trackWidth * 0.8),
        outerRadius: Math.floor(baseRadius + trackWidth * 0.8),
        startAngle: 0,
        endAngle: 2 * Math.PI,
        color: 'hsl(0, 0%, 18%)'
      });

      for (let j = 0; j < circle.length - 1; j++) {
        const arcStart = circle[j] * Math.PI * 2;
        const arcEnd = circle[j + 1] * Math.PI * 2;
        const curEnd = playhead * 2 * Math.PI;
        minArcLength = Math.min(minArcLength, arcEnd - arcStart);

        if (circle[j] <= playhead && circle[j + 1] >= playhead) {
          drawWideArc(context, {
            centerX,
            centerY,
            innerRadius,
            outerRadius,
            startAngle: 0 - Math.PI / 2,
            endAngle: 2 * Math.PI * playhead - Math.PI / 2,
            color: 'white',
          });
        }
      }
    }

    for (let i = 0; i < circles.length; i++) {
      const circle = circles[i];
      const baseRadius = base[i];
      for (let j = 0; j < circle.length - 1; j++) {
        const arcStart = circle[j] * Math.PI * 2;
        const arcEnd = circle[j + 1] * Math.PI * 2;
        const curEnd = playhead * 2 * Math.PI;

        const progress = (
          Math.min((curEnd - arcStart), minArcLength) /
          minArcLength
        );

        const activeColor = [
          0,
          0,
          100 - 88 * eases.sineIn(progress),
        ];

        const fillColor = (
          arcStart < curEnd
        ) ? hslToStr(activeColor) : bgColor;

        drawDelimiter(context, {
          centerX,
          centerY,
          innerRadius: Math.floor(baseRadius - width * 0.028),
          outerRadius: Math.floor(baseRadius + width * 0.028),
          angle: arcStart - Math.PI / 2,
          width: delimWidth,
          strokeColor: 'hsl(0, 0%, 80%)',
          fillColor,
        });
      }
    }
  };
};
window.Color = Color;

canvasSketch(sketch, settings);
