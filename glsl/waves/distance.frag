#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_buffer0;
uniform sampler2D u_buffer1;

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_frame;

uniform sampler2D u_tex0;
uniform vec2 u_tex0Resolution;


// takes phase, returns 0 <= y <= 1
float fn1(float x) {
  return 0.5 + sin(x) * 0.5;
}

float fn2(float x) {
  float cutoff = 0.45;
  float range = 0.5 - cutoff;
  x = mod(x * 0.1, 0.5);
  if (x > cutoff) {
    return (
      cutoff * smoothstep(0.2, 0.8, 1.0 - ((x - cutoff) / range))
    ) * 2.0;
  }
  return x * 2.0;
}

float fn2_y(float y) {
  if (y > 0.5) return 1.0;
  return y;
}

// float plot(vec2 st, float pct, float w) {
//   return (
//     smoothstep(pct - w, pct, st.y) -
//     smoothstep(pct, pct + w, st.y)
//   );
// }

float put(float scale, float moveY, float v) {
  return scale * v + moveY;
}

float plot(vec2 st, float v) {
  float d = distance(st.y, v);
  float th = 0.01;
  if (d <= th) return 1.0 - d * 1.0 / th;
  return 0.0;
}

void main (void) {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec3 color = vec3(0.0);

#ifdef BUFFER_0
    // PING BUFFER
    float prev = texture2D(u_buffer1, st).x;

    float v0 = put(0.2, 0.7, fn2(10.0 * st.x + u_time * 0.3));
    float v1 = put(0.2, 0.3, fn1(10.0 * st.x + u_time * 0.3));
    color = vec3(plot(st, v0) + plot(st, v1), prev, 0.0);

    float mixCoef = tan(u_time / 2.0);

    color = vec3(mix(color.x, prev, mixCoef), prev, 0.0);

    bool shouldRecord = mod(floor(u_time * 100.0), 40.0) == 0.0;
    if (shouldRecord) {
      color = vec3(color.x);
    }

#elif defined( BUFFER_1 )
    // PONG BUFFER
    //
    //  Note: Just copy the content of the BUFFER0 so it can be
    //  read by it in the next frame
    //

    color = vec3(texture2D(u_buffer0, st).y);

#else
    // Main Buffer
    color = vec3(texture2D(u_buffer0, st).x);
#endif

    gl_FragColor = vec4(color, 1.0);
}
