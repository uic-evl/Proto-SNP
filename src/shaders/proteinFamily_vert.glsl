attribute vec4 position;
varying vec2 v_texCoord;

void main() {
  gl_Position = position;

  // scale the position
  v_texCoord = position.xy * 0.5 + 0.5;
}