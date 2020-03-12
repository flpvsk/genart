import haltonSeq from './haltonSequence';
import canvasSketch from 'canvas-sketch';
import { lerp, wrap, clamp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';
import load from 'load-asset';

const settings = {
  dimensions: [ 2048, 2048 ],
  // dimensions: [ 608, 1080, ],
  // dimensions: [ 1200, 628 ],
  animate: true,
  duration: 15,
};

let seed = random.getRandomSeed();
console.log('seed', seed);
random.setSeed(seed);

const YELLOW = 'rgb(251, 253, 179)';
const PINK = 'rgb(234, 169, 235)';
const BLUE = 'rgb(122, 195, 219)';
const GREEN = `rgb(187, 254, 181)`;

const sketch = async ({ width, height }) => {
  const blocks = 3;
  const marginX = 3 * 0.0156 * width;
  const marginY = marginX;
  const gutterY = 0.6 * marginY;
  const minX = marginX;
  const maxX = width - marginX;
  const minY = marginY;
  const maxY = height - marginY;

  const blooperImg = await load('assets/blooper.png');

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

  function drawBlock1(c, playhead, minX, maxX, minY, maxY) {
    c.save();
    drawBlockBorder(c, minX, maxX, minY, maxY);

    c.lineWidth = 0;
    c.strokeStyle = 'none';
    c.fillStyle = 'grey';

    for (let i = 0; i < 1000; i++) {
      let u = haltonSeq(i, 2);
      let v = haltonSeq(i, 3);

      const x = lerp(minX, maxX, u);
      const y = lerp(minY, maxY, v);

      if (random.noise3D(u, v, playhead, 8) > 0.3) {
        continue;
      }

      c.beginPath();
      c.arc(x, y, 0.001 * (maxX - minX), 0, Math.PI * 2);
      c.closePath();
      c.fill();
    }
    c.restore();
  }

  const letters = random.shuffle([ 'b', 'd', 'f', 'h', 'j', 'l', ]);
  function drawBlock2(c, playhead, minX, maxX, minY, maxY) {
    c.save();
    drawBlockBorder(c, minX, maxX, minY, maxY);

    for (let i = 0; i < 50; i++) {
      let u = haltonSeq(i, 2);
      let v = haltonSeq(i, 3);

      const x = lerp(minX, maxX, u);
      const y = lerp(minY, maxY, v);

      const size = Math.floor((maxY - minY) * 0.23);
      c.font = `${size}px "Childish Reverie Doodles"`;
      c.fillStyle = 'grey';
      c.strokeStyle = 'grey';

      const p1 = random.noise3D(u, v, playhead, 100);
      const p2 = random.noise3D(u, v, playhead);
      const l = letters[wrap(i, 0, letters.length)];

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

  function drawBlock3(c, playhead, minX, maxX, minY, maxY) {
    c.save();
    drawBlockBorder(c, minX, maxX, minY, maxY);
    const lerpX = x => lerp(minX, maxX, x);
    const lerpY = y => lerp(minY, maxY, y);

    const offsetY = -playhead;
    const linesCount = 80;
    const pointsCount = 40;
    for (let j = 0; j <= linesCount; j++) {
      c.beginPath();
      const lineMinY = lerpY(10 * (j - 1) / (linesCount) + offsetY);
      const lineMaxY = lerpY(10 * (j + 1) / (linesCount) + offsetY);
      const lineMinX = lerpX(0);
      const lineMaxX = lerpX(1);

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

  function dividePlayhead(playhead, n) {
    return Math.floor(playhead * n) / n;
  }

  return ({ context, width, height, playhead, }) => {
    const c = context;
    c.fillStyle = 'white';
    c.fillRect(0, 0, width, height);

    c.beginPath();
    c.rect(0, 0, width, height);
    c.lineWidth = marginX;
    c.strokeStyle = BLUE;
    c.stroke();

    const blockHeight = (
      height - (blocks - 1) * gutterY - 2 * marginY
    ) / blocks;

    drawBlock1(
      c,
      dividePlayhead(playhead, 3),
      minX, maxX,
      minY, minY + blockHeight
    );

    drawBlock2(
      c,
      dividePlayhead(playhead, 14),
      minX, maxX,
      minY + 1 * blockHeight + gutterY,
      minY + 2 * blockHeight + gutterY,
    );

    drawBlock3(
      c,
      playhead * 2,
      minX, maxX,
      minY + 2 * blockHeight + 2 * gutterY,
      height - marginY
    );

    const line1 = '28.03 12pm-5pm';
    const line2 = 'blooper party';
    const line3 = 'paolo pinkel';

    const textHeight = 0.07 * width;;

    c.font = `${textHeight}px Coolvetica`;
    c.fillStyle = PINK;
    c.shadowColor = GREEN;
    c.shadowBlur = 0;
    c.shadowOffsetX = 0.005 * width;
    c.shadowOffsetY = 0.005 * height;

    const textSize1 = c.measureText(line1);

    const line1Y = minY + 1.5 * marginY;
    const line2Y = line1Y + 2 * marginY;
    const line3Y = height - 1.52 * marginY;
    const lineX = 1.5 * marginX;

    c.fillText(
      line1,
      lineX,
      line1Y
    );

    c.font = `${textHeight * 1.2}px Coolvetica`;
    const textSize2 = c.measureText(line2);
    c.fillStyle = PINK;
    c.shadowColor = GREEN;
    c.shadowBlur = 0;
    c.shadowOffsetX = 0.005 * width;
    c.shadowOffsetY = 0.005 * height;

    c.fillText(
      line2,
      lineX,
      line2Y
    );

    c.font = `${textHeight}px Coolvetica`;
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 0;
    c.shadowColor = 'none';

    const textSize3 = c.measureText(line3);

    c.save();
    c.lineJoin = 'round';
    c.miterLimit = 2;
    c.strokeStyle = 'white';
    c.lineWidth = textHeight * 0.1;
    c.strokeText(
      line3,
      lineX,
      line3Y
    );
    c.restore();

    c.fillStyle = BLUE;
    c.fillText(
      line3,
      lineX,
      line3Y
    );

    const sourceX = 0;
    const sourceY = lerp(0, blooperImg.height, 1.0);
    const sizeX = blooperImg.width;
    const sizeY = blooperImg.height;
    const aspect = sizeX / sizeY;
    // const newWidth = width / 4;
    // const newHeight = newWidth / aspect;

    const newHeight = 0.8 * height - 4 * marginY;
    const newWidth = aspect * newHeight;

    const imgX = maxX - marginX - newWidth;
    const imgY = blockHeight;


    c.beginPath();
    c.rect(
      imgX - 0.5 * marginX,
      imgY - 0.5 * marginY,
      newWidth + 2 * 0.5 * marginX,
      newHeight + 2 * 0.5 * marginY,
    );
    c.closePath();

    c.lineWidth = 0.5 * marginX;
    c.fillStyle = YELLOW;
    c.strokeStyle = GREEN;

    c.stroke();
    c.fill();

    // draw image
    c.drawImage(
      blooperImg,
      imgX,
      imgY,
      newWidth,
      newHeight,
    );
  };
};

canvasSketch(sketch, settings);
