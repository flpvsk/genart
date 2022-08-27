#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;

uniform sampler2D u_tex0;
uniform vec2 u_tex0Resolution;

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

float fnSq(float x) {
  float y = 0.;
  for (int k = 1; k < 10; k++) {
    float kf = float(k);
    y += sin(2. * PI * (2. * kf - 1.) * x) / (2. * kf - 1.);
  }
  return 4. / PI * y;
}

float plot(vec2 st, float pct, float w) {
  return (
    smoothstep(pct - w, pct, st.y) -
    smoothstep(pct, pct + w, st.y)
  );
}

float plot2(vec2 st, float pct, float w) {
  float grad = 0.002;
  return 1. - smoothstep(w - grad, w + grad, distance(st, vec2(st.x, pct)));
}

float put(float scale, float moveY, float v) {
  return scale * v + moveY;
}

void main (void) {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / u_resolution.y;
    st.x *= aspect;

    vec3 color = vec3(0.0);
    float fnXNorm = put(0.2, 0.75, fnSq(st.x * 2.0));
    float fnXLessOneNorm = put(0.2, 0.75, fn2((st.x - 0.1) * 2.0));
    float fnXPlusOneNorm = put(0.2, 0.75, fn2((st.x + 0.1) * 2.0));
    float w = 0.002;
    // float c = (
    //   smoothstep(fnXNorm - w, fnXNorm, st.y) -
    //   smoothstep(fnXNorm, fnXNorm + w, st.y)
    // );
    // color = vec3(c, c - 0.2, c + 0.2);

    float vert = float(
      st.x == 0.5 &&
      st.y > fnXLessOneNorm &&
      st.y < fnXPlusOneNorm
    );
    float pct = plot2(st, fnXNorm, w);
    color = pct * vec3(0.0, 1.0, 0.0) + vert * vec3(1.0, 0.0, 0.0);

    gl_FragColor = vec4(color,1.0);
}
