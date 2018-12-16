const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const glsl = require('glslify');

// Setup our sketch
const settings = {
  context: 'webgl',
  animate: true,
  duration: 6,
  dimensions: [ 512, 512],
};

// Your glsl code
const frag = glsl(`
  precision highp float;

  uniform float time;
  uniform float aspect;
  uniform vec3 colorInp;
  varying vec2 vUv;

  #pragma glslify: noise = require('glsl-noise/simplex/3d');
  #pragma glslify: hsl2rgb = require('glsl-hsl2rgb');

  void main () {
    vec3 colorA = sin(time) * 2.0 + vec3(0.8, 0.0, 0.0);
    vec3 colorB = sin(time) + vec3(0.0, 0.8, 0.0);


    vec2 center = vUv - vec2(0.5, 0.5);
    center.x *= aspect;
    float dist = length(center);

    float alpha = smoothstep(0.35, 0.345, dist);

    vec3 color = mix(colorA, colorB, vUv.x + vUv.y * sin(time));

    float n = noise(vec3(vUv.xy * 4.0, time));

    vec3 color2 = hsl2rgb(
      vUv.x + vUv.y + n * 0.04,
      0.5,
      0.5
    );

    gl_FragColor = vec4(color2, alpha);
    // gl_FragColor = vec4(color, alpha * n);
  }
`);

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  // Create the shader and return it
  return createShader({
    clearColor: '#212121',
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ playhead, time }) => Math.sin(playhead * Math.PI * 2),
      aspect: ({ width, height }) => width / height,
      colorInp: () => [120, 0, 0].map(v => v / 255)
    }
  });
};

canvasSketch(sketch, settings);
