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
  const regl = createRegl({
    gl,
    extensions: [ 'OES_standard_derivatives' ],
  });
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
    Math.PI,
    regl.context('viewportWidth') / regl.context('viewportHeight'),
    0.01,
    1000.0
  );

  const drawTriangle = regl({
    vert: `
    precision mediump float;
    uniform mat4 projection, view, model;
    attribute vec3 aPosition;
    attribute vec3 aDistance;

    varying vec3 vPosition;
    varying vec3 vDistance;

    void main() {
      vPosition = aPosition;
      vDistance = aDistance;
      gl_Position = projection * view * model * vec4(aPosition, 1);
    }
    `,
    frag: `
    #extension GL_OES_standard_derivatives : enable
    precision mediump float;

    uniform vec4 color;
    varying vec3 vPosition;
    varying vec3 vDistance;

    float edgeFactor(){
      vec3 d = fwidth(vDistance);
      vec3 a3 = smoothstep(vec3(0.0), d * 2.5, vDistance);
      return min(min(a3.x, a3.y), a3.z);
    }

    void main() {
      // if (any(lessThan(vDistance, vec3(0.02)))) {
      //   gl_FragColor = vec4(1.0);
      // } else {
      //   gl_FragColor = vec4(vec3(0.0), 1.0);
      // }
      gl_FragColor = vec4(
        mix(
          vec3(1.0),
          vec3(0.0),
          edgeFactor()
        ),
        1.0
      );
    }
    `,
    attributes: {
      aPosition: [
        [-0.5, +0.5, +0.5], [+0.5, +0.5, +0.5], [+0.5, -0.5, +0.5],
        [-0.5, +0.5, +0.5], [-0.5, -0.5, +0.5], [+0.5, -0.5, +0.5]
      ],
      aDistance: [
        [ 0, 100, 1.0 ],
        [ 0, Math.cos(Math.PI / 4), 0],
        [ 1.0, 100, 0 ],

        [ 0, 100, 1.0 ],
        [ 0, Math.cos(Math.PI / 4), 0],
        [ 1.0, 100, 0 ],
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
        Math.PI / 6,
        viewportWidth / viewportHeight,
        0.01,
        100
      ),
      model: ({tick}) => {
        const model = [];
        const t = tick * 0.01;
        mat4.identity(model);
        mat4.fromYRotation(model, t);
        mat4.translate(
          model,
          model,
          [
            0,
            0,
            0,
          ]
        );
        return model;
      },
    },
    count: 6,
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
