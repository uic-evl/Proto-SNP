"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageController = function(){

  /* Class private variable */
  let self = {};

  function horizontalPaddleController(residue_glyph_size, yScale) {

    /* We only want to capture user events. */
    if (!d3.event.sourceEvent) {
      /* The first event that fires is the initialization. */
      self.previousHorizontalSelection = d3.event.selection.map(yScale.invert)[0];
      return;
    }
    if (!d3.event.selection) return; // Ignore empty selections.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't associated with a mouse move

    // Round the two event extents to the nearest row
    d3.event.selection[0] = Math.ceil(d3.event.selection[0]/residue_glyph_size)*residue_glyph_size;
    d3.event.selection[1] = Math.ceil(d3.event.selection[1]/residue_glyph_size)*residue_glyph_size;

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);

    /* Get the current protein */
    let currentHorizontalSelection = d3.event.selection.map(yScale.invert)[0];

    /* Reset the opacity of the previous row */
    if(self.previousHorizontalSelection){
      d3.selectAll('.p' + self.previousHorizontalSelection)
          .attr("class", "p" + self.previousHorizontalSelection);
    }

    /* Set the previous horizontal to the current protein */
    self.previousHorizontalSelection = currentHorizontalSelection;

    /* Set the opacity of the highlighted row */
    d3.selectAll('.p' + currentHorizontalSelection)
        .attr("class", "p" + currentHorizontalSelection + " active-selection");
  }

  function horizontalPaddleControllerEnd(yScale) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

  }

  function verticalPaddleController(residue_glyph_size) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't a brushing
    if (!d3.event.selection) return; // Ignore empty selections.

    // Round the two event extents to the nearest row
    d3.event.selection[0] = Math.ceil(d3.event.selection[0]/residue_glyph_size)*residue_glyph_size;
    d3.event.selection[1] = Math.ceil(d3.event.selection[1]/residue_glyph_size)*residue_glyph_size;

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);

  }

  function verticalPaddleControllerEnd(xScale, protein_family_data, column_frequencies) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    let selection = d3.event.selection.map(xScale.invert);

    let currentSelection = [];

    /* Get the fragments from the column*/
    let fragments = column_frequencies.getMostFrequentFragment(selection[0]);

    /* Get the highest occurring residue and it's frequency */
    let highestFrequency = _.max(_.toPairs(fragments), function(o){ return o[1] });

    console.log(highestFrequency);
  }

  return {
    horizontalBrushed : horizontalPaddleController,
    verticalBrushed   : verticalPaddleController,
    verticalEnd       : verticalPaddleControllerEnd,
    horizontalEnd     : horizontalPaddleControllerEnd
  }

};