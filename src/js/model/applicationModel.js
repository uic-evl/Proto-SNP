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


  /* Calculate all of the sorting metrics for family */
  function calculate_all_sorting_scores(protein) {
    return new Promise(function(resolve, reject) {
      /* Calculate the column frequency scores and enable the menu option */
      self.sortedSequences.calculateFrequencyScores()
          .then((scores) => {
            $("#residue_freq_li").find("a").removeClass("disabled");
            self.proteinFamily.setScores("residue_frequency", scores);
          });
      /* Calculate the edit distance scores with the first protein and enable the menu option */
      self.sortedSequences.calculateEditDistanceScores(protein)
          .then((scores) => {
            $("#edit_dist_li").find("a").removeClass("disabled");
            self.proteinFamily.setScores("edit_distance", scores);
          });
      /* Calculate the weighted edit distance scores with the first protein and enable the menu option */
      self.sortedSequences.calculateEditDistanceScores(protein, {insertion: 3, deletion: 3, substitution: 5})
          .then((scores) => {
            $("#weighted_edit_dist_li").find("a").removeClass("disabled");
            self.proteinFamily.setScores("weighted_edit_distance", scores);
          });
      /* Calculate the residue commonality scores with the first protein and enable the menu option */
      self.sortedSequences.calculateCommonalityScores(protein)
          .then((scores) => {
            $("#commonality_li").find("a").removeClass("disabled");
            self.proteinFamily.setScores("commonality_scores", scores);
          });
      /* Calculate the weighted residue commonality scores with the first protein and enable the menu option */
      self.sortedSequences.calculateCommonalityScores(protein, 1)
          .then((scores) => {
            $("#normalized_commonality_li").find("a").removeClass("disabled");
            self.proteinFamily.setScores("normalized_commonality_scores", scores);
          });
    });

  }

}