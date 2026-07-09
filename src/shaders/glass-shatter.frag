#version 300 es
precision highp float;

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform float uProgress;
uniform vec2 uResolution;

in vec2 vUv;
out vec4 fragColor;

// Glass-shatter transition.
// uFrom cracks into voronoi shards that break loose (staggered), slide away under
// gravity, and fade — revealing uTo underneath. A bright crack highlight runs along
// the shard borders as they separate.
//
// SOURCE-AGNOSTIC (by design, Codex T5): samples only uFrom/uTo/uResolution and makes
// no assumption about which chapter is on either side. Its canonical home is
// flat → figma-era; it debuts as a temporary early-web → figma-era bridge, so moving
// it later is just a transition-registry key change — no shader edit.
//
// Perf (Codex T4 / SHADER-PROFILES.md): the voronoi search is a fixed 3×3 = 9-tap
// bounded loop, no dynamic length — the 60fps gate depends on keeping it bounded.

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  // Aspect-correct the cell space so shards read as squares, not stretched slivers.
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 cuv = vec2(uv.x * aspect, uv.y);

  const float DENSITY = 11.0; // ~11 shards across — chunky glass, not gravel
  vec2 gv = cuv * DENSITY;
  vec2 cellId = floor(gv);
  vec2 f = fract(gv);

  // Bounded 3×3 voronoi: track F1 (nearest) and F2 (second) for edge detection.
  float f1 = 1e9;
  float f2 = 1e9;
  vec2 seedF1 = vec2(0.5);
  vec2 cellF1 = cellId;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 nb = vec2(float(x), float(y));
      vec2 seed = hash2(cellId + nb);
      vec2 diff = nb + seed - f;
      float d = dot(diff, diff);
      if (d < f1) {
        f2 = f1;
        f1 = d;
        seedF1 = seed;
        cellF1 = cellId + nb;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }

  // Per-shard randoms drive a staggered break: some shards go early, some late.
  vec2 r = hash2(cellF1 * 1.7 + 3.1);
  float delay = r.x * 0.45;
  float local = clamp((uProgress - delay) / (1.0 - 0.45), 0.0, 1.0);
  float ease = local * local; // accelerate like falling glass

  // Displacement: outward from the shard's seed direction, plus gravity.
  vec2 dir = normalize(seedF1 - 0.5 + 0.0001);
  vec2 disp = dir * ease * 0.32;
  disp.y += ease * 0.28; // gravity

  vec4 fromCol = texture(uFrom, uv - disp);
  vec4 toCol = texture(uTo, uv);

  // Shard fades as it breaks free and leaves the frame.
  float shardAlpha = 1.0 - smoothstep(0.0, 0.9, ease);

  // Crack highlight: bright line along shard borders (small F2−F1), strongest right
  // as each shard begins to separate, gone once it's on its way out.
  float border = sqrt(f2) - sqrt(f1);
  float crack = (1.0 - smoothstep(0.0, 0.06, border))
              * (1.0 - smoothstep(0.0, 0.35, local))
              * step(0.001, uProgress);

  vec3 col = mix(toCol.rgb, fromCol.rgb, shardAlpha);
  col += vec3(crack) * 0.85;

  fragColor = vec4(col, 1.0);
}
