"use strict";

// Global Application variable
var App = App || {};

(function(){

  // Default PV viewer options
  App.options = {
    antialias: true,
    quality : 'medium',
    background: 'black'
  };

  /* Starting point of the program. Initializes the application */
  function init() {

    /* Set the size of the 3D Divs*/
    let leftDom  = document.getElementById('leftViewer');
    let rightDom = document.getElementById('rightViewer');

    // attach the height to the global app variable
    App.viewerWidth  = leftDom.clientWidth;
    App.viewerHeight = App.viewerWidth * 0.9;

    // set the div size
    leftDom.style.height  = App.viewerHeight;
    rightDom.style.height = App.viewerHeight;

    /* create the left and right viewers */
    App.leftViewer  = new MolecularViewer();
    App.rightViewer = new MolecularViewer();

    /* Setup the sequence viewer */
    App.sequenceViewer = new SequenceViewer();

    /* Bind the model to the view*/
    ko.applyBindings(new Proteins());

    /* Setup the protein selection overlays */
    App.setupOverlays();

    /* Setup the protein file upload */
    App.setupUpload();
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);

})();