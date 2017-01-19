var App = App || {};

(function(){

  // create reference to 'this'
  var self = this;

  /* Starting point of the program. Initializes the application */
  function init() {

    // Default viewer options
    var options = {
      antialias: true,
      quality : 'medium',
      background: 'black'
    };

    /* create the left and right viewers */
    App.leftViewer = new MolecularViewer();
    App.rightViewer = new MolecularViewer();

    /* initialize the left/right viewers */
    App.leftViewer.init( 'leftViewer', options );
    App.rightViewer.init( 'rightViewer', options );

    /* load the pdb file for each viewer */
    App.leftViewer.loadFromRCMB('2YPI');
    App.rightViewer.loadFromRCMB('5CKN');
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);

})();