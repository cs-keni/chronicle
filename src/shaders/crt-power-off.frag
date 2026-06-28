#version 300 es
precision highp float;

uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform float uProgress;

in vec2 vUv;
out vec4 fragColor;

// CRT power-off transition.
// Phase 0.0–0.4: compress uFrom vertically to a thin white horizontal line
// Phase 0.4–0.6: hold the white line
// Phase 0.6–1.0: expand the line, revealing uTo
//
// The compression/expansion maps the full image into/out of a shrinking band.
// smoothstep easing makes the compression feel like CRT capacitor discharge.

void main() {
  vec2 uv = vUv;
  float center = 0.5;

  if (uProgress < 0.4) {
    // Compress phase
    float t = uProgress / 0.4;
    float ease = smoothstep(0.0, 1.0, t);
    float bandHalf = mix(0.5, 0.001, ease);

    if (abs(uv.y - center) <= bandHalf) {
      // Remap UV into the full source image
      float srcY = (uv.y - (center - bandHalf)) / (2.0 * bandHalf);
      vec4 src = texture(uFrom, vec2(uv.x, srcY));
      // Fade to near-white at peak compression
      fragColor = mix(src, vec4(1.0), ease * 0.85);
    } else {
      fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }

  } else if (uProgress < 0.6) {
    // Hold phase — thin white line
    float lineHalf = 0.001;
    if (abs(uv.y - center) <= lineHalf) {
      fragColor = vec4(1.0);
    } else {
      fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }

  } else {
    // Expand phase
    float t = (uProgress - 0.6) / 0.4;
    float ease = smoothstep(0.0, 1.0, t);
    float bandHalf = mix(0.001, 0.5, ease);

    if (abs(uv.y - center) <= bandHalf) {
      // Remap UV into destination image
      float dstY = (uv.y - (center - bandHalf)) / (2.0 * bandHalf);
      fragColor = texture(uTo, vec2(uv.x, dstY));
    } else {
      fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
  }
}
