"use strict";

var App = App || {};

const AxisView3D = (function() {


  function AxisView3D(options) {
    /* Save a reference to this */
    let self = this;
    /* Set a reference to the DOM element*/
    self.container = options.div;

    var camera, scene, renderer;
    var mesh;
    
    init();
    animate();
    
    function init() {
      camera = new THREE.PerspectiveCamera( 70, options.width / options.height, 1, 1000 );
      camera.position.z = 400;
      scene = new THREE.Scene();
      var texture = new THREE.TextureLoader().load( 'images/anterior.png' );
      var geometry = new THREE.BoxBufferGeometry( 200, 200, 200 );
      var material = new THREE.MeshBasicMaterial( { map: texture } );
      mesh = new THREE.Mesh( geometry, material );
      scene.add( mesh );
      renderer = new THREE.WebGLRenderer();
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( options.width, options.height );
      /* Attach the renderer to the DOM */
      $(self.container).append(renderer.domElement);      //

    }

    function onWindowResize() {
      camera.aspect = options.width / options.height;
      camera.updateProjectionMatrix();
      renderer.setSize( options.width, options.height );
    }

    function animate() {
      requestAnimationFrame( animate );
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.01;
      renderer.render( scene, camera );
    }

  }

  AxisView3D.prototype = {


  };

  return AxisView3D;

})();