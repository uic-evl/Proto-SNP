"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageController = function(){

  function horizontalPaddleController() {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.


  }

  return {
    horizontalBrushed: horizontalPaddleController
  }

};