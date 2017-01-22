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
  function fetchProtein(formData) {

    /* if the left viewer, propagate the view for the left */
    if(formData.id === "left-viewer"){

      /* Remove the splash overlay */
      $('#leftSplash').remove();

      /* Parse the input */
      self.leftProtein.name = $(formData).serialize().split('=')[1];

      // initialize the left viewer
      App.leftViewer.init( 'leftViewer', self.options );

      /* load the pdb file for each viewer */
      App.leftViewer.loadFromRCMB(self.leftProtein.name)
      /* Once the data has been loaded, get the sequence */
      .then(function(view){
        // get the sequence of the protein
        self.leftProtein.sequence = App.leftViewer.getSequence(0);

        // initialize the sequence viewer
        App.sequenceViewer.init("#sequenceViewer-left");
        
        /* Check if a sequence is already added to the list, if so align them*/
        if(self.rightProtein.name){
          /* Align the sequences */
          let seq = App.align(self.leftProtein.sequence, {});

          /* Set the model sequences */
          self.leftProtein.sequence = seq.leftSequence;
          self.rightProtein.sequence = seq.rightSequence;

          /* Render the other sequence */
          App.sequenceViewer.render("#sequenceViewer-right", self.rightProtein.sequence);
        }
        // render the sequence list
        App.sequenceViewer.render("#sequenceViewer-left", self.leftProtein.sequence);
      });
    }

    /* if the left viewer, propagate the view for the left */
    else if(formData.id === "right-viewer"){

      /* Remove the splash overlay */
      $('#rightSplash').remove();

      /* Parse the input */
      self.rightProtein.name = $(formData).serialize().split('=')[1];

      // initialize the left viewer
      App.rightViewer.init( 'rightViewer', self.options );

      /* load the pdb file for each viewer */
      App.rightViewer.loadFromRCMB(self.rightProtein.name)
      /* Once the data has been loaded, get the sequence */
      .then(function(view){
        // get the sequence of the protein
        self.rightProtein.sequence = App.rightViewer.getSequence(0);

        // initialize the sequence viewer
        App.sequenceViewer.init("#sequenceViewer-right");

        /* Check if a sequence is already added to the list, if so align them*/
        if(self.leftProtein.name){
          /* Align the sequences */
          let seq = App.align(self.leftProtein.sequence, self.rightProtein.sequence, {});

          /* Set the model sequences */
          self.leftProtein.sequence = seq.leftSequence;
          self.rightProtein.sequence = seq.rightSequence;

          /* Render the other sequence */
          App.sequenceViewer.render("#sequenceViewer-left", self.leftProtein.sequence);
        }

        // render the sequence list
        App.sequenceViewer.render("#sequenceViewer-right", self.rightProtein.sequence);
      });
    }
    /* Return false to prevent the form from reloading the page */
    return false;
  }

  /* Return the public-facing functions */
  return {
    processProteinRequest : fetchProtein
  };
}