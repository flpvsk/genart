#ifdef GL_ES
precision highp float;
#endif

#include "./lygia/color/luma.glsl"
#include "./lygia/draw/circle.glsl"
#include "./lygia/space/ratio.glsl"
#include "./lygia/color/blend.glsl"
#include "./lygia/color/palette.glsl"
#include "./lygia/color/hueShift.glsl"
#include "./lygia/color/brightnessContrast.glsl"
#include "./lygia/generative/snoise.glsl"

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

float plot(vec2 st, float pct, float w) {
  return (
    smoothstep(pct - w, pct, st.y) -
    smoothstep(pct, pct + w, st.y)
  );
}

float put(float scale, float moveY, float v) {
  return scale * v + moveY;
}

vec3 quantize(vec3 v, int steps) {
  // v = min(v * 1.7, vec4(1.0));
  return min(vec3(1.0), (1. / float(steps)) * floor(v * float(steps) + 0.5));
}

float easeExp(float v, float c) {
  return (exp(c * v) - 1.) / (exp(c) - 1.);
}

void main (void) {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 stR = ratio(st, u_resolution);
    float aspect = u_resolution.x / u_resolution.y;
    // st.x *= aspect;

    vec3 color = vec3(0.);
#ifdef BUFFER_0
    vec2 prevPos = vec2(st.x + 2. / u_resolution.x, st.y);
    // prevPos = 1.001 * vec2(st.x, st.y);

    vec3 prev = texture2D(u_buffer1, prevPos).rgb;

    float gridSize = 125.;
    vec2 samplePos = vec2(
      floor(st.x * gridSize) / gridSize,
      floor(st.y * gridSize) / gridSize
    );
    color = texture2D(u_tex0, st).rgb;
    color += (1. - luma(color)) * 0.1 * snoise(st * 880.);
    color += (1. - luma(color)) * 0.025 * snoise(st * 440.);
    color = quantize(color, 12);
    color = brightnessContrast(color, 0.75, 3.2);
    float mask = clamp(luma(color), 0.05, 0.99);
    mask = step(0.05, mask) * mask;
    mask *= 1.0;
    color = mask
      * vec3(80. / 255., 58. / 255., 0.);
      // * (smoothstep(0.3, 0.5, fract((st.y * sin(PI * 0.25) + st.x * cos(PI * 0.25)) * 120.)) + vec3(0.2));

//     color =
//       colorP * mask +
//       float(luma(prev) < 0.3) * step(0.3, fract(st.y * 10.)) * brightnessContrast(prev, 2.6, 1.1) * max(0., (0.9 - mask));
//
//     color =
//       colorP * mask +
//       hueShift(brightnessContrast(prev, 0.00001, 1.6), 0.48) * mask +
//       step(0.3, fract((st.y * sin(PI * 0.25) + st.x * cos(PI * 0.25)) * 240.)) * brightnessContrast(color, 0.2, 1.1) * max(0.0, 0.6 - mask);
//
    // vec3(0.1, 0.2, 0.1),
    // vec3(0.4, 0.3, 0.3),
    // vec3(0.4, 0.03, 0.3),
    // vec3(0.1, 0.8, 0.9)
    // color = palette(
    //   st.x,
    //   vec3(0.3, 0.3, 0.01),
    //   vec3(0.6, 0.1, 0.3),
    //   vec3(0.4, 0.5, 0.3),
    //   vec3(0.1, 0.8, 0.9)
    // );
#elif defined( BUFFER_1 )
    color = texture2D(u_buffer0, st).rgb;
#else
    color = texture2D(u_buffer0, st).rgb;
#endif
    gl_FragColor = vec4(color, 1.);
}
