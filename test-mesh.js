const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');

const settings = {
  dimensions: [ 2048, 2048 ]
};

function mesh() {
  var mesh = { positions: [[0,0]], cells: [] }
  mesh.positions.push([0,1])
  for (var i = 0; i <= 4; i++) {
    mesh.positions.push([i/4*2*Math.PI+Math.PI/4,1])
  }
  for (var i = 2; i < mesh.positions.length; i++) {
    mesh.cells.push([0,i-1,i])
  }
  return mesh
}

const sketch = () => {
  return ({ context, width, height }) => {
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    const m = mesh();
    console.log(m);
    for (let cell of m.cells) {
      const x = lerp(100, width - 100, cell[0]);
      const y = lerp(100, width - 100, cell[1]);
      context.fillStyle = 'red';
      context.arc(x, y, 10, 0, 2 * Math.PI);
      context.fill()
    }
  };
};

canvasSketch(sketch, settings);
