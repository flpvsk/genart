#ifdef GL_ES
precision highp float;
#endif

#include "./lygia/color/luma.glsl"
#include "./lygia/draw/circle.glsl"
#include "./lygia/draw/digits.glsl"
#include "./lygia/space/ratio.glsl"
#include "./lygia/color/blend.glsl"
#include "./lygia/math/decimate.glsl"
#include "./lygia/color/brightnessContrast.glsl"
#include "./lygia/animation/easing/linear.glsl"
#include "./lygia/generative/voronoise.glsl"

// define PI 3.14159265359

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D   u_tex0;
uniform vec2        u_tex0Resolution;

float tri(in float t) {
  t = mod(t, 1.);

  if (abs(t) <= 0.5) {
    return 2. * linearIn(t);
  }

  if (abs(t) > 0.5) {
    return 2. * linearOut(1. - t);
  }

  return t;
}

float ramp(in float t) {
  t = mod(t, 1.);
  return linearIn(t);
}

void main (void) {
  vec2 st = gl_FragCoord.xy / u_resolution.xy;
  st = ratio(st, u_resolution);
  vec2 texCoord = 0.1 * st;
  float yShift = decimate(ramp(u_time * 0.9), 6.);
  texCoord = vec2(
    texCoord.x + 0.022,
    texCoord.y + 0.03 + yShift
  );
  vec3 texColor = texture2D(u_tex0, texCoord).rgb;

  vec3 color = vec3(st.x, st.y, abs(sin(u_time * 0.01)));
  float n = voronoise(vec2(st.x, st.y + yShift) * 10.0, 0.9, 0.9);
  float circleColor = circle(
    vec2(st.x + 0.015 * n, st.y + 0.1 * yShift),
    .4, .1
  ) * n;
  color = decimate(color, 80.);
  // color = blendOverlay(color, vec3(n), 0.8);
  color = blendOverlay(color, circleColor * vec3(0.4), 0.8);
  color = blendAdd(color, texColor, 0.6);
  // color = color + vec3(digits(st + vec2(-0.7, -0.1), yShift));

  gl_FragColor = vec4(color, 1.);
}
