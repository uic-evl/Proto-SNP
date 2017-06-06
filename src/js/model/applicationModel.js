"use strict";

// Global Application variable
var App = App || {};

/*** KO Class ***/
function ApplicationModel() {

  /* Render the 3D and Sequence Views */
  function render_views(structure) {
    /* No structure was returned */
    if(!structure) return;

    /* Render the 3D view */
    this.view.render(structure, this.modelPointer.name);

    // get the sequence of the protein
    this.modelPointer.sequence = this.view.getSequence(this.modelPointer.structure, 0);

    // initialize the sequence viewer
    App.sequenceViewer.init(this.viewPosition + "MolecularViewer-Sequence");

    /* Check if a sequence is already added to the list, if so align them*/
    if(this.siblingPointer.name){
      /* Align the sequences */
      App.align(this.modelPointer.sequence, this.siblingPointer.sequence, {})
        .then(function(seq){
          /* Set the model sequences */
          this.modelPointer.sequence   = (this.viewPosition === "left")
            ? seq.leftSequence  : seq.rightSequence;
          this.siblingPointer.sequence = (this.siblingPosition === "right")
            ? seq.rightSequence : seq.leftSequence;

          /* Render the other sequence */
          App.sequenceViewer.render(this.siblingPosition + "MolecularViewer-Sequence", this.siblingPointer.sequence);
        }.bind(this));
    }
    // render the sequence list
    App.sequenceViewer.render(this.viewPosition + "MolecularViewer-Sequence", this.modelPointer.sequence);
  }




}