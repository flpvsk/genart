
// Copyright Patricio Gonzalez Vivo, 2016 - http://patriciogonzalezvivo.com/
// I am the sole copyright owner of this Work.
//
// You cannot host, display, distribute or share this Work in any form,
// including physical and digital. You cannot use this Work in any
// commercial or non-commercial product, website or project. You cannot
// sell this Work and you cannot mint an NFTs of it.
// I share this Work for educational purposes, and you can link to it,
// through an URL, proper attribution and unmodified screenshot, as part
// of your educational material. If these conditions are too restrictive
// please contact me and we'll definitely work it out.

#ifdef GL_ES
precision highp float;
#endif

#include "./snoise.glsl"
#define PI 3.14159265359

uniform sampler2D   u_buffer0;
uniform sampler2D   u_buffer1;
uniform sampler2D   u_buffer2;
uniform sampler2D   u_buffer3;

uniform vec2        u_resolution;
uniform vec2        u_mouse;
uniform float       u_time;

float random (in float x) {
    return fract(sin(x)*43758.5453123);
}

float random (vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
}

float circleSDF(in vec2 st) {
    return length(st - 0.5) * 2.;
}

float stroke(float x, float size, float w) {
    float d = step(size, x + w * 0.5) - step(size, x - w * 0.5);
    return clamp(d, 0.0, 1.0);
}

float easeExp(float v, float c) {
  return (exp(c * v) - 1.) / (exp(c) - 1.);
}

vec3 easeExp(vec3 v, float c) {
  return (exp(c * v) - 1.) / (exp(c) - 1.);
}

float fnCos(float phase) {
  return 0.5 * (cos(phase) + 1.);
}

float fnSq(float x) {
  float y = 0.;
  for (int k = 1; k < 10; k++) {
    float kf = float(k);
    y += sin(2. * PI * (2. * kf - 1.) * x) / (2. * kf - 1.);
  }
  return 0.5 * (4. / PI * y + 1.);
}

float fnSq2(float x) {
  float pw = 0.5;
  return float(fnCos(x) > pw);
}

float fnSaw(float x) {
  float pw = 0.5;
  return 1. / pw * mod(x, pw);
}

float fnNoise(float x) {
  return 0.5 * (snoise(vec2(x, 0.)) + 1.);
}

float between(float low, float high, float x) {
  return max(0., step(low, x) - step(high, x));
}

float fnComb(float phase) {
  float phaseRand = 0.5 * (snoise(vec2(phase * 0.02, 0.)) + 1.) * 0.09 * phase;
  float waveNoise = 0.5 * (snoise(vec2(0.0, phase * 0.01)) + 1.);

  return (
    between(0.0, 0.3, waveNoise) * fnSq(phaseRand) +
    between(0.3, 0.6, waveNoise) * fnSq2(phaseRand) +
    between(0.6, 0.9, waveNoise) * fnCos(phaseRand) +
    between(0.9, 1.0, waveNoise) * fnNoise(phaseRand)
  );
}

float snNorm(float v1, float v2) {
  return 0.5 * (snoise(vec2(v1, v2)) + 1.);
}

void main() {
    vec3 color = vec3(0.0);
    vec2 st = gl_FragCoord.xy/u_resolution;
    float aspect = u_resolution.x/u_resolution.y;
    // st.x *= aspect;
    float dotSize = 0.003;
    float dotSmooth = 0.0001;
    float phase = 0.5 * u_time;

#ifdef BUFFER_0
    // PING BUFFER
    //
    //  Note: Here is where most of the action happens. But need's to read
    //  te content of the previous pass, for that we are making another buffer
    //  BUFFER_1 (u_buffer1)

    float prePhase = texture2D(u_buffer1, vec2(0.)).r;
    float preVal = texture2D(u_buffer1, vec2(0.)).g;
    float val = 0.1 * fnComb(phase * 4.) + 0.7;
    color = vec3(prePhase, preVal, val);

#elif defined( BUFFER_1 )
    // PONG BUFFER
    //
    //  Note: Just copy the content of the BUFFER0 so it can be
    //  read by it in the next frame
    //
    color = vec3(phase, texture2D(u_buffer0, st).b, 0.);

#elif defined( BUFFER_2 )
    float prePhase = texture2D(u_buffer0, st).r;
    float preVal = texture2D(u_buffer0, st).g;
    float val = texture2D(u_buffer0, st).b;
    vec3 prev = texture2D(u_buffer3, vec2(st.x + 0.001, st.y)).rgb;

    float valSmoothMin = max(0., val - dotSmooth);
    float valSmoothMax = min(1., val + dotSmooth);
    float preValSmoothMin = max(0., preVal - dotSmooth);
    float preValSmoothMax = min(1., preVal + dotSmooth);

    float minY = min(
      smoothstep(valSmoothMin, valSmoothMax, st.y - dotSize / 2.),
      smoothstep(preValSmoothMin, preValSmoothMax, st.y - dotSize / 2.)
    );
    float maxY = max(
      smoothstep(valSmoothMin, valSmoothMax, st.y),
      smoothstep(preValSmoothMin, preValSmoothMax, st.y)
    );
    float dotMin = 0.99 - dotSize * .5;
    float dotMax = 0.99 + dotSize * .5;
    color = // mix
    (
      smoothstep(0.4 - 100. * dotSmooth, 0.6 + 100. * dotSmooth, prev) +
      // prev +
      vec3(
        (
          smoothstep(dotMin, dotMin + dotSmooth, st.x) -
          smoothstep(dotMax - dotSmooth, dotMax, st.x)
        )
        * (maxY - minY)
      )
      // , //* vec3(snNorm(u_time, st.x), snNorm(u_time, st.y), snNorm(u_time, val)),
      // 0.04
    )
    - step(0.999, st.x) * vec3(1.) // right edge margin
    - step(st.x, 0.01) * vec3(1.); // left edge margin

#elif defined( BUFFER_3 )
    color = texture2D(u_buffer2, st).rgb;
#else
    // Main Buffer
    color = (
      texture2D(u_buffer3, st).rgb * 2.0
      * vec3(0.8, 0.2, 0.3)
      // * vec3(1.0, 1.0, 1.0)
    );
#endif
    gl_FragColor = vec4(color, 1.0);
}
