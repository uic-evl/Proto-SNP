// Global Application variable
var App = App || {};

/*** KO Class ***/
function Proteins() {
  // self reference
  var self = this;

  // Default viewer options
  self.options = {
    antialias: true,
    quality : 'medium',
    background: 'black'
  };

  // array to hold the proteins
  self.proteins = {};

  // Left and Right Proteins for the Viewers
  self.leftProtien = {};
  self.rightProtien = {};

  /* Form callback to process the request to load a new protein */
  function fetchProtein(formData) {

    /* if the left viewer, propagate the view for the left */
    if(formData.id === "left-viewer"){

      /* Remove the splash overlay */
      $('#leftSplash').remove();

      /* Parse the input */
      self.leftProtien = $(formData).serialize().split('=')[1];

      // initialize the left viewer
      App.leftViewer.init( 'leftViewer', self.options );

      /* load the pdb file for each viewer */
      App.leftViewer.loadFromRCMB(self.leftProtien);
    }

    /* if the left viewer, propagate the view for the left */
    else if(formData.id === "right-viewer"){

      /* Remove the splash overlay */
      $('#rightSplash').remove();

      /* Parse the input */
      self.rightProtien = $(formData).serialize().split('=')[1];

      // initialize the left viewer
      App.rightViewer.init( 'rightViewer', self.options );

      /* load the pdb file for each viewer */
      App.rightViewer.loadFromRCMB(self.rightProtien);
    }

    /* Return false to prevent the form from reloading the page */
    return false;
  }

  /* Return the public-facing functions */
  return {
    processProteinRequest : fetchProtein
  };
}