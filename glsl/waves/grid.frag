#ifdef GL_ES
precision highp float;
#endif

#include "./snoise.glsl"
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
  v = min(v * 1.7, vec4(1.0));
  return (1. / float(steps)) * floor(v * float(steps) + 0.5);
}

void main (void) {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    st.x *= aspect;

    float playhead = u_tex0CurrentFrame / u_tex0TotalFrames;
    float playheadWrap = sin(2. * PI * playhead * 0.1);

    vec4 color = vec4(1.0);
    vec4 grid = color;

    // gl_FragColor = min(vec4(color, 1.0), texture2D(u_tex0, st));
    float z = 120.;
    vec2 samplePos = vec2(floor(st.x * z) / z, floor(st.y * z) / z);
    vec4 sample = texture2D(u_tex0, samplePos);
    sample = quantize(sample, 4);
    // sample = vec4((sample.r + sample.g + sample.b) / 3.);


    // float h = step(0.1, fract(st.x * z));
    // float v = step(0.1, fract(st.y * z));

    float h = distance(fract(st.x * z), 0.5);
    float v = distance(fract(st.y * z), 0.5);

    grid = (
      min(v, h) * color
      + 2. * snoise(80. * vec2(st)) * snoise(10000.0 * vec2(st)) * vec4(0.5)
    );

    gl_FragColor = min(sample, grid);
    // gl_FragColor = sample;
}
