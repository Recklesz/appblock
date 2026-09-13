// Noise dissolve adapted from Rich Harris's MIT-licensed GL Transitions perlin.glsl.
// https://github.com/gl-transitions/gl-transitions/blob/master/transitions/perlin.glsl
// See THIRD_PARTY_NOTICES.md for the license.
const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `
precision highp float;
uniform sampler2D artwork;
uniform vec2 viewport;
uniform vec2 imageSize;
uniform vec2 anchor;
uniform float progress;
varying vec2 uv;

float random(vec2 co) {
  float dt = dot(co, vec2(12.9898, 78.233));
  return fract(sin(mod(dt, 3.14)) * 43758.5453);
}
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  return mix(a, b, u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;
}
void main() {
  // Match CSS background-size: cover and background-position.
  vec2 rendered = imageSize * max(viewport.x/imageSize.x, viewport.y/imageSize.y);
  vec2 crop = viewport / rendered;
  vec2 imageUV = uv * crop + (1.0-crop) * anchor;
  vec2 field = uv * viewport / min(viewport.x, viewport.y) * 3.2;
  field += vec2(progress * 0.12, progress * -0.08);
  float n = 0.72 * noise(field + 3.7) + 0.28 * noise(field * 2.03 + 11.2);
  float eased = progress * progress * (3.0 - 2.0 * progress);
  float threshold = mix(-0.24, 1.24, eased);
  float reveal = 1.0 - smoothstep(threshold - 0.24, threshold + 0.24, n);
  gl_FragColor = vec4(texture2D(artwork, imageUV).rgb, reveal);
}`;

export async function createDissolve(element, url) {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false });
  if (!gl) return null;
  const shaders = [];
  let program, buffer, texture;
  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    canvas.remove();
    element.style.backgroundImage = "";
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach(shader => gl.deleteShader(shader));
  }
  try {
    const picture = new Image();
    picture.src = url;
    await picture.decode();
    function compile(type, source) {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, picture);
    const uniforms = Object.fromEntries(["viewport", "imageSize", "anchor", "progress"].map(name => [name, gl.getUniformLocation(program, name)]));
    gl.uniform2f(uniforms.imageSize, picture.naturalWidth, picture.naturalHeight);
    element.append(canvas);
    element.style.backgroundImage = "none";
    element.style.opacity = "1";
    canvas.addEventListener("webglcontextlost", () => dispose(), { once: true });
    return {
      dispose,
      render(progress) {
        if (disposed) {
          element.style.opacity = String(progress * progress * (3 - 2 * progress));
          return;
        }
        const width = element.clientWidth;
        const height = element.clientHeight;
        const density = Math.min(devicePixelRatio || 1, 1.5);
        const w = Math.round(width * density), h = Math.round(height * density);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
          gl.viewport(0, 0, w, h);
        }
        const style = getComputedStyle(element);
        const x = parseFloat(style.backgroundPositionX) / 100;
        const y = parseFloat(style.backgroundPositionY) / 100;
        gl.uniform2f(uniforms.anchor, x, 1-y);
        gl.uniform2f(uniforms.viewport, width, height);
        gl.uniform1f(uniforms.progress, progress);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    };
  } catch (error) {
    console.warn("Shader reveal unavailable; using a soft fade.", error);
    dispose();
    return null;
  }
}
