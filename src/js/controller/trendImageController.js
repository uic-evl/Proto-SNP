"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageController = function(){

  let self = {};

  function horizontalPaddleController(residue_size, yScale) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't a brushing
    if (!d3.event.selection) return; // Ignore empty selections.

    // Round the two event extents to the nearest row
    d3.event.selection[0] = Math.ceil(d3.event.selection[0]/residue_size)*residue_size;
    d3.event.selection[1] = Math.ceil(d3.event.selection[1]/residue_size)*residue_size;

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);

    /* Get the current protein */
    let protein = d3.event.selection.map(yScale.invert)[0];

    /* Reset the opacity of the previous row */
    if(self.previousHorizontal){
      d3.selectAll('.p' + self.previousHorizontal)
          .attr("class", "p" + self.previousHorizontal);
    }

    /* Set the previous horizontal to the current protein */
    self.previousHorizontal = protein;

    /* Set the opacity of the highlighted row */
    d3.selectAll('.p' + protein)
        .attr("class", "p" + protein + " active-selection");

  }

  function horizontalPaddleControllerEnd(yScale) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

  }

  function verticalPaddleController(residue_size) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't a brushing
    if (!d3.event.selection) return; // Ignore empty selections.

    // Round the two event extents to the nearest row
    d3.event.selection[0] = Math.ceil(d3.event.selection[0]/residue_size)*residue_size;
    d3.event.selection[1] = Math.ceil(d3.event.selection[1]/residue_size)*residue_size;

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);

  }

  function verticalPaddleControllerEnd(xScale, family) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    let selection = d3.event.selection.map(xScale.invert);

    let currentSelection = [];

    family.forEach(function(member) {
      console.log(member.sequence[selection[0]]);
    });

  }

  return {
    horizontalBrushed : horizontalPaddleController,
    verticalBrushed   : verticalPaddleController,
    verticalEnd       : verticalPaddleControllerEnd,
    horizontalEnd     : horizontalPaddleControllerEnd
  }

};