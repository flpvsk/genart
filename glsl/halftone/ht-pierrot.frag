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
#include "./lygia/generative/pnoise.glsl"
#include "./lygia/generative/snoise.glsl"
#include "../video/vhs.glsl"

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

uniform sampler2D   u_tex1;

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

vec4 quantize(vec4 v, int steps) {
  // v = min(v * 1.7, vec4(1.0));
  return min(vec4(1.0), (1. / float(steps)) * floor(v * float(steps) + 0.5));
}

float easeExp(float v, float c) {
  return (exp(c * v) - 1.) / (exp(c) - 1.);
}

vec2 lim(vec2 v) {
  return clamp(v, vec2(0.), vec2(1.));
}

void main (void) {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 stR = ratio(st, u_resolution);
    float aspect = u_resolution.x / u_resolution.y;
    // st.x *= aspect;

    vec3 color = vec3(0.);
#ifdef BUFFER_0
    float t_n = 0.05 * u_time;
    vec2 n = vec2(snoise(vec3(0., st.x, t_n)), snoise(vec3(1., st.y, t_n)));
    vec2 prevPos = st + 0.02 * n;
    // prevPos = 1.001 * vec2(st.x, st.y);
    // prevPos = st;

    vec3 prev = texture2D(u_buffer1, prevPos).rgb;

    float gridSize = 105.;
    vec2 samplePos = vec2(
      floor(st.x * gridSize) / gridSize,
      floor(st.y * gridSize) / gridSize
    );
    vec2 move = n * 0.000;
    color = texture2D(u_tex0, lim(st + move)).rgb;
    vec3 sample = color;
    float origMask = texture2D(u_tex1, lim(st + move)).r;
    float shift = 2. * (0.5 - snoise(fn1(0.1 * u_time) * st));

    color =
      color * (1. - origMask) +
      color * origMask +
      hueShift(brightnessContrast(prev, -0.20, 1.20), 0.5 * fn1(0.1 * u_time) + 0.5 * shift);

    color = palette(
      easeExp(luma(color), 0.08),
      vec3(0.2, 0.3, 0.01),
      vec3(0.6, 0.1, 0.3),
      vec3(0.4, 0.5, 0.3),
      vec3(0.1, 0.8, 0.9)
    );

    color =
      color + brightnessContrast(sample, 0., 2. + (n.x + n.y) * 0.5) * origMask;

#elif defined( BUFFER_1 )
    color = texture2D(u_buffer0, st).rgb;
    // color = vhs(u_buffer0, st, u_time).rgb;
#else
    color = texture2D(u_buffer0, st).rgb;
    // color = vhs(u_buffer0, st, 0.8 * u_time).rgb;
#endif
    gl_FragColor = vec4(color, 1.);
}
