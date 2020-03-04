const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const mat4 = require('gl-mat4');
const createRegl = require('regl');
const glsl = require('glslify');

// const seed = random.getRandomSeed();
// const seed = 631559;
// const seed = 57126;
const seed = '239118';
random.setSeed(seed);
console.log('seed', seed);
// 964465

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true },
  dimensions: [ 1280, 720 ],
  duration: 1000,
};

function* repeat(times, values) {
  while (times > 0) {
    let i = 0;

    while (i < values.length) {
      yield values[i];
      i += 1;
    }

    times -= 1;
  }
}


const bmYellowColor = [ 0.922, 0.702, 0.043, 1];
const bmPinkColor = [ 0.5085, 0.2436, 0.2479,];
// const bgColor = [ 0.086, 0.086, 0.086, 1 ];
const bgColor = [ 0, 0, 0, 1];
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

const sketch = ({ gl }) => {
  const regl = createRegl({ gl });
  // Setup REGL with our canvas context

  const eye = [0, 0, 0];
  const target = [0, 0, 0];
  const view = mat4.lookAt(
    [],
    eye,
    target,
    [0, 1, 0]
  );

  //const projection = mat4.perspectiveFromFieldOfView(
  //  [],
  //  Math.PI / 4,
  //  regl.context('viewportWidth') / regl.context('viewportHeight'),
  //  0.01,
  //  1000.0
  //);

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

  const projection = mat4.ortho(
    [],
    1,
    1,
    1,
    1,
    0.01,
    1000.0
  );

  const drawTriangle = regl({
    vert: `
    precision mediump float;
    uniform mat4 projection, view, model;
    attribute vec3 position, barycentric;

    varying vec3 vBC;
    varying vec3 vPos;

    void main() {
      vBC = barycentric;
      vPos = position;
      gl_Position = projection * view * model * vec4(position, 1);
    }
    `,
    frag: glsl(`
    precision mediump float;

    uniform vec4 mainColor;
    uniform vec4 bgColor;
    uniform float time;

    varying vec3 vBC;
    varying vec3 vPos;

    void main() {
      if (any(lessThan(vBC, vec3(0.004)))) {
        gl_FragColor = mainColor;
      } else {
        // gl_FragColor = mix(
        //   bgColor,
        //   vec4(1.0, 1.0, 1.0, 1.0),
        //   (sin((time + vPos.x + vPos.y + vPos.z) * 0.3) + 1.0) * 0.01
        // );
        gl_FragColor = vec4(bgColor.rgb, 0.2);
      }
    }
    `),
    attributes: {
      position: regl.prop('vertices'),
      barycentric: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    },
    elements: [ 0, 1, 2 ],
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
      view: ({tick}, { time }) => {
        const t = Math.cos(time);
        return mat4.lookAt(
          [],
          [ 20,  20,  20 ],
          [0, 0.0, 0],
          [0, 1, 0]
        )
      },
      projection: ({viewportWidth, viewportHeight}) => mat4.perspective(
        [],
        Math.PI / 4,
        viewportWidth / viewportHeight,
        0.01,
        100
      ),
      model: ({ tick, }, { scale, time, },) => {
        const model = mat4.identity([]);
        const t = time;
        mat4.translate(model, model, [
          0,
          -6.0 * 1 / t ** 2,
          +0.0
        ]);

        mat4.scale(model, model, [
          scale * t,
          scale * t,
          scale * t,
        ]);
        return model;
      },
    },
  });

  function drawPiramid({
    bgColor,
    mainColor,
    time,
    scale,
    min,
    max,
  }) {
    drawTriangle({
      mainColor,
      bgColor,
      time,
      scale,
      vertices: [
        [ min, max, min, ],
        [ min, min, min, ],
        [ min, max, max, ],
      ],
    });

    drawTriangle({
      mainColor,
      bgColor,
      time,
      scale,
      vertices: [
        [ min, max, min, ],
        [ min, min, min, ],
        [ max, max, min, ],
      ],
    });

    drawTriangle({
      mainColor,
      bgColor,
      time,
      scale,
      vertices: [
        [ max, max, min, ],
        [ min, min, min, ],
        [ min, max, max, ],
      ],
    });

    drawTriangle({
      mainColor,
      bgColor,
      time,
      scale,
      vertices: [
        [ min, max, max, ],
        [ min, max, min, ],
        [ max, max, min, ],
      ],
    });
  }


  // Regl GL draw commands
  // ...

  // Return the renderer function
  return {
    render (context) {
      const p = context.playhead;
      let t = (p + Math.abs(Math.sin(100 * p)) * p) * 26.0;
      // Update regl sizes
      regl.poll();

      // Clear back buffer
      regl.clear({
        color: bgColor,
      });

      // Draw meshes to scene
      // drawTriangle({ color: bgColor, scale: 1.2, });


      for (let piramid of piramids) {
        drawPiramid({
          mainColor,
          bgColor,
          time: piramid.timeMult * t + piramid.timeInc,
          scale: piramid.scale,
          min: piramid.min,
          max: piramid.max,
        });
      }

    },
    unload () {
      // Unload sketch for hot reloading
      regl.destroy();
    }
  }
};

canvasSketch(sketch, settings);
