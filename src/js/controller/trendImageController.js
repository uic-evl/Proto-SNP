"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageController = function(){

  function horizontalPaddleController(residue_size) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't a brushing
    if (!d3.event.selection) return; // Ignore empty selections.

    // Round the two event extents to the nearest row
    d3.event.selection[0] = Math.ceil(d3.event.selection[0]/residue_size)*residue_size;
    d3.event.selection[1] = Math.ceil(d3.event.selection[1]/residue_size)*residue_size;

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);

  }

  function horizontalPaddleStart() {

    if(!d3.event.sourceEvent) return; // if no Mouse selection event
    if (!d3.event.selection) return; // Ignore empty selections.


  }

  return {
    horizontalBrushed : horizontalPaddleController,
    horizontalStart   : horizontalPaddleStart
  }

};