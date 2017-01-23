"use strict";

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
  self.leftProtein = {};
  self.rightProtein = {};

  /* Form callback to process the request to load a new protein */
  function fetchAndStoreProtein(formData) {

    // view variable
    let view      = App.leftViewer;

    // model pointers
    let modelPointer   = self.leftProtein;
    let siblingPointer = self.rightProtein;

    // left or right view
    let viewPosition    = "#" + formData.id.split('-')[0];
    let siblingPosition = "#right";

    if(viewPosition === "#right") {
      /* Swap the views */
      view           = App.rightViewer;
      /* Swap the views */
      modelPointer   = self.rightProtein;
      siblingPointer = self.leftProtein;
      /* Swap the positions */
      siblingPosition    = "#left";
    }

      /* Remove the splash overlay */
      $(viewPosition + 'Splash').remove();

      /* Parse the input */
      modelPointer.name = $(formData).serialize().split('=')[1];

      // initialize the left viewer
      view.init(viewPosition + 'Viewer', self.options );

      /* load the pdb file for each viewer */
      view.loadFromRCMB(modelPointer.name)
      /* Once the data has been loaded, get the sequence and render the view */
      .then(function(structure){

        /* Render the 3D view */
        view.render(structure, modelPointer.name);

        // get the sequence of the protein
        modelPointer.sequence = view.getSequence(0);

        // initialize the sequence viewer
        App.sequenceViewer.init(viewPosition + "Viewer-Sequence");
        
        /* Check if a sequence is already added to the list, if so align them*/
        if(siblingPointer.name){
          /* Align the sequences */
          let seq = App.align(modelPointer.sequence, siblingPointer.sequence, {});

          /* Set the model sequences */
          modelPointer.sequence   = (viewPosition === "left")     ? seq.leftSequence  : seq.rightSequence;
          siblingPointer.sequence = (siblingPosition === "right") ? seq.rightSequence : seq.leftSequence;

          /* Render the other sequence */
          App.sequenceViewer.render(siblingPosition + "Viewer-Sequence", siblingPointer.sequence);
        }
        // render the sequence list
        App.sequenceViewer.render(viewPosition + "Viewer-Sequence", modelPointer.sequence);
      });
    /* Return false to prevent the form from reloading the page */
    return false;
  }

  /* Return the public-facing functions */
  return {
    processProteinRequest : fetchAndStoreProtein
  };
}