const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const createRegl = require('regl');
const glsl = require('glslify');
const mesh = require('glsl-circular-arc')()

// Setup our sketch
const settings = {
  context: 'webgl',
  animate: true
};


// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  const regl = createRegl({ gl });
  const menu = regl({
    frag: glsl`
      precision highp float;
      #pragma glslify: mask = require('glsl-circular-arc/mask')
      varying vec2 vpos;
      uniform vec2 size, radius;
      uniform vec3 color;
      void main () {
        float m = mask(size, vpos, radius);
        if (m < 0.01) discard;
        gl_FragColor = vec4(color,m);
      }
    `,
    vert: glsl`
      precision highp float;
      #pragma glslify: plot = require('glsl-circular-arc/plot')
      attribute vec2 position;
      uniform vec2 size, theta, translate;
      varying vec2 vpos;
      void main () {
        vpos = plot(position, theta);
        vec2 aspect = vec2(1, size.x / size.y);
        vec2 pos = vpos * aspect * 0.5;
        gl_Position = vec4(
          pos.x + translate.x,
          pos.y + translate.y,
          0,
          1
        );
      }
    `,
    blend: {
      enable: true,
      func: { src: 'src alpha', dst: 'one minus src alpha' }
    },
    uniforms: {
      size: regl.prop('size'),
      theta: regl.prop('theta'),
      radius: regl.prop('radius'),
      color: regl.prop('color'),
      translate: regl.prop('translate'),
    },
    attributes: {
      position: mesh.positions
    },
    elements: mesh.cells,
  });

  return ({ time, width, height }) => {
    regl.poll();

    regl.clear({
      color: [ 0.1, 0.1, 0.1, 1 ]
    });

    const st = Math.sin(time) *0.5 + 0.5;
    const size = [ width, height ];
    menu([
      {
        theta: [2 * Math.PI * Math.sin(time), 2 * Math.PI * Math.sin(time) + 2 * Math.PI / 3 ],
        radius: [0.25, 0.5],
        color: [1, 0, 0.5],
        translate: [ 0, 0 ],
        size,
      },
      {
        theta: [2 * Math.PI * Math.sin(time), 2 * Math.PI * Math.sin(time) + 2 * Math.PI / 3 ],
        radius: [0.24, 0.51],
        color: [1.0, 1.0, 1.0],
        translate: [ 0, 0.1 ],
        size,
      },
    ]);
  };
};

canvasSketch(sketch, settings);
