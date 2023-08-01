#ifdef GL_ES
precision highp float;
#endif

#include "./snoise.glsl"
#include "./hard-mix.glsl"
#define PI 3.14159265359

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D   u_tex0;
#ifdef STREAMS_PREVS
uniform sampler2D   u_tex0Prev[STREAMS_PREVS];
#endif
uniform vec2        u_tex0Resolution;
uniform float       u_tex0Time;
uniform float       u_tex0Duration;
uniform float       u_tex0CurrentFrame;
uniform float       u_tex0TotalFrames;
uniform float       u_tex0Fps;

uniform float u_value;

// void main (void) {
//     vec2 st = gl_FragCoord.xy/u_resolution.xy;
//     float aspect = u_resolution.x/u_resolution.y;
//     st.x *= aspect;
//
//     vec3 color = vec3(0.0);
//     color = vec3(st.x, st.y, (1.0+sin(u_time))*0.5);
//
//     if ( u_tex0Resolution != vec2(0.0) ){
//         float imgAspect = u_tex0Resolution.x/u_tex0Resolution.y;
//         vec4 img = texture2D(u_tex0,st*vec2(1.,imgAspect));
//         color = mix(color,img.rgb,img.a);
//     }
//
//     gl_FragColor = vec4(color,1.0);
// }

// takes phase, returns 0 <= y <= 1
float fn1(float x) {
  return 0.5 + sin(x) * 0.5;
}

float fn2(float x) {
  return mod(x, 0.5);
}

float plot(vec2 st, float pct, float w) {
  return (
    smoothstep(pct - w, pct, st.y) -
    smoothstep(pct, pct + w, st.y)
  );
}

float put(float scale, float moveY, float v) {
  return scale * v + moveY;
}

vec4 quantize(vec4 v, int steps) {
  // v = min(v * 1.7, vec4(1.0));
  return min(vec4(1.0), (1. / float(steps)) * floor(v * float(steps) + 0.5));
}

float easeExp(float v, float c) {
  return (exp(c * v) - 1.) / (exp(c) - 1.);
}

vec2 rotate(vec2 p) {
  float phi = PI / 5.4;
  return vec2(
    cos(phi) * p.x - sin(phi) * p.y,
    sin(phi) * p.x + cos(phi) * p.y
  );
}

void main (void) {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    st.x *= aspect;

    float playhead = u_tex0CurrentFrame / u_tex0TotalFrames;
    float playheadWrap = sin(10. * PI * playhead * 0.1) + 1.0;

    st = vec2(st.x, easeExp(st.y, 0.4));
    vec4 color = vec4(1.0);
    vec4 grid = color;

    // gl_FragColor = min(vec4(color, 1.0), texture2D(u_tex0, st));
    float z = 180. * u_value;
    vec2 samplePos = vec2(floor(st.x * z) / z, floor(st.y * z) / z);
    vec4 sample = texture2D(u_tex0, samplePos);
    float sampleAvg = (sample.r + sample.g + sample.b) / 3.;
    sampleAvg = easeExp(sampleAvg, 1.);

    // sample = vec4(sampleAvg);
    // sample = vec4(step(0.1, sampleAvg));

    // sample = exp(sample * 0.1);
    // sample = quantize(sample, 1);
    // sample = vec4((sample.r + sample.g + sample.b) / 3.);


    // float h = step(0.1, fract(st.x * z));
    // float v = step(0.1, fract(st.y * z));

    // float h = distance(fract(st.x * z), 0.5) * 0.5;
    // float v = distance(fract(st.y * z), 0.5) * 0.5;

    // (1. - distance(fract(st.xy * z), vec2(0.5, 0.5)) * exp(sampleAvg * 0.9)) * color

    // grid = (
    // step(0.75,
    //   min(vec4(1.0), (
    //     (1.0 - distance(fract(st.xy * z), vec2(0.5, 0.5)))
    //     * (1.0 - sampleAvg * 0.2)
    //     // * exp(sampleAvg * 0.1)
    //   )) * vec4(1.0) * exp(snoise(10000. * vec2(st)) * 0.02)
    // )
    // );

    grid = (
      step(
        1. - sampleAvg,
        distance(
          fract(rotate(st.xy) * z),
          vec2(0.5, 0.5)
        )
      )
    ) * vec4(1.);

    // float r = 0.1;

    // grid = (
    //   1.0 - smoothstep(
    //     easeExp(sampleAvg, 1.) - r,
    //     easeExp(sampleAvg, 1.) + r,
    //     distance(
    //       fract(st.xy * z),
    //       vec2(0.5, 0.5)
    //     )
    //   )
    // ) * vec4(1.0);

    // gl_FragColor = min(sample, grid);
    gl_FragColor = vec4(blendHardMix(sample.rgb, grid.rgb), 1.);
    // gl_FragColor = sample;
    // gl_FragColor = grid;
}
