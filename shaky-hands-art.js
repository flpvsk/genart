import haltonSeq from './haltonSequence';
import canvasSketch from 'canvas-sketch';
import { lerp, wrap, clamp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';
import { elasticInOut } from 'eases';
import load from 'load-asset';

const settings = {
  // dimensions: [ 2048, 2048 ],
  dimensions: [ 608, 1080, ],
  // dimensions: [ 1200, 628 ],
  animate: true,
  duration: 15,
};

let seed = random.getRandomSeed();
console.log('seed', seed);
random.setSeed(seed);

const C_ORANGE = 'hsl(25, 90%, 82%)'
const C_BLUE = 'hsl(220, 90%, 82%)'
const C_BLUE_DARK = 'hsl(220, 90%, 42%)'
const C_YELLOW = 'rgb(251, 253, 179)';
const C_GREEN = `rgb(187, 254, 181)`;
const C_BLACK = `hsl(0, 0%, 10%)`;
const C_GREY = `hsl(0, 0%, 65%)`;

const C_FRAME = C_ORANGE;
const C_WAVE_FG = C_ORANGE;
const C_WAVE_BG = C_BLACK;

const sketch = async ({ width, height }) => {
  const blocks = 3;
  const marginX = 1.5 * 0.0156 * width;
  const marginY = marginX;
  const gutterY = 0.6 * marginY;
  const minX = marginX;
  const maxX = width - marginX;
  const minY = marginY;
  const maxY = height - marginY;
  const borderWidth = 0; // 4 / 2048 * width;

  function drawBlockBorder(c, minX, maxX, minY, maxY) {
    c.fillStyle = 'none';
    c.lineWidth = borderWidth;
    c.strokeStyle = C_BLUE;
    c.beginPath();
    c.rect(minX, minY, maxX - minX, maxY - minY);
    c.closePath();
    // c.stroke();
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

    c.fillStyle = C_WAVE_BG;
    c.fillRect(minX, minY, maxX - minX, maxY - minY);

    drawBlockBorder(c, minX, maxX, minY, maxY);

    const lerpX = x => lerp(
      minX + borderWidth,
      maxX - borderWidth, x
    );
    const lerpY = y => lerp(
      minY + borderWidth,
      maxY - borderWidth,
      y
    );

    // c.fillStyle = 'white';
    // c.fillRect(
    //   lerpX(0), lerpY(0),
    //   maxX - minX,
    //   0.4 * (maxY - minY)
    // );


    const offsetY = -playhead;
    const linesCount = 80;
    const pointsCount = 40;
    for (let j = 0; j <= linesCount; j++) {
      c.beginPath();
      const lineMinY = lerpY(10 * (j - 1) / (linesCount) + offsetY);
      const lineMaxY = lerpY(10 * (j + 1) / (linesCount) + offsetY);
      const lineMinX = lerpX(-0.01);
      const lineMaxX = lerpX(1.01);

      const lineLerpY = y => lerp(lineMinY, lineMaxY, y);
      const lineLerpX = x => lerp(lineMinX, lineMaxX, x);
      c.moveTo(lineLerpX(0),  lineLerpY(0.5));

      for (let i = 1; i < pointsCount; i += 2) {
        let controlY = (i - 1) % 4 === 0 ? 0 : 1;
        const noiseV = random.noise2D(i, j);
        controlY += .4 * noiseV;

        c.quadraticCurveTo(
          lineLerpX(i / pointsCount + .05 * noiseV),
          lineLerpY(controlY),
          lineLerpX((i + 1) / pointsCount),
          lineLerpY(0.5)
        );
      }

      c.lineWidth = (maxY - minY) * 0.008;
      c.strokeStyle = C_WAVE_FG;
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
    c.lineWidth = 2 * marginX;
    c.strokeStyle = C_FRAME;
    c.stroke();

    const blockHeight = (
      height - (blocks - 1) * gutterY - 2 * marginY
    ) / blocks;

    // drawBlock1(
    //   c,
    //   dividePlayhead(playhead, 3),
    //   minX, maxX,
    //   minY, minY + blockHeight
    // );

    // drawBlock2(
    //   c,
    //   dividePlayhead(playhead, 14),
    //   minX, maxX,
    //   minY + 1 * blockHeight + gutterY,
    //   minY + 2 * blockHeight + gutterY,
    // );

    drawBlock3(
      c,
      playhead * 2,
      minX, maxX,
      minY,
      height - marginY
    );

    const textHeight = 0.09 * width;;
    const line2 = 'SHAKY HANDS';
    c.font = `${textHeight * 1.2}px Arial`;
    const textSize2 = c.measureText(line2);

    const line3 = 'pedal building';
    c.font = `${textHeight * 0.8}px Arial`;
    const textSize3 = c.measureText(line3);

    const line4 = 'workshop';
    const textSize4 = c.measureText(line4);

    c.beginPath();
    c.rect(
      minX + 2 * marginX,
      0.5 * height - 1.5 * textHeight,
      maxX - minX - 4 * marginX,
      4 * textHeight,
    );
    c.closePath();

    c.fillStyle = 'white';
    c.fill();
    c.lineWidth = 0.01 * height;
    c.strokeStyle = C_BLUE;
    c.stroke();


    c.save();
    c.fillStyle = C_BLUE;
    c.shadowColor = C_ORANGE;
    c.shadowBlur = 0;
    c.shadowOffsetX = 0.005 * width;
    c.shadowOffsetY = 0.005 * height;

    c.font = `${textHeight * 1.2}px Arial`;
    c.shadowOffsetX = 0.002 * width;
    c.shadowOffsetY = 0.002 * height;

    c.fillText(
      line2,
      (width - textSize2.width) / 2,
      0.5 * height
    );

    c.font = `${textHeight * 0.8}px Arial`;
    c.fillText(
      line3,
      (width - textSize3.width) / 2,
      0.56 * height
    );

    c.fillText(
      line4,
      (width - textSize4.width) / 2,
      0.6 * height
    );

    c.restore();


    c.globalCompositeOperation = 'difference';

    c.beginPath();
    c.arc(
      0.5 * (maxX - minX) + marginX,
      0.08 * (maxY - minY),
      0.035 * (maxX - minX),
      0,
      Math.PI * 2
    );
    c.closePath();
    c.fillStyle = C_GREY;
    c.fill();

    c.beginPath();
    c.arc(
      0.5 * (maxX - minX) + marginX,
      0.08 * (maxY - minY),
      0.03 * (maxX - minX),
      0,
      Math.PI * 2
    );
    c.closePath();
    c.fillStyle = C_BLUE;
    c.fill();

    c.beginPath();
    c.arc(
      0.2 * (maxX - minX) + marginX,
      0.15 * (maxY - minY),
      0.1 * (maxX - minX),
      0,
      Math.PI * 2
    );
    c.closePath();
    c.fillStyle = C_BLUE;
    c.fill();

    c.beginPath();
    c.arc(
      0.8 * (maxX - minX) + marginX,
      0.15 * (maxY - minY),
      0.1 * (maxX - minX),
      0,
      Math.PI * 2
    );
    c.closePath();
    c.fillStyle = C_BLUE;
    c.fill();

    c.beginPath();
    c.arc(
      0.5 * (maxX - minX) + marginX,
      0.3 * (maxY - minY),
      0.1 * (maxX - minX),
      0,
      Math.PI * 2
    );
    c.closePath();
    c.fillStyle = C_BLUE;
    c.fill();

    c.beginPath();
    c.arc(
      0.5 * (maxX - minX) + marginX,
      0.85 * (maxY - minY),
      0.1 * (maxX - minX),
      0,
      Math.PI * 2
    );
    c.closePath();
    c.fillStyle = C_BLUE;
    c.fill();

    c.beginPath();
    c.arc(
      0.5 * (maxX - minX) + marginX,
      0.85 * (maxY - minY),
      0.08 * (maxX - minX),
      0,
      Math.PI * 2
    );
    c.closePath();
    c.fillStyle = 'white';
    c.fill();

    // const line1 = 'now available';
    // const line2 = 'pedalmarkt.com';
    // const line3 = '';


    // c.font = `${textHeight}px Coolvetica`;
    // c.fillStyle = PINK;
    // c.shadowColor = GREEN;
    // c.shadowBlur = 0;
    // c.shadowOffsetX = 0.005 * width;
    // c.shadowOffsetY = 0.005 * height;

    // const textSize1 = c.measureText(line1);

    // const line1Y = minY + 3.4 * marginY;
    // const line2Y = line1Y + 2.4 * marginY;
    // const line3Y = height - 1.52 * marginY;
    // const lineX = 1.5 * marginX;

    // c.fillText(
    //   line1,
    //   (width - textSize1.width) / 2,
    //   line1Y
    // );

    // c.font = `${textHeight * 1.2}px Coolvetica`;
    // const textSize2 = c.measureText(line2);
    // c.fillStyle = PINK;
    // c.shadowColor = GREEN;
    // c.shadowBlur = 0;
    // c.shadowOffsetX = 0.005 * width;
    // c.shadowOffsetY = 0.005 * height;

    // c.fillText(
    //   line2,
    //   (width - textSize2.width) / 2,
    //   line2Y
    // );

    // c.font = `${textHeight}px Coolvetica`;
    // c.shadowOffsetX = 0;
    // c.shadowOffsetY = 0;
    // c.shadowColor = 'none';

    // const textSize3 = c.measureText(line3);

    // c.save();
    // c.lineJoin = 'round';
    // c.miterLimit = 2;
    // c.strokeStyle = 'white';
    // c.lineWidth = textHeight * 0.1;
    // c.strokeText(
    //   line3,
    //   lineX,
    //   line3Y
    // );
    // c.restore();

    // c.fillStyle = C_FRAME;
    // c.fillText(
    //   line3,
    //   lineX,
    //   line3Y
    // );

    // const sourceX = 0;
    // const sourceY = lerp(0, blooperImg.height, 1.0);
    // const sizeX = blooperImg.width;
    // const sizeY = blooperImg.height;
    // const aspect = sizeX / sizeY;
    // // const newWidth = width / 4;
    // // const newHeight = newWidth / aspect;

    // const newHeight = 0.65 * height - 4 * marginY;
    // const newWidth = aspect * newHeight;

    // const imgX = (width - newWidth) / 2;
    // const imgY = blockHeight;


    // // draw image
    // c.drawImage(
    //   blooperImg,
    //   imgX,
    //   imgY,
    //   newWidth,
    //   newHeight,
    // );
  };
};

canvasSketch(sketch, settings);
