"use strict";

var App = App || {};

const ResidueFrequencyView = (function() {

  /* initialize the self instance variable */
  let self = {

  };



  /* Initialized the frequency viewers */
  function initialize_frequency_viewers() {

    /* Get the currently selected protein and the selected residues */
    let currentProtein = trendImageViewer.protein_family_data[0];

    /* Get the length of the sequence */
    let sequence_length = trendImageViewer.x_axis_length;

    /* Get the selected residues from the left paddle */
    let leftSelectedResidues = [0, trendImageViewer.verticalPaddleSize];

    /* Get the selected residues from the left paddle */
    let rightSelectedResidues = [sequence_length - trendImageViewer.verticalPaddleSize, sequence_length];

    /* Get the fragments from the left column*/
    let leftFragments = trendImageViewer.column_frequencies
      .getFragmentCountsFromRange(leftSelectedResidues[0], leftSelectedResidues[1]);

    /* Get the fragments from the right column*/
    let rightFragments = trendImageViewer.column_frequencies
      .getFragmentCountsFromRange(rightSelectedResidues[0], rightSelectedResidues[1]);

    /* Iterate over each of the left returned fragments */
    let leftSelectionFragments = [];
    leftFragments.forEach(function(fragment) {
      /* Get the highest occurring residue and it's frequency */
      leftSelectionFragments.push(_.max(_.toPairs(fragment), function(o){ return o[1] }));
    });

    /* Iterate over each of the right returned fragments */
    let rightSelectionFragments = [];
    rightFragments.forEach(function(fragment) {
      /* Get the highest occurring residue and it's frequency */
      rightSelectionFragments.push(_.max(_.toPairs(fragment), function(o){ return o[1] }));
    });

    /* Get the residues that intersect with the left vertical paddle*/
    let leftHorizontalSelectedResidues = currentProtein.sequence.slice(leftSelectedResidues[0], leftSelectedResidues[1]);

    /* Get the residues that intersect with the vertical paddle*/
    let rightHorizontalSelectedResidues = currentProtein.sequence.slice(rightSelectedResidues[0], rightSelectedResidues[1]);

    /* Initialize the frequency viewers*/
    App.leftFrequencyViewer.init("#leftResidueSummaryViewer", trendImageViewer.verticalPaddleMaxSize);
    App.rightFrequencyViewer.init("#rightResidueSummaryViewer", trendImageViewer.verticalPaddleMaxSize);

    /* Render the frequency view*/
    App.leftFrequencyViewer.render(leftSelectionFragments, trendImageViewer.y_axis_length,
      leftHorizontalSelectedResidues, trendImageViewer.residue_glyph_size * trendImageViewer.verticalPaddleSize/2.0 );
    App.rightFrequencyViewer.render(rightSelectionFragments, trendImageViewer.y_axis_length,
      rightHorizontalSelectedResidues, App.frequencyWidth - trendImageViewer.residue_glyph_size*2 - App.rightFrequencyViewer.getOffset()*2);
  }



  function ResidueFrequencyView(model) {

    this._model = model;

    /* Set the model listeners */
    this._model.selectedProteinChanged.attach(function(selection){

    });

    this._model.selectedResiduesChanged.attach(function(selection){

    });


    this.render = function(){

    };


    this.redraw = function() {

    }

  }

  ResidueFrequencyView.prototype = View.prototype;

  return ResidueFrequencyView;

})();
