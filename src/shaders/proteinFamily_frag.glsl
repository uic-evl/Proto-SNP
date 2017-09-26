precision highp float;
// texture
uniform sampler2D u_texture;
// texture position
varying vec2 v_texCoord;

void main() {
   gl_FragColor =
    texture2D(u_texture, v_texCoord);
}