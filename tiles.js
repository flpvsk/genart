import haltonSeq from './haltonSequence';
import canvasSketch from 'canvas-sketch';
import { lerp, wrap, clamp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';
import load from 'load-asset';

function getBaseLog(base, x) {
  return Math.log(x) / Math.log(base);
}

const settings = {
  dimensions: [ 1024, 1024 ],
  // dimensions: [ 608, 1080, ],
  // dimensions: [ 1200, 628 ],
  // animate: true,
  // duration: 15,
};

let seed = random.getRandomSeed();
console.log('seed', seed);
random.setSeed(seed);

function pointOnCirlce(centerX, centerY, radius, angle) {
  return [
    centerX + Math.cos(angle) * radius,
    centerY + Math.sin(angle) * radius
  ];
}

const C1 = {
  guide0: 'hsla(0, 0%, 20%, 0)',
  guide1: 'hsla(0, 0%, 80%, 0)',
  guide2: 'hsla(0, 0%, 60%, 1)',
  guide3: 'hsla(0, 80%, 80%, 1)',
  guide4: 'hsla(100, 80%, 80%, 1)',
};

const C2 = {
  guide0: 'hsla(0, 0%, 20%, 1)',
  guide1: 'hsla(0, 0%, 20%, 1)',
  guide2: 'hsla(0, 0%, 20%, 1)',
  guide3: 'hsla(0, 0%, 20%, 1)',
  guide4: 'hsla(0, 0%, 20%, 1)',
};


const C = C1;

function clipOrRestore(c, p) {
  if (p > 0.5) {
    c.clip();
    c.save();
  }

  if (p <= 0.5) {
    c.restore();
  }
}

const sketch = async ({ width, height }) => {
  const maxDimension = Math.max(width, height);
  const marginX = 0.2 * maxDimension;
  const marginY = 0.2 * maxDimension;

  function drawTile(c, pos, minX, maxX, minY, maxY) {
    c.lineWidth = 0.005 * (maxX - minX);
    c.strokeStyle = C.guide1;
    c.strokeRect(minX, minY, maxX - minX, maxY - minY);

    const centerX = minX + (maxX - minX) / 2;
    const centerY = minY + (maxY - minY) / 2;
    const radius = Math.min(
      (maxX - minX) / 2,
      (maxY - minY) / 2
    );

    c.beginPath();
    c.arc(
      centerX,
      centerY,
      radius,
      0, 2 * Math.PI
    );
    c.strokeStyle = C.guide0;
    c.stroke();

    const foldsCount = 4;
    for (let i = 0; i < foldsCount; i++) {
      const angle = i * Math.PI / foldsCount;

      let x1;
      let x2;
      let y1;
      let y2;


      if (angle >= Math.PI / 4 && angle <= 3 * Math.PI / 4) {
        x1 = minX;
        y1 = centerY + radius / Math.tan(angle + Math.PI);
        x2 = maxX;
        y2 = centerY - radius / Math.tan(angle + Math.PI);
      }

      if (angle < Math.PI / 4 || angle > 3 * Math.PI / 4) {
        x1 = centerY + radius * Math.tan(angle + Math.PI);
        y1 = minY;
        x2 = centerY - radius * Math.tan(angle + Math.PI);
        y2 = maxY;
      }

      if (angle === 0) {
        x1 = minX + (maxX - minX) / 2;
        y1 = minY;
        x2 = x1;
        y2 = maxY;
      }

      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      // c.lineWidth = 0.0025 * (maxX - minX);
      c.strokeStyle = C.guide1;
      c.stroke();
    }


    const cornersX = [ 0, 1, 1, 0 ];
    const cornersY = [ 0, 0, 1, 1 ];
    // circles from the corners of the square
    // for (let i = 0; i < 4; i++) {
    //   const centerX = lerp(minX, maxX, cornersX[i]);
    //   const centerY = lerp(minY, maxY, cornersY[i]);
    //   c.beginPath();
    //   c.arc(
    //     centerX,
    //     centerY,
    //     radius,
    //     i * Math.PI / 2,
    //     (i + 1) * Math.PI / 2
    //   );
    //   c.strokeStyle = C.guide3;
    //   // c.stroke();
    // }
    // c.closePath();
    // c.clip();

    const midPointsX = [ 0.5, 1.0, 0.5, 0.0 ];
    const midPointsY = [ 0.0, 0.5, 1.0, 0.5 ];
    const patternCenterX = minX + (maxX - minX) / 2;
    const patternCenterY = minY + (maxY - minY) / 2;
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const point1X = lerp(minX, maxX, midPointsX[i]);
      const point1Y = lerp(minY, maxY, midPointsY[i]);
      const point2X = lerp(minX, maxX, midPointsX[(i + 1) % 4]);
      const point2Y = lerp(minY, maxY, midPointsY[(i + 1) % 4]);
      c.moveTo(point1X, point1Y);

      c.quadraticCurveTo(
        patternCenterX,
        patternCenterY,
        point2X,
        point2Y
      );
      c.lineTo(point2X, point2Y);
      // c.stroke();
    }
    // c.closePath();
    c.strokeStyle = C.guide3;
    c.stroke();
    // c.clip();

    // circle from the center of the square
    for (let i = 0; i < 2; i++) {
      const centerX = minX + (maxX - minX) * 0.5;
      const centerY = i === 0 ? minY : maxY;
      c.beginPath();
      c.arc(centerX, centerY, radius, i * Math.PI, (i + 1) * Math.PI);
      c.strokeStyle = C.guide3;
      c.stroke();
    }

    for (let i = 0; i < 2; i++) {
      const centerY = minY + (maxY - minY) * 0.5;
      const centerX = i === 0 ? minX : maxX;
      c.beginPath();
      c.arc(
        centerX,
        centerY,
        radius,
        i * Math.PI - Math.PI / 2,
        (i + 1) * Math.PI - Math.PI / 2
      );
      c.strokeStyle = C.guide3;
      c.stroke();
      // c.fill();
    }


    // for (let point of splitFragment(1, 0.5)) {
    //   c.beginPath();
    //   const incX = lerp(0, maxX - minX, point);
    //   c.moveTo(minX + incX, minY);
    //   c.lineTo(maxX - incX, maxY);
    //   c.lineWidth = 0.0025 * (maxX - minX);
    //   c.strokeStyle = C.guide1;
    //   c.stroke();
    // }

    // for (let point of splitFragment(1, 0.5)) {
    //   c.beginPath();
    //   const incY = lerp(0, maxY - minY, point);
    //   c.moveTo(minX, minY + incY);
    //   c.lineTo(maxX, maxY - incY);
    //   c.lineWidth = 0.0025 * (maxX - minX);
    //   c.strokeStyle = C.guide1;
    //   c.stroke();
    // }
  }

  return ({ context, width, height, playhead, }) => {
    const c = context;

    c.fillStyle = 'white';
    c.fillRect(0, 0, width, height);

    drawTile(
      c, 1,
      marginX, width - marginX,
      marginY, height - marginY
    );
  };
};

canvasSketch(sketch, settings);
