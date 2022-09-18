#ifdef GL_ES
precision highp float;
#endif

#include "./lygia/color/luma.glsl"
#include "./lygia/draw/circle.glsl"
#include "./lygia/space/ratio.glsl"
#include "./lygia/color/blend.glsl"
#include "./lygia/color/brightnessContrast.glsl"

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

void main (void) {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 stR = ratio(st, u_resolution);
    float aspect = u_resolution.x / u_resolution.y;
    // st.x *= aspect;

    float gridSize = 120.;
    vec2 samplePos = vec2(
      floor(st.x * gridSize) / gridSize,
      floor(st.y * gridSize) / gridSize
    );
    vec3 color = texture2D(u_tex0, st).rgb;
    vec3 sample = texture2D(u_tex0, samplePos).rgb;
    color = brightnessContrast(color, 0.1, 1.0);
    sample = vec3(luma(sample));
    sample = brightnessContrast(sample, 0.01, 1.5);
    color = vec3(luma(color));
    vec3 circle = vec3(circle(
      fract(stR * gridSize),
      70. / gridSize
    ));
    vec3 circle1 = vec3(step(0.4, distance(sin(0.1 * u_time), fract(st.x * gridSize))));
    vec3 circle2 = vec3(distance(vec2(0.5), fract(st * gridSize)));
    float coef = 0.22;
    color = blendHardMix(
      color,
      float(color.r < coef) * circle1 +
      float(color.r > coef) * circle2,
      0.45
    );
    color = brightnessContrast(color, 0.001, 1.1);
    gl_FragColor = vec4(color, 1.);
}
