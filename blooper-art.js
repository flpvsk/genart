import haltonSeq from './haltonSequence';
import canvasSketch from 'canvas-sketch';
import { lerp, wrap, clamp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';

const settings = {
  dimensions: [ 2048, 2048 ]
};

let seed = random.getRandomSeed();
console.log('seed', seed);
random.setSeed(seed);

const sketch = ({ width, height }) => {
  const blocks = 3;
  const marginX = 3 * 0.0156 * width;
  const marginY = marginX;
  const gutterY = 0.6 * marginY;
  const minX = marginX;
  const maxX = width - marginX;
  const minY = marginY;
  const maxY = height - marginY;

  function drawBlockBorder(c, minX, maxX, minY, maxY) {
    c.fillStyle = 'none';
    c.lineWidth = 4 / 2048 * width;
    c.strokeStyle = 'black';
    c.beginPath();
    c.rect(minX, minY, maxX - minX, maxY - minY);
    c.closePath();
    c.stroke();
    c.clip();
  }

  function drawBlock1(c, minX, maxX, minY, maxY) {
    c.save();
    drawBlockBorder(c, minX, maxX, minY, maxY);

    c.lineWidth = 0;
    c.strokeStyle = 'none';
    c.fillStyle = 'grey';

    for (let i = 0; i < 300; i++) {
      let u = haltonSeq(i, 2);
      let v = haltonSeq(i, 3);

      const x = lerp(minX, maxX, u);
      const y = lerp(minY, maxY, v);

      if (random.value() > 0.8) {
        continue;
      }

      c.beginPath();
      c.arc(x, y, 0.003 * (maxX - minX), 0, Math.PI * 2);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  const letters = [ 'b', 'd', 'f', 'h', 'j', 'l', ];
  function drawBlock2(c, minX, maxX, minY, maxY) {
    c.save();
    drawBlockBorder(c, minX, maxX, minY, maxY);

    for (let i = 0; i < 50; i++) {
      let u = haltonSeq(i, 2);
      let v = haltonSeq(i, 3);

      const x = lerp(minX, maxX, u);
      const y = lerp(minY, maxY, v);

      const size = Math.floor((maxY - minY) * 0.20);
      c.font = `${size}px "Childish Reverie Doodles"`;
      c.fillStyle = 'grey';
      c.strokeStyle = 'grey';

      const p1 = random.value();
      const p2 = random.gaussian(0, 0.5);
      const l = random.pick(letters);

      c.save();
      c.translate(x, y);
      c.rotate(p2 * 2 * Math.PI)

      if (p1 > 0.8) {
        c.beginPath();
        c.arc(0, 0, size * p1 * 0.1, 0, Math.PI * 2);
        c.closePath();
        c.fill();
        c.restore();
        continue;
      }

      if (p1 > 0.3) {
        c.fillText(l, 0, 0);
      }

      if (p1 <= 0.3) {
        c.strokeText(l, 0, 0);
      }

      c.restore();
    }

    c.restore();
  }

  function drawBlock3(c, minX, maxX, minY, maxY) {
    c.save();
    drawBlockBorder(c, minX, maxX, minY, maxY);
    const lerpX = x => lerp(minX, maxX, x);
    const lerpY = y => lerp(minY, maxY, y);

    const offset = random.value();
    const linesCount = 8;
    const pointsCount = 40;
    for (let j = 0; j <= linesCount; j++) {
      c.beginPath();
      const lineMinY = lerpY((j - 1) / (linesCount));
      const lineMaxY = lerpY((j + 1) / (linesCount));
      const lineMinX = lerpX(0 - offset);
      const lineMaxX = lerpX(2 - offset);

      const lineLerpY = y => lerp(lineMinY, lineMaxY, y);
      const lineLerpX = x => lerp(lineMinX, lineMaxX, x);
      c.moveTo(lineLerpX(0),  lineLerpY(0.5));

      for (let i = 1; i < pointsCount; i += 2) {
        c.fillStyle = 'red';

        let controlY = (i - 1) % 4 === 0 ? 0 : 1;

        c.quadraticCurveTo(
          lineLerpX(i / pointsCount),
          lineLerpY(controlY),
          lineLerpX((i + 1) / pointsCount),
          lineLerpY(0.5)
        );
      }

      c.lineWidth = (maxY - minY) * 0.012;
      c.strokeStyle = 'grey';
      c.stroke();
      c.closePath();
    }

    c.restore();
  }

  return ({ context, width, height }) => {
    const c = context;
    c.fillStyle = 'white';
    c.fillRect(0, 0, width, height);

    c.beginPath();
    c.rect(0, 0, width, height);
    c.lineWidth = marginX;
    c.strokeStyle = 'rgb(122, 195, 219)';
    c.stroke();

    const blockHeight = (
      height - (blocks - 1) * gutterY - 2 * marginY
    ) / blocks;

    drawBlock1(c, minX, maxX, minY, minY + blockHeight);

    drawBlock2(
      c,
      minX, maxX,
      minY + 1 * blockHeight + gutterY,
      minY + 2 * blockHeight + gutterY,
    );

    drawBlock3(
      c,
      minX, maxX,
      minY + 2 * blockHeight + 2 * gutterY,
      height - marginY
    );

    const line1 = 'march';
    const line2 = 'twenty eight';
    const line3 = 'berlin';

    const textHeight = 0.14 * height;;

    c.font = `${textHeight}px Coolvetica`;
    c.fillStyle = 'rgb(234, 169, 235)';
    // c.shadowColor = 'rgb(251, 253, 179)';
    c.shadowColor = `rgb(187, 254, 181)`;
    c.shadowBlur = 0;
    c.shadowOffsetX = 0.005 * width;
    c.shadowOffsetY = 0.005 * height;

    const textSize1 = c.measureText(line1);
    const textSize2 = c.measureText(line2);
    const textSize3 = c.measureText(line3);

    c.fillText(
      line1,
      (width - textSize1.width) / 2,
      (height) / 2 - textHeight * 1.00
    );

    c.fillText(
      line2,
      (width - textSize2.width) / 2,
      (height) / 2 - textHeight * 0.2
    );

    c.shadowOffsetX = 0;
    c.shadowOffsetY = 0;
    c.shadowColor = 'none';

    c.save();
    c.lineJoin = 'round';
    c.miterLimit = 2;
    c.strokeStyle = 'white';
    c.lineWidth = textHeight * 0.1;
    c.strokeText(
      line3,
      (width - textSize3.width) / 2,
      (height) / 2 + textHeight * 2.4
    );
    c.restore();

    c.fillStyle = 'rgb(122, 195, 219)';
    // c.shadowColor = 'rgb(251, 253, 179)';
    c.fillText(
      line3,
      (width - textSize3.width) / 2,
      (height) / 2 + textHeight * 2.4
    );
  };
};

canvasSketch(sketch, settings);
