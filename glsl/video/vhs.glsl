
float vhsRand(vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float vhsVerticalBar(float pos, float uvY, float offset)
{
    float range = 0.05;
    float edge0 = (pos - range);
    float edge1 = (pos + range);

    float x = smoothstep(edge0, pos, uvY) * offset;
    x -= smoothstep(pos, edge1, uvY) * offset;
    return x;
}

vec4 vhs(in sampler2D tex, in vec2 st, in float iTime )
{
  float noiseQuality = 250.0;
  float noiseIntensity = 0.0088;
  float offsetIntensity = 0.02;
  float colorOffsetIntensity = 1.3;

	vec2 uv = st;

    for (float i = 0.0; i < 0.71; i += 0.1313)
    {
        float d = mod(iTime * i, 1.7);
        float o = sin(1.0 - tan(iTime * 0.24 * i));
    	o *= offsetIntensity;
        uv.x += vhsVerticalBar(d, uv.y, o);
    }

    float uvY = uv.y;
    uvY *= noiseQuality;
    uvY = float(int(uvY)) * (1.0 / noiseQuality);
    float noise = vhsRand(vec2(iTime * 0.00001, uvY));
    uv.x += noise * noiseIntensity;

    vec2 offsetR = vec2(0.006 * sin(iTime), 0.0) * colorOffsetIntensity;
    vec2 offsetG = vec2(0.0073 * (cos(iTime * 0.97)), 0.0) * colorOffsetIntensity;

    float r = texture2D(tex, uv + offsetR).r;
    float g = texture2D(tex, uv + offsetG).g;
    float b = texture2D(tex, uv).b;

    return vec4(r, g, b, 1.0);
}
