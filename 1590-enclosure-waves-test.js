const canvasSketch = require('canvas-sketch');
const { renderPolylines } = require('canvas-sketch-util/penplot');
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');
const eases = require('eases')

import { lerp, wrap, clamp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';


let seed = random.getRandomSeed();
console.log('seed', seed);
random.setSeed(seed);

const settings = {
  dimensions: [115.23, 60.01],
  orientation: 'portrait',
  pixelsPerInch: 300,
  scaleToView: true,
  units: 'mm',
};

function distance(p1, p2) {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
}

const sketch = ({ width, height }) => {
  // List of polylines for our pen plot
  let lines = [];
  const cols = random.rangeFloor(5, 20);
  const rows = random.rangeFloor(7, 40);
  const colPos = []
  for (let i = 0; i < cols; i++) {
    colPos[i] = (i + 0.5) / cols + random.range(
      0,
      +1 / (2 * cols)
    )
  }
  const breakingPoint = [ random.value(), random.value() ]

  let prevLineY = []
  for (let r = 1; r < rows - 1; r++) {
    const line = []
    for (let c = 0; c < cols; c++) {
      const prevY = prevLineY[c] ?? 0
      const mult = 500
      const coef = eases.expoIn(
        distance([c / cols, r / rows], breakingPoint)
      )
      const y = coef * prevY + random.range(
        -1 / (coef * mult * rows), 1 / (coef * mult * rows)
      )
      line.push([colPos[c], r / rows + y]);
      prevLineY[c] = y
    }
    lines.push(line)
  }
  console.log(lines)


  // Draw some circles expanding outward
  // const steps = 4;
  // const count = 1;
  // const spacing = Math.min(width, height) * 0.05;
  // const radius = Math.min(width, height) * 0.01;
  // for (let j = 0; j < count; j++) {
  //   const r = radius + j * spacing;
  //   const circle = [];
  //   for (let i = 0; i < steps; i++) {
  //     const t = i / Math.max(1, steps - 1);
  //     const angle = Math.PI * 2 * t;
  //     circle.push([
  //       width / 2 + Math.cos(angle) * r,
  //       height / 2 + Math.sin(angle) * r
  //     ]);
  //   }
  //   lines.push(circle);
  // }
  lines = lines.map(line => line.map(point => [
    lerp(0, width, point[0]),
    lerp(0, height, point[1]),
  ]))
  console.log(lines)

  // Clip all the lines to a margin
  const margin = 1.0;
  const box = [ margin, margin, width - margin, height - margin ];
  lines = clipPolylinesToBox(lines, box);

  // The 'penplot' util includes a utility to render
  // and export both PNG and SVG files
  return props => renderPolylines(lines, props);
};

canvasSketch(sketch, settings);

