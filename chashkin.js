const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const mat4 = require('gl-mat4');
const createRegl = require('regl');
const glsl = require('glslify');

const seed = random.getRandomSeed();
// const seed = 631559;
// const seed = 57126;
random.setSeed(seed);
console.log('seed', seed);
// 964465

const settings = {
  // Make the loop animated
  animate: false,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true },
  dimensions: [ 1800, 1800 ],
  duration: 60,
};


const bmYellowColor = [ 0.922, 0.702, 0.043, 1];
const bmPinkColor = [ 0.5085, 0.2436, 0.2479, 1];
const white = [ 1, 1, 1, 1 ];
const black = [ 0.086, 0.086, 0.086, 1 ];
const bgColor = black;
const mainColor = bmYellowColor;



const piramidsCount = random.rangeFloor(10, 20);
const piramids = [];
for (let i = 0; i < piramidsCount; i++) {
  const min = random.range(-1.0, +1.0);
  piramids.push({
    scale: random.rangeFloor(1, 20),
    min: min,
    max: min + 0.5,
    timeInc: random.rangeFloor(-100, 100),
    timeMult: random.rangeFloor(1, 10),
  });
}

function donutVerticies(n, ratio) {
  const arr = [];
  const r1 = 0.5;
  const r2 = r1 * ratio;
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 0; i < l; i += inc) {
    arr.push([ Math.cos(i) * r1, Math.sin(i) * r1, 0.0]);
    arr.push([ Math.cos(i) * r2, Math.sin(i) * r2, 0.0]);
  }
  return arr;
}

function donutElements(n) {
  const arr = [];
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 2; i < 2 * n; i++) {
    arr.push([i - 2, i - 1, i ]);
  }
  arr.push([2 * n - 2, 2 * n - 1, 0 ]);
  arr.push([ 0, 1, 2 * n - 1 ]);
  return arr;
}

function donutVerticies3d(n, ratio) {
  const arr = [];
  const r1 = 0.5;
  const r2 = r1 * ratio;
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 0; i < l; i += inc) {
    arr.push([ Math.cos(i) * r1, Math.sin(i) * r1, -0.5]);
    arr.push([ Math.cos(i) * r2, Math.sin(i) * r2, -0.5]);
  }

  for (let i = 0; i < l; i += inc) {
    arr.push([ Math.cos(i) * r1, Math.sin(i) * r1, +0.5]);
    arr.push([ Math.cos(i) * r2, Math.sin(i) * r2, +0.5]);
  }
  return arr;
}

function donutElements3d(n) {
  const arr = [];
  const l = 2 * Math.PI;

  // bottom
  for (let i = 2; i < 2 * n; i++) {
    arr.push([i - 2, i - 1, i ]);
  }

  arr.push([2 * n - 2, 2 * n - 1, 0 ]);
  arr.push([ 0, 1, 2 * n - 1 ]);

  // top
  for (let i = 2 * n + 2; i < 4 * n; i++) {
    arr.push([i - 2, i - 1, i ]);
  }

  arr.push([ 4 * n - 2, 4 * n - 1, 2 * n ]);
  arr.push([ 2 * n, 2 * n + 1, 4 * n - 1 ]);

  // sides
  for (let i = 0; i < 2 * n + 3; i += 2) {
    const d = 2 * n;
    const first = (i + 3) % (2 * n);
    const second = (i + 1) % (2 * n);
    arr.push([ first, second, first + d ]);
    arr.push([ first + d, second + d, second ]);
  }

  for (let i = 1; i < 2 * n + 3; i += 2) {
    const d = 2 * n;
    const first = (i + 3) % (2 * n);
    const second = (i + 1) % (2 * n);
    arr.push([ first, second, first + d ]);
    arr.push([ first + d, second + d, second ]);
  }

  return arr;
}

function circleVerticies(n) {
  const arr = [ [0, 0, 0], ];
  const r = 0.5;
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 0; i < l; i += inc) {
    arr.push([ Math.cos(i) * r, Math.sin(i) * r, 0.0]);
  }
  return arr;
}

function circleElements(n) {
  const arr = [];
  const l = 2 * Math.PI;
  const inc = l / n;
  for (let i = 2; i < n + 1; i++) {
    arr.push([i - 1, 0, i]);
  }
  arr.push([ 0, 1, n ]);
  return arr;
}


const nVerticies = 50;
const radiusRatio = 0.6;

const sketch = ({ gl }) => {
  const regl = createRegl({ gl });
  // Setup REGL with our canvas context

  // const projection = mat4.perspectiveFromFieldOfView(
  //   [],
  //   Math.PI / 2,
  //   regl.context('viewportWidth') / regl.context('viewportHeight'),
  //   0.01,
  //   1000.0
  // );

  // const projection = mat4.perspectiveFromFieldOfView(
  //   [],
  //   {
  //     upDegrees: Math.PI / 59,
  //     downDegrees: Math.PI / 59,
  //     leftDegrees: Math.PI / 20,
  //     rightDegrees: Math.PI / 20,
  //   },
  //   0.01,
  //   1000.0
  // );


  const drawShape = regl({
    vert: `
    precision mediump float;
    uniform mat4 projection, view, model;
    attribute vec3 position;

    varying vec3 vPos;

    void main() {
      vPos = position;
      gl_Position = projection * view * model * vec4(position, 1);
      // gl_Position = model * vec4(position, 1);
      // gl_Position = vec4(position, 1);
    }
    `,
    frag: glsl(`
    precision mediump float;

    uniform vec4 mainColor;

    varying vec3 vPos;

    void main() {
      gl_FragColor = mainColor;
      // gl_FragColor = vec4(vPos, 1.0);
    }
    `),
    attributes: {
      position: (context, { radiusRatio, nVerticies }) => {
        return donutVerticies3d(nVerticies, radiusRatio);
      },
    },
    elements: (context, { nVerticies }) => donutElements3d(nVerticies),
    blend: {
      enable: true,
      func: {
        srcRGB: 'src alpha',
        srcAlpha: 1,
        dstRGB: 'one minus src alpha',
        dstAlpha: 1
      },
      equation: {
        rgb: 'add',
        alpha: 'add'
      },
      color: [0, 0, 0, 0]
    },
    uniforms: {
      mainColor: regl.prop('mainColor'),
      bgColor: regl.prop('bgColor'),
      scale: regl.prop('scale'),
      time: regl.prop('time'),
      view: mat4.lookAt(
        [],
        [ 0,  0,  2 ],  // eye
        [0, 0.0, 0],    // target
        [0, 1, 0]
      ),
      projection: ({viewportWidth, viewportHeight}) => {

        return mat4.ortho(
          [],
          -1, 1,
          -1, 1,
          0.01,
          1000.0
        );

        // return mat4.perspective(
        //   [],
        //   Math.PI / 4,
        //   viewportWidth / viewportHeight,
        //   0.01,
        //   100
        // );
      },
      model: ({ tick, }, {
        scale,
        rotate,
        translate,
      },) => {
        const model = mat4.identity([]);
        mat4.rotateX(model, model, rotate[0]);
        mat4.rotateY(model, model, rotate[1]);
        mat4.rotateZ(model, model, rotate[2]);
        mat4.scale(model, model, scale);
        mat4.translate(model, model, translate);
        return model;
      },
    },
  });

  // Regl GL draw commands
  // ...

  // Return the renderer function
  return {
    render ({ playhead }) {
      let t = playhead;
      // t = 0.25;
      // Update regl sizes
      regl.poll();

      // Clear back buffer
      regl.clear({
        color: bgColor,
      });

      // Draw meshes to scene
      drawShape({
        mainColor,
        bgColor,
        nVerticies: 4,
        radiusRatio: 0.5,
        scale: [4, 1, 0.03],
        rotate: [ t * Math.PI * 2 + Math.PI / 2, -Math.PI / 4.3, 0],
        translate: [ 0, 0, 0.6],
        time: t,
      });

      drawShape({
        mainColor,
        bgColor,
        nVerticies: 100,
        radiusRatio: 0.7,
        scale: [ 0.6, 0.6, 3],
        rotate: [ t * Math.PI * 2 + 0, 0, 0],
        translate: [ -1, 0.8, 0],
        time: t,
      });

      drawShape({
        mainColor,
        bgColor,
        nVerticies: 5,
        radiusRatio: 0.5,
        scale: [ 0.6, 0.6, 0.6],
        rotate: [ t * Math.PI * 2 + 0, 0, 0],
        translate: [ 0.2, -1, 1],
        time: t,
      });

    },
    unload () {
      // Unload sketch for hot reloading
      regl.destroy();
    }
  }
};

canvasSketch(sketch, settings);
