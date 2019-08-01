const canvasSketch = require('canvas-sketch');
const mat4 = require('gl-mat4');
const createRegl = require('regl');

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true }
};


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
  const projection = mat4.perspective(
    [],
    Math.PI / 4,
    regl.context('viewportWidth') / regl.context('viewportHeight'),
    0.01,
    1000.0
  );

  const drawTriangle = regl({
    vert: `
    precision mediump float;
    uniform mat4 projection, view, model;
    attribute vec3 position;

    varying vec3 pos;

    void main() {
      pos = position;
      gl_Position = projection * view * model * vec4(position, 1);
    }
    `,
    frag: `
    precision mediump float;

    uniform vec4 color;
    varying vec3 pos;

    void main() {
      gl_FragColor = mix(vec4(pos, 1.0), color, 0.7);
    }
    `,
    attributes: {
      position: [
        [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5], // positive z face.
  [+0.5, +0.5, +0.5], [+0.5, +0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], // positive x face
  [+0.5, +0.5, -0.5], [-0.5, +0.5, -0.5], [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], // negative z face
  [-0.5, +0.5, -0.5], [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [-0.5, -0.5, -0.5], // negative x face.
  [-0.5, +0.5, -0.5], [+0.5, +0.5, -0.5], [+0.5, +0.5, +0.5], [-0.5, +0.5, +0.5], // top face
  [-0.5, -0.5, -0.5], [+0.5, -0.5, -0.5], [+0.5, -0.5, +0.5], [-0.5, -0.5, +0.5]  // bottom face
      ],
    },
    uniforms: {
      color: [1, 1, 1, 1],
      view: ({tick}) => {
        const t = 0.01 * tick
        return mat4.lookAt(
          [],
          [5, 5, 5],
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
      model: ({tick}) => {
        const model = [];
        const t = tick * 0.01;
        mat4.identity(model);
        mat4.fromYRotation(model, t * t);
        mat4.translate(
          model,
          model,
          [
            2 * Math.sin(t),
            1 * Math.cos(t),
            0.5 * Math.sin(t),
          ]
        );
        return model;
      },
    },
    count: 4*6,
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
        color: [ 0, 0, 0, 1 ]
      });

      // Draw meshes to scene
      drawTriangle();
    },
    unload () {
      // Unload sketch for hot reloading
      regl.destroy();
    }
  }
};

canvasSketch(sketch, settings);
