"use strict";

var App = App || {};

const AxisView3D = (function() {


  function AxisView3D(options) {
    /* Save a reference to this */
    let self = this;
    /* Set a reference to the DOM element*/
    self.container = options.div;

    self._setup_mouse = function() {
      // $("canvas").mousemove(function (event) {
      //   if (document.elementFromPoint) {
      //     var $canvas = $(this);
      //     // hide canvas visibility
      //     // don't do display:none as we want to maintain canvas layout
      //     $canvas.css('visibility', 'hidden');
      //     // get the element underneath, if any
      //     var $under = $(document.elementFromPoint(event.clientX, event.clientY));
      //     // show again the canvas
      //     $canvas.css('visibility', 'visible');
      //     if ($under.hasClass('underneath')) {
      //       $under.triggerHandler('mouseover');
      //     } else {
      //       $("#result").text("mouse is over the canvas");
      //     }
      //   }
      // })
    };

    self._create_axis_cube = function(){
      // let maxAnisotropy = self.renderer.getMaxAnisotropy();
      //
      // let textureLoader = new THREE.TextureLoader();
      //
      // let texture0 = textureLoader.load('images/anterior.png'), // xpos, Right
      //     texture1 = textureLoader.load('images/posterior.png'), // xneg, Left
      //     texture2 = textureLoader.load('images/superior.png'), // ypos, Top
      //     texture3 = textureLoader.load('images/inferior.png'), // yneg, Bottom
      //     texture4 = textureLoader.load('images/right.png'), // zpos, Back
      //     texture5 = textureLoader.load('images/left.png'); // zneg, Front
      //
      // texture0.anisotropy = maxAnisotropy;
      // texture1.anisotropy = maxAnisotropy;
      // texture2.anisotropy = maxAnisotropy;
      // texture3.anisotropy = maxAnisotropy;
      // texture4.anisotropy = maxAnisotropy;
      // texture5.anisotropy = maxAnisotropy;
      //
      // let materialArray = [
      //   new THREE.MeshBasicMaterial({
      //     map: texture0
      //   }),
      //   new THREE.MeshBasicMaterial({
      //     map: texture1
      //   }),
      //   new THREE.MeshBasicMaterial({
      //     map: texture2
      //   }),
      //   new THREE.MeshBasicMaterial({
      //     map: texture3
      //   }),
      //   new THREE.MeshBasicMaterial({
      //     map: texture4
      //   }),
      //   new THREE.MeshBasicMaterial({
      //     map: texture5
      //   })
      // ];

      // orientation marker, patient coordinate system
      // let
      //     // MovingCubeMat = new THREE.MultiMaterial(materialArray),
          // geometry = THREE.BoxBufferGeometry(15, 15, 15, 1, 1, 1);
          // MovingCubeGeom = new THREE.Mesh(15, 15, 15, 1, 1, 1, materialArray);

      let geometry = new THREE.BoxGeometry(15, 15, 15);
      let material = new THREE.MeshBasicMaterial(
          {
            color: 0x00ff00,
            opacity: 0.9, // CHANGED
            transparent: true
          } );

      return new THREE.Mesh(geometry, material);
    };

    /* initialize the view */
    self.initialize(options);
    self.render();

  }

  AxisView3D.prototype = {

    initialize: function(options) {
      /*set some camera attributes */
      let VIEW_ANGLE = 75,
          ASPECT = options.width/options.height,
          NEAR = 1,
          FAR = 10000;

      //create camera and a scene
      this.camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR );
      this.camera.position.z = 25;
      this.scene = new THREE.Scene();

      /*create and start the WebGL renderer*/
      this.renderer = new THREE.WebGLRenderer( { alpha: true } );
      this.renderer.setSize(options.width, options.height);
      this.renderer.setClearColor( 0x000000, 0 );

      /* Attach the renderer to the DOM */
      $(this.container).append(this.renderer.domElement);

      let cube = this._create_axis_cube(),
          light = new THREE.AmbientLight(0xffffff, 1.0); // white light

      // cube.position.set(65, -65, -100);

      this.scene.add(cube);
      this.scene.add(light);
      this.scene.add(this.camera);
    },
    
    render: function() {
      this.renderer.render( this.scene, this.camera );
    },

    redraw: function() {

    }

  };

  return AxisView3D;

})();