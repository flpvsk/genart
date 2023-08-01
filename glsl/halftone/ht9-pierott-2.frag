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
#include "./lygia/generative/worley.glsl"

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
    float s = 480.;
    // vec3 c = brightnessContrast(color, 0.01, 2.6);
    vec3 c = color;
    color += (1. - luma(c)) * 0.3 * snoise(st * s);
    color += (1. - luma(c)) * 0.15 * snoise(st * s * 0.5);
    color += (1. - luma(c)) * 0.075 * snoise(st * s * 0.25);
    // color = quantize(color, 6);
    // float mask = clamp(luma(color), 0.2, 0.92);
    float mask = clamp(color.r, 0.2, 0.92);
    // float mask = luma(color);
    mask *= 1.0;
    color = mask
      * vec3(80. / 255., 58. / 255., 0.);
#elif defined( BUFFER_1 )
    color = texture2D(u_buffer0, st).rgb;
#else
    color = texture2D(u_buffer0, st).rgb;
#endif
    gl_FragColor = vec4(color, 1.);
}
