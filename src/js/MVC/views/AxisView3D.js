"use strict";

var App = App || {};

const AxisView3D = (function() {


  function AxisView3D(options) {
    /* Save a reference to this */
    let self = this;
    /* Set a reference to the DOM element*/
    self.container = options.div;

    let camera, scene, renderer;

    init();
    animate();
    
    function init() {
      camera = new THREE.PerspectiveCamera( 70, options.width / options.height, 1, 1000 );
      camera.position.z = 400;
      scene = new THREE.Scene();
      let texture = new THREE.TextureLoader().load( 'images/anterior.png' );
      let geometry = new THREE.BoxBufferGeometry( 200, 200, 200 );
      let material = new THREE.MeshBasicMaterial( { map: texture } );
      self.mesh = new THREE.Mesh( geometry, material );

      scene.add( self.mesh );
      renderer = new THREE.WebGLRenderer();
      // renderer.setClearColor( 0xcccccc, 1);
      renderer.setPixelRatio( window.devicePixelRatio );
      renderer.setSize( options.width, options.height );
      /* Attach the renderer to the DOM */
      $(self.container).append(renderer.domElement);
    }

    function onWindowResize() {
      camera.aspect = options.width / options.height;
      camera.updateProjectionMatrix();
      renderer.setSize( options.width, options.height );
    }

    function animate() {
      requestAnimationFrame( animate );
      renderer.render( scene, camera );
    }

  }

  AxisView3D.prototype = {
    /* Rotate the cube based on the camera's rotation */
    setRotation : function(x,y,z){
      this.mesh.rotation.x = -x;
      this.mesh.rotation.y = -y;
      this.mesh.rotation.z = -z;
    }

  };

  return AxisView3D;

})();