const canvasSketch = require('canvas-sketch');
const mat4 = require('gl-mat4');
const createRegl = require('regl');
const glsl = require('glslify');

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true },
  dimensions: [ 1024, 1024 ],
  duration: 60,
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
const bgColor = [ 0.086, 0.086, 0.086, 1 ];
const mainColor = bmYellowColor;

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

    #pragma glslify: noise3 = require('glsl-noise/simplex/3d');
    #pragma glslify: noise4 = require('glsl-noise/simplex/4d');

    uniform vec4 mainColor;
    uniform vec4 bgColor;
    uniform float time;

    varying vec3 vBC;
    varying vec3 vPos;

    void main() {
      vec4 discoColor = mix(
        mainColor,
        bgColor,
        noise3(vec3(vPos.x, vPos.y, vPos.z) * 5.0 * tan(time * 0.6)) + 1.0
      );

      if (any(lessThan(vBC, vec3(0.001)))) {
        gl_FragColor = discoColor;
      } else {
        // gl_FragColor = mix(
        //   bgColor,
        //   vec4(1.0, 1.0, 1.0, 1.0),
        //   (sin((time + vPos.x + vPos.y + vPos.z) * 0.3) + 1.0) * 0.01
        // );
        gl_FragColor = bgColor;
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
    uniforms: {
      mainColor: regl.prop('mainColor'),
      bgColor: regl.prop('bgColor'),
      scale: regl.prop('scale'),
      time: regl.prop('time'),
      view: ({tick}) => {
        const t = Math.cos(0.02 * tick);
        return mat4.lookAt(
          [],
          [ 10 * t,  10 * t + 10,  10 * t  + 10],
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
      model: ({ tick, }, { scale, },) => {
        const model = mat4.identity([]);
        const t = tick * 0.01;
        mat4.translate(model, model, [Math.sin(t), -4.0, +0.0]);
        mat4.rotate(
          model,
          model,
          t,
          [0.0, 1.0, 0.0]
        );
        mat4.scale(model, model, [scale, scale, scale]);
        return model;
      },
    },
  });

  // Regl GL draw commands
  // ...

  // Return the renderer function
  return {
    render ({ time }) {
      // Update regl sizes
      regl.poll();

      // Clear back buffer
      regl.clear({
        color: bgColor,
      });

      // Draw meshes to scene
      // drawTriangle({ color: bgColor, scale: 1.2, });

      drawTriangle({
        mainColor,
        bgColor: [ 0.12, 0.12, 0.12, 1.0 ],
        time,
        scale: 10,
        vertices: [
          [ +0.0, +0.5, +0.0 ],
          [ +0.0, +0.0, +0.0 ],
          [ +0.0, +0.5, +0.5 ],
        ],
      });

      drawTriangle({
        mainColor,
        bgColor: [ 0.07, 0.07, 0.07, 1.0 ],
        time,
        scale: 10,
        vertices: [
          [ +0.0, +0.5, +0.0 ],
          [ +0.0, +0.0, +0.0 ],
          [ +0.5, +0.5, +0.0 ],
        ],
      });

      drawTriangle({
        mainColor,
        bgColor: [ 0.1, 0.1, 0.1, 1.0 ],
        time,
        scale: 10,
        vertices: [
          [ +0.5, +0.5, +0.0 ],
          [ +0.0, +0.0, +0.0 ],
          [ +0.0, +0.5, +0.5 ],
        ],
      });

      drawTriangle({
        mainColor,
        bgColor: [ 0.08, 0.08, 0.08, 1.0 ],
        time,
        scale: 10,
        vertices: [
          [ +0.0, +0.5, +0.5 ],
          [ +0.0, +0.5, +0.0 ],
          [ +0.5, +0.5, +0.0 ],
        ],
      });

    },
    unload () {
      // Unload sketch for hot reloading
      regl.destroy();
    }
  }
};

canvasSketch(sketch, settings);
