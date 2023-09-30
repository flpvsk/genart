/*
Demo script (supercollider)

(
b = NetAddr.new("127.0.0.1", 8000);
b.sendMsg("/u_dx", 0.001);
b.sendMsg("/u_dy", 0.01);
b.sendMsg("/u_dotsize", 0.9);
b.sendMsg("/u_opacity", 0.999);
b.sendMsg("/u_blend", 0.0);
b.sendMsg("/u_h", 0.8);
b.sendMsg("/u_s", 0.6);
b.sendMsg("/u_l", 1.0);
)
*/


#ifdef GL_ES
precision highp float;
#endif

#include "../halftone/lygia/draw/digits.glsl"
#include "../halftone/lygia/color/blend.glsl"
#include "../halftone/lygia/draw/circle.glsl"
#include "../halftone/lygia/draw/fill.glsl"
#include "../halftone/lygia/sdf/lineSDF.glsl"
#include "../halftone/lygia/color/space/hsv2rgb.glsl"
#include "../halftone/lygia/space/ratio.glsl"
#include "../halftone/lygia/animation/easing.glsl"
#include "../halftone/lygia/generative/snoise.glsl"

uniform sampler2D   u_buffer0;
uniform sampler2D   u_buffer1;
uniform sampler2D   u_buffer2;
uniform sampler2D   u_buffer3;
uniform sampler2D   u_buffer4;

// input textures
uniform sampler2D u_tex0;
uniform vec2 u_tex0Resolution;

uniform float u_dx;
uniform float u_dy;
uniform float u_opacity;
uniform float u_dotsize;
uniform float u_h;
uniform float u_s;
uniform float u_l;
uniform float u_blend;
uniform float u_noise_intensity;
uniform float u_noise_density;

uniform float u_shape_mask;
uniform float u_fb_mask;

uniform vec2 u_fb_displace;
uniform vec2 u_fb_scale;
uniform float u_fb_mix;

uniform vec2        u_resolution;
uniform vec2        u_mouse;
uniform float       u_time;

float bw(float x, float lower, float upper) {
  return step(lower, x) * step(x, upper);
}

float snoise_norm(vec2 st) {
  return 0.5 + 0.5 * snoise(st);
}

void main() {
    vec3 color = vec3(0.0);

    vec2 pixel = 1.0 / u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;

    float dotSize = exponentialIn(u_dotsize);
    float dotSmooth = 0.2 * (u_dx * 0.01);
    float opacity = 1.;

#ifdef BUFFER_0
    // calculate the new value
    vec3 preVal = texture2D(u_buffer3, vec2(0.)).xyz;
    float u_dx_norm = (u_dx - 0.5) * 2.;
    float u_dy_norm = (u_dy - 0.5) * 2.;
    vec3 val = preVal + vec3(u_dx_norm, u_dy_norm, 0.);

    color = vec3(
      mod(val.x + 0.5, 1.) - 0.5,
      mod(val.y + 0.5, 1.) - 0.5,
      0.
    );

#elif defined( BUFFER_1 )
    vec2 pos = texture2D(u_buffer0, vec2(0.)).xy;
    vec2 prevPos = texture2D(u_buffer3, vec2(0.)).xy;
    bool didJump = (
      abs(prevPos.x - pos.x) > 0.5 ||
      abs(prevPos.y - pos.y) > 0.5
    );
    prevPos = float(!didJump) * prevPos + float(didJump) * pos;
    vec4 prev = clamp(texture2D(u_buffer2, st), vec4(-dotSize), vec4(1. + dotSize));

    float line = lineSDF(st, pos + vec2(0.5), prevPos + vec2(0.5))
     + (
       exponentialIn(u_noise_intensity) * u_dotsize *
         snoise_norm(100. * exponentialIn(u_noise_density) * (st - pos))
       );

    float lightness = clamp(1. - (
      u_noise_intensity * snoise_norm(
        exponentialIn(u_noise_density) * 100. * (st - 1.0 * pos)
      )
    ), 0., 1.);

    vec3 line_fill = vec3(fill(line, dotSize));

    color = (
      vec3(0.)
      + bw(u_blend, 0.9, 1.0) * blendSubtract(
        line_fill,
        prev.rgb,
        exponentialOut(prev.a)
      )

      + bw(u_blend, 0.6, 0.9) * blendReflect(
        line_fill,
        prev.rgb,
        exponentialOut(prev.a)
      )

      + bw(u_blend, 0.3, 0.6) * blendNegation(
        line_fill,
        prev.rgb,
        1. * exponentialOut(prev.a)
      )

      + bw(u_blend, 0.0, 0.3) * blendScreen(
        line_fill * lightness,
        clamp(prev.rgb, vec3(0.), vec3(1.)),
        1. * exponentialOut(prev.a)
      )
    ) * hsv2rgb(vec3(u_h, u_s, u_l));

#elif defined( BUFFER_2 )
    color = texture2D(u_buffer1, st).rgb;
    vec3 fbColor = texture2D(
      u_buffer1, u_fb_scale * st + u_fb_displace
    ).rgb;

    color = color * step(
      distance(vec2(0.5, 0.5), st),
      1. - 2. * u_shape_mask
    );

    color = mix(
      color,
      fbColor,
      4. * u_fb_mix
    );

    color = color * step(
      distance(vec2(0.5, 0.5), st),
      1. - 2. * u_fb_mask
    );

    opacity = u_opacity;

#elif defined( BUFFER_3 )
    color = vec3(
      texture2D(u_buffer0, st)[0],
      texture2D(u_buffer0, st)[1],
      0.
    );

#else
    vec2 pos = texture2D(u_buffer0, vec2(0.)).xy;

    vec2 prevPos = texture2D(u_buffer3, vec2(0.)).xy;
    // Main Buffer
    color = (
       vec3(0.2)
      // texture2D(u_tex0, st).rgb,
      + texture2D(u_buffer2, st).rgb
      // - vec3(digits(st,  bw(u_blend, 0.6, 0.9)))
      + vec3(digits(st + vec2(-0.7, -0.1), pos.y))
    );
#endif
    gl_FragColor = vec4(color, opacity);
}
