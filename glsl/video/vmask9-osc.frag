#ifdef GL_ES
precision highp float;
#endif

#include "./snoise.glsl"

#include "./lygia/space/ratio.glsl"
#include "./lygia/math/decimation.glsl"
#include "./lygia/draw/circle.glsl"
#include "./lygia/draw/tri.glsl"
#include "./lygia/color/luma.glsl"
#include "./lygia/distort/chromaAB.glsl"
#include "./lygia/color/vibrance.glsl"
#include "./lygia/color/hueShift.glsl"
#include "./lygia/color/blend.glsl"
#include "./lygia/color/desaturate.glsl"
#include "./lygia/color/brightnessContrast.glsl"
#include "./lygia/animation/easing.glsl"

// #define PI 3.14159265359

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

uniform sampler2D   u_buffer0;
uniform sampler2D   u_buffer1;

// takes phase, returns 0 <= y <= 1
float fn1(float x) {
  return 0.5 + sin(x) * 0.5;
}

float fn2(float x) {
  return mod(x, 0.5);
}

float n1(float x, float y) {
  return 0.5 * (snoise(vec2(x, y)) + 1.);
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

float quantize(float v, int steps) {
  return min(1., (1. / float(steps)) * floor(v * float(steps) + 0.5));
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

vec3 ht5(vec3 color) {
  vec3 sample = color;
  color = vec3(luma(color));
  vec3 colorBw = color;
  color = brightnessContrast(color, 0.01, 1.1);
  sample = vec3(luma(sample));
  sample = brightnessContrast(sample, 0.01, 1.05);
  color = vec3(luma(color));
  color = blendHardMix(
    color,
    1. - sample,
    0.85
  );
  color = brightnessContrast(color, 0.001, 1.01);
  return color;
}

float up(float v) {
  return 2. * (0.5 - v);
}

vec2 up(vec2 v) {
  return vec2(float(v.x), float(v.y));
}

void main (void) {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    // st.x *= aspect;
    // st = ratio(st, u_resolution);

    float t = 0.00001 * u_tex0CurrentFrame;
    float plNoise = quantize(n1(10. + t * 20., t * 100.), 24);
    float plNoise2 = quantize(n1(t * 1., t * 4.), 32);
    float plNoise3 = quantize(n1(t * 0.1, t * 0.2), 100);
    float plNoise4 = n1(t * 20., t * 100.);
    float plNoise5 = n1(0., t);

    vec4 sample = texture2D(u_tex0, st);
    float gridSize = 100.;
    vec2 samplePos = vec2(
      floor(st.x * gridSize) / gridSize,
      floor(st.y * gridSize) / gridSize
    );

    float playhead = u_tex0CurrentFrame / u_tex0TotalFrames;
    float playheadWrap = quadraticOut(0.5 * (sin(2.2 * PI * playhead) + 1.0));
    float mouseX = u_mouse.x / u_resolution.x;
    float mouseY = u_mouse.y / u_resolution.y;

    vec3 color = vec3(0.);

#ifdef BUFFER_0
    vec2 prevPos = (
      up(vec2(plNoise5, plNoise4)) * 0.1 +
      up(vec2(plNoise5,  plNoise4)) * vec2(st)
    );
    // prevPos = st;

    vec3 prev = texture2D(u_buffer1, prevPos).rgb;

    float mask = step(
      distance(plNoise, mix(fn1(st.x), st.y, plNoise4)),
      mix(luma(sample.rgb) * 1.2, 1. - luma(sample.rgb) * 2.2, plNoise5)
    );
    // color = blendPhoenix(
    //   hueShift(sample.rgb, 0.01) * (1. - mask),
    //   hueShift(prev, 1. + 0.008 * plNoise) * mask
    // );
    color = blendHardMix(
      sample.rgb * mask,
      prev,
      0.1
    );
    // color = mix(
    //   prev.rgb,
    //   sample.rgb,
    //   mask
    // );
    // color = brightnessContrast(color, 0.0001, 0.2);
    // color = brightnessContrast(color, 0.3, 1.2);
    // color = mix(
    //   clamp(color, vec3(0., 0.1, 0.1), vec3(0.2, 0.4, 0.5)),
    //   clamp(color, vec3(0.5, 0.5, 0.4), vec3(0.8, 0.9, 0.9)),
    //   plNoise5
    // );
#elif defined( BUFFER_1 )
    color = texture2D(u_buffer0, st).rgb;
#else
    color = texture2D(u_buffer0, st).rgb;
#endif
    gl_FragColor = vec4(color, 1.);
}
