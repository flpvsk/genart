const canvasSketch = require('canvas-sketch');
const Color = require('canvas-sketch-util/color');
const mat4 = require('gl-mat4');
const createRegl = require('regl');

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: 'webgl',
  // Turn on MSAA
  attributes: { antialias: true },
  dimensions: [ 768, 768 ],
  duration: 1,
};


const colorWhite = colorToVec4('#dddddd');
const colorGrey1 = colorToVec4('#3D3D3D');
const colorGrey0 = colorToVec4('#1B1B1B');
const colorBg = colorToVec4('#121212');


function colorToVec4(c) {
  return Color.parse(c).rgba.map((v, i) => {
    if (i === 3) {
      return v;
    }

    return v / 255.0;
  });
}

const sketch = async ({ gl }) => {
  const regl = createRegl({ gl });
  // Setup REGL with our canvas context

  const drawArc = regl({
    vert: `
    precision mediump float;
    uniform vec2 resolution;
    uniform mat4 projection, view, model;
    attribute vec3 position;

    varying vec3 pos;

    void main() {
      pos = position;
      gl_Position = vec4(position, 1);
    }
    `,
    frag: `
    #define PI 3.14159265359

    precision mediump float;

    uniform vec2 resolution;
    uniform vec4 colorFg;
    uniform vec4 colorBg;
    uniform vec4 colorGuide;
    uniform float time;
    uniform float radius;
    uniform float width;
    varying vec3 pos;

    void main() {
      vec2 st = gl_FragCoord.xy / resolution;

      vec2 xAxis = vec2(1.0, 0.0);
      vec2 yAxis = vec2(0.0, 1.0);
      vec2 stNorm = normalize(st - vec2(0.5));
      // float xAngle = acos(dot(xAxis, stNorm));
      // float yAngle = acos(dot(stNorm, stNorm));

      float xAngle = atan(-stNorm.x, -stNorm.y);
      float targetAngle = 2.0 * PI * time;

      float d = 0.0;
      float base = radius;
      float smooth = 0.004;

      float dMin1 = base - smooth;
      float dMin2 = base;
      float dMax1 = base + width;
      float dMax2 = base + width + smooth;

      float gMin1 = base + width * 0.48 - smooth;
      float gMin2 = base + width * 0.48;
      float gMax1 = base + width * 0.52;
      float gMax2 = base + width * 0.52 + smooth;

      d = distance(st, vec2(0.5, 0.5));
      float fgMix =
        float(xAngle < targetAngle - PI) *
        (
          (1.0 - smoothstep(dMax1, dMax2, d)) *
          smoothstep(dMin1, dMin2, d)
        );

      float guideMix = (
        (1.0 - smoothstep(gMax1, gMax2, d)) *
        smoothstep(gMin1, gMin2, d)
      );

      vec4 guideOrBg = mix(colorBg, colorGuide, guideMix);
      gl_FragColor = mix(guideOrBg, colorFg, fgMix);
    }
    `,
    attributes: {
      position: [
        [ -1.0, -1.0, 0 ],
        [ -1.0, +1.0, 0 ],
        [ +1.0, +1.0, 0 ],
        [ +1.0, -1.0, 0 ],
        [ -1.0, -1.0, 0 ],
        [ +1.0, +1.0, 0 ],
      ],
    },
    uniforms: {
      colorFg: regl.prop('colorFg'),
      colorBg: regl.prop('colorBg'),
      colorGuide: regl.prop('colorGuide'),
      time: regl.prop('time'),
      radius: regl.prop('radius'),
      width: regl.prop('width'),
      resolution: ({viewportWidth, viewportHeight}) => [
        viewportWidth,
        viewportHeight
      ],
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
        // const t = tick * 0.01;
        mat4.identity(model);
        // mat4.fromYRotation(model, t * t);
        // mat4.translate(
        //   model,
        //   model,
        //   [
        //     2 * Math.sin(t),
        //     1 * Math.cos(t),
        //     0.5 * Math.sin(t),
        //   ]
        // );
        return model;
      },
    },
    count: 6,
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
    depth: { enable: false },
  });

  const drawImage = regl({
    frag: `
    precision mediump float;

    uniform sampler2D image;
    uniform vec2 resolution;
    varying vec2 uv;

    void main () {
      vec4 color = texture2D(image, uv);
      float grey = (color.r + color.g + color.b) / 3.0;

      gl_FragColor = vec4(vec3(grey), 1.0);
    }`,

    vert: `
    precision mediump float;
    attribute vec2 position;
    varying vec2 uv;
    void main () {
      uv = position;
      gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
    }`,

    attributes: {
      position: [
        -2, 0,
        0, -2,
        2, 2
      ],
    },

    uniforms: {
      resolution: ({viewportWidth, viewportHeight}) => [
        viewportWidth,
        viewportHeight
      ],

      image: regl.prop('image'),
    },

    count: 3
  });

  const videoEl = document.createElement('video');
  videoEl.autoplay = true;
  videoEl.style.display = 'none';
  document.body.appendChild(videoEl);

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true
  });
  videoEl.srcObject = stream;


  let videoTexture;
  await new Promise((resolve, reject) => {
    videoEl.addEventListener('loadedmetadata', () => {
      console.log('readystate', videoEl.readyState);
      try {
        videoTexture = regl.texture(videoEl);
        console.log('texture set');
        resolve();
      } catch(e) {
        reject(e);
      }
    });
  });

  // Regl GL draw commands
  // ...

  // Return the renderer function
  return {
    render ({ time, playhead }) {
      // Update regl sizes
      regl.poll();

      // Clear back buffer
      regl.clear({
        color: colorBg,
      });
      const width = 0.005;

      drawImage({
        image: videoTexture.subimage(videoEl),
      });

      // Draw meshes to scene
      drawArc({
        time: playhead,
        radius: 0.20,
        width,
        colorFg: colorWhite,
        colorBg: [0, 0, 0, 0],
        colorGuide: colorGrey1,
      });

      drawArc({
        time: playhead,
        radius: 0.14,
        width,
        colorFg: colorWhite,
        colorBg: [0, 0, 0, 0],
        colorGuide: colorGrey1,
      });

      drawArc({
        time: playhead,
        radius: 0.08,
        width,
        colorFg: colorWhite,
        colorBg: [0, 0, 0, 0],
        colorGuide: colorGrey1,
      });
    },
    unload () {
      // Unload sketch for hot reloading
      regl.destroy();
    }
  }
};

canvasSketch(sketch, settings);
