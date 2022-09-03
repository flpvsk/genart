#ifdef GL_ES
precision highp float;
#endif

#include "./snoise.glsl"
#include "./hard-mix.glsl"

#include "./lygia/space/ratio.glsl"
#include "./lygia/space/ratio.glsl"
#include "./lygia/math/decimation.glsl"
#include "./lygia/draw/circle.glsl"
#include "./lygia/draw/tri.glsl"
#include "./lygia/color/luma.glsl"

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

    float playhead = u_tex0CurrentFrame / u_tex0TotalFrames;
    float playheadWrap = sin(10. * PI * playhead * 0.1) + 1.0;

    vec4 sample = texture2D(u_tex0, st);

    vec4 color = vec4(0.);
    float l = 24. * 0.05;

#ifdef BUFFER_0
    vec4 mem = texture2D(u_buffer1, st);
    vec3 memSample = mem.rgb;
    float frame = mem[3];
    if (mod(u_tex0CurrentFrame, l) < 0.1) {
      memSample = texture2D(u_tex0, st).rgb;
      frame = u_tex0CurrentFrame;
    }
    color = vec4(memSample, frame);

#elif defined( BUFFER_1 )
    color = texture2D(u_buffer0, st);
#else
    vec4 mem = texture2D(u_buffer1, st);
    float frame = mem[3];
    float sampled = 0.;
    if (mod(u_tex0CurrentFrame, 24.) < 0.1) {
      sampled = 1.;
    }
    // Main Buffer
    vec4 mouseSample = texture2D(u_buffer0, st);
    // color = mouseSample;
    // color = sample * (1. - distance(sample, mouseSample));
    st = ratio(st, u_resolution);

    float y1 = 0.2;
    float y2 = 0.5;
    sample = vec4(sample.b * 1.2);
    float shape = mix(circle(st, 0.5), tri(st, 0.5), fn1(mod(u_time, 200.)));
    float isFrame = shape * (
      step(1. - y2, st.y)
      * (1. - step(1. - y1, st.y))
    );
    isFrame = shape;

    float isNotFrame = 1. - isFrame;
    color = sample * isNotFrame + vec4(sample.r, 0.04, 0.08, 1.) * isFrame;
    vec3 c = vec3(st.x / st.y);
    c = decimation(c, 20.);
    // c += circle(st, .5);
    color = vec4(c * color.rgb * luma(mouseSample), 1.);
#endif

    gl_FragColor = color;

    // gl_FragColor = grid;
}
