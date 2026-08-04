// Persistent WebGL2 canvas — 1×1px at rest, fullscreen during transitions (D1, D9/D10/D15).
// One context lives from page load to close. All shaders compiled into this same context
// so GL programs remain valid across the resize lifecycle.
//
// WebGL2-absent hardening (TODO-006): this module builds its engine eagerly at module
// scope and main.ts imports it, so a throw in the constructor happens during module
// *evaluation* and takes down the whole module graph — the user gets a blank page, not a
// degraded one. WebGL2 is genuinely absent on Safari < 15, on browsers where the user
// disabled WebGL, on blocklisted GPUs, and inside many VMs and remote desktops. So the
// engine never throws: `supported` goes false and every GL method becomes a no-op.
// transition.ts already routes to `fadeSwap` when a shader isn't available, which is the
// same degraded path touch devices and reduced-motion users get.

const VERT_SRC = /* glsl */`#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  // Full-screen triangle via gl_VertexID (no VBO needed)
  vec2 pos = vec2(
    float((gl_VertexID & 1) * 4 - 1),
    float((gl_VertexID >> 1) * 4 - 1)
  );
  vUv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

interface CompiledShader {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
}

class WebGLEngine {
  readonly canvas: HTMLCanvasElement | null;
  readonly gl: WebGL2RenderingContext | null;
  /** False when WebGL2 is unavailable — callers should take the fadeSwap path. */
  readonly supported: boolean;
  private shaders: Map<string, CompiledShader> = new Map();
  private textures: [WebGLTexture | null, WebGLTexture | null] = [null, null];

  constructor() {
    this.canvas = document.getElementById('gl-canvas') as HTMLCanvasElement | null;
    // getContext itself can throw in hardened//privacy-patched browsers, not just
    // return null — so the whole probe is guarded, not only its result.
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl =
        this.canvas?.getContext('webgl2', {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          premultipliedAlpha: false,
        }) ?? null;
    } catch {
      gl = null;
    }

    this.gl = gl;
    this.supported = gl !== null;

    if (!this.supported) {
      // Never throw: this runs at module evaluation time (see header). A blank
      // page is a far worse outcome than transitions falling back to a fade.
      console.warn('[webgl] WebGL2 unavailable — transitions will fall back to fadeSwap.');
      return;
    }

    // 1×1 pixel at rest
    this.canvas!.width = 1;
    this.canvas!.height = 1;
  }

  resizeForTransition() {
    if (!this.gl || !this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = Math.round(window.innerWidth * dpr);
    this.canvas.height = Math.round(window.innerHeight * dpr);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.classList.add('active');
  }

  resetAfterTransition() {
    const { canvas } = this;
    if (!canvas) return;
    canvas.classList.remove('active');
    // Defer resize to avoid flash
    requestAnimationFrame(() => {
      canvas.width = 1;
      canvas.height = 1;
    });
  }

  compileShader(name: string, fragSrc: string): CompiledShader | null {
    const { gl } = this;
    if (!gl) return null;

    const vert = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vert, VERT_SRC);
    gl.compileShader(vert);
    if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
      throw new Error(`Vert shader error: ${gl.getShaderInfoLog(vert)}`);
    }

    const frag = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(frag, fragSrc);
    gl.compileShader(frag);
    if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
      throw new Error(`Frag shader [${name}] error: ${gl.getShaderInfoLog(frag)}`);
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Shader link error [${name}]: ${gl.getProgramInfoLog(program)}`);
    }

    gl.deleteShader(vert);
    gl.deleteShader(frag);

    const compiled: CompiledShader = {
      program,
      uniforms: {
        uFrom:       gl.getUniformLocation(program, 'uFrom'),
        uTo:         gl.getUniformLocation(program, 'uTo'),
        uProgress:   gl.getUniformLocation(program, 'uProgress'),
        // Fullscreen resolution in device px. Shaders that need aspect ratio
        // (glass-shatter's voronoi cells) sample this; shaders that don't
        // declare it get a null location, and uniform2f(null, …) is a GL no-op.
        uResolution: gl.getUniformLocation(program, 'uResolution'),
      },
    };
    this.shaders.set(name, compiled);
    return compiled;
  }

  precompileAll(shaderSources: Record<string, string>) {
    const { gl } = this;
    // No GL: nothing to precompile. The shaders map stays empty, so getShader()
    // returns undefined and transition.ts takes the fadeSwap path.
    if (!gl) return;

    // Use KHR_parallel_shader_compile if available, via requestIdleCallback
    const ext = gl.getExtension('KHR_parallel_shader_compile');

    const names = Object.keys(shaderSources);
    let i = 0;

    const compileNext = (deadline?: IdleDeadline) => {
      while (i < names.length) {
        if (deadline && deadline.timeRemaining() < 2) break;
        const name = names[i++];
        try {
          this.compileShader(name, shaderSources[name]);
          if (ext) {
            // Poll for completion asynchronously
            const shader = this.shaders.get(name)!;
            const status = gl.getProgramParameter(shader.program, (ext as any).COMPLETION_STATUS_KHR);
            if (!status) {
              // Not done yet — will resolve on next idle
              i--;
              break;
            }
          }
        } catch (e) {
          console.warn(`[webgl] Precompile failed for ${name}:`, e);
          i++;
        }
      }
      if (i < names.length) {
        requestIdleCallback(compileNext);
      }
    };

    requestIdleCallback(compileNext);
  }

  uploadTexture(slot: 0 | 1, imageData: HTMLCanvasElement) {
    const { gl } = this;
    if (!gl) return;
    if (this.textures[slot]) gl.deleteTexture(this.textures[slot]);

    const tex = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.textures[slot] = tex;
  }

  render(shaderName: string, progress: number) {
    const { gl, canvas } = this;
    if (!gl || !canvas) return;
    const compiled = this.shaders.get(shaderName);
    if (!compiled) {
      console.warn(`[webgl] Shader '${shaderName}' not compiled`);
      return;
    }

    gl.useProgram(compiled.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
    gl.uniform1i(compiled.uniforms.uFrom, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
    gl.uniform1i(compiled.uniforms.uTo, 1);

    gl.uniform1f(compiled.uniforms.uProgress, progress);
    gl.uniform2f(compiled.uniforms.uResolution, canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  getShader(name: string): CompiledShader | undefined {
    return this.shaders.get(name);
  }
}

export const webgl = new WebGLEngine();
