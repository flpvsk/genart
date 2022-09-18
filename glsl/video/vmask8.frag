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

void main (void) {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    // st.x *= aspect;
    // st = ratio(st, u_resolution);

    vec4 sample = texture2D(u_tex0, st);

    float playhead = u_tex0CurrentFrame / u_tex0TotalFrames;
    float playheadWrap = quadraticOut(0.5 * (sin(2.2 * PI * playhead) + 1.0));
    float mouseX = u_mouse.x / u_resolution.x;
    float mouseY = u_mouse.y / u_resolution.y;

    vec3 color = vec3(0.);

#ifdef BUFFER_0
    vec3 prev = texture2D(u_buffer1, vec2(st.x, st.y)).rgb;
    float plNoise = quantize(n1(playhead * 20., playhead * 100.), 8);
    float plNoise2 = quantize(n1(playhead * 1., playhead * 4.), 18);

    float mask = step(
      mod(
        distance(0.5, 1. - mod(st.x, fn1(st.y + plNoise))),
        distance(0.5, 0.9 * plNoise)
      ),
      mix(luma(sample.rgb) * 1.2, 1. - luma(sample.rgb) * 8.2, plNoise)
    );
    color = blendAdd(
      hueShift(sample.rgb, 0.01) * mask,
      hueShift(prev, 1. + 0.008 * plNoise) * (1. - mask)
    );
#elif defined( BUFFER_1 )
    color = texture2D(u_buffer0, st).rgb;
#else
    color = texture2D(u_buffer0, st).rgb;
#endif
    gl_FragColor = vec4(color, 1.);
}
