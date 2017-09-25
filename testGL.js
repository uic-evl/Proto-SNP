(function(){

  let sequence = "";

  function render(error, result){

    sequence = result.data;

    let mapper =  new ResidueMappingUtility(),
        mapping = mapper.getColor("Side Chain Class");
    let canvas = document.getElementById('canvas'),
        familyCanvas = document.getElementById('family'),
        familyContext = familyCanvas.getContext("2d");

    familyContext.imageSmoothingQuality = "high";
    familyContext.webkitImageSmoothingEnabled = false;
    familyContext.mozImageSmoothingEnabled = false;
    familyContext.imageSmoothingEnabled = false;


    let familyImage = new Image();
    let gl = canvas.getContext("webgl");

    let data = [];
    let i, j;
    sequence.forEach(function(sequence){
      sequence.forEach(function(residue){
        let color = mapping(residue).rgba;
          data.push(color[0], color[1], color[2], color[3]);
      })
    });

    let pixels = new Uint8Array(data); // 16x16 RGBA image
    let texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Flip the image's Y axis to match the WebGL texture coordinate space.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    gl.texImage2D(
        gl.TEXTURE_2D, // target
        0, // mip level
        gl.RGBA, // internal format
        373,640, // width and height
        0, // border
        gl.RGBA, //format
        gl.UNSIGNED_BYTE, // type
        pixels // texture data
    );

    // compiles and links the shaders and looks up uniform and attribute locations
    let programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    let arrays = {
      position: [
        -1, -1, 0,
        1, -1, 0,
        -1, 1, 0,
        -1, 1, 0,
        1, -1, 0,
        1, 1, 0,
      ]
    };
    // calls gl.createBuffer, gl.bindBuffer, gl.bufferData for each array
    let bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    let uniforms = {
      u_texture: texture,
      u_textureSize: [373,640],
      u_residue_size: 3
    };

    gl.useProgram(programInfo.program);
    // calls gl.bindBuffer, gl.enableVertexAttribArray, gl.vertexAttribPointer
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    // calls gl.activeTexture, gl.bindTexture, gl.uniformXXX
    twgl.setUniforms(programInfo, uniforms);
    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, gl.TRIANGLES, bufferInfo);

    familyImage.onload = function(){
      // familyContext.scale(3,3)
      familyContext.drawImage(familyImage, 0,0, 373,116, 0, 0, 1119,348);
    };

    // save canvas image as data url (png format by default)
    familyImage.src = canvas.toDataURL();
  }

  function main() {
    queue()
        .defer(d3.json, 'data.json')
        .await(render);
  }

  document.addEventListener('DOMContentLoaded', main, false);

})();