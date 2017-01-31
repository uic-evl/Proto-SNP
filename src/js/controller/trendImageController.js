"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageController = function(){

  /* Class private variable */
  let self = {};

  function horizontal_paddle_controller(residue_glyph_size, yScale) {

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

  function horizontal_paddle_controllerEnd(protein_family_data, xScale) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    /* Update the frequency viewer's text */
    /* Get the currently selected protein*/
    let currentProtein = _.find(protein_family_data, ["name", self.previousHorizontalSelection]);

    /* Get the left vertical selection */
    let leftVerticalSelection = d3.brushSelection( d3.select('g.brush.vertical-left').node() ).map(xScale.invert);

    /* Get the right vertical selection */
    let rightVerticalSelection = d3.brushSelection( d3.select('g.brush.vertical-right').node() ).map(xScale.invert);

    /* Get the residues that intersect with the left vertical paddle*/
    let leftHorizontalSelectedResidues = currentProtein.sequence.slice(leftVerticalSelection[0], leftVerticalSelection[1]);

    /* Get the residues that intersect with the right vertical paddle*/
    let rightHorizontalSelectedResidues = currentProtein.sequence.slice(rightVerticalSelection[0], rightVerticalSelection[1]);

    /* Update the left frequency viewer text  */
    App.leftFrequencyViewer.update(leftHorizontalSelectedResidues);

    /* Update the right frequency viewer text  */
    App.rightFrequencyViewer.update(rightHorizontalSelectedResidues);
  }

  function vertical_paddle_controller(residue_glyph_size) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't a brushing
    if (!d3.event.selection) return; // Ignore empty selections.

    // Round the two event extents to the nearest row
    d3.event.selection[0] = Math.ceil(d3.event.selection[0]/residue_glyph_size)*residue_glyph_size;
    d3.event.selection[1] = Math.ceil(d3.event.selection[1]/residue_glyph_size)*residue_glyph_size;

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);
  }

  function vertical_paddle_controllerEnd(residue_glyph_size, protein_family_data, column_frequencies, frequencyViewer) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    /* Save the range of the current vertical selection */
    let currentVerticalSelection = d3.brushSelection(this).map(function(o) { return o / residue_glyph_size});

    /* Get the fragments from the column*/
    let fragments = column_frequencies.getMostFrequentFragmentFromRange(currentVerticalSelection[0], currentVerticalSelection[1]);

    /* Iterate over each of the returned fragments */
    let currentSelectionFragments = [];
    fragments.forEach(function(fragment) {
      /* Get the highest occurring residue and it's frequency */
      currentSelectionFragments.push(_.max(_.toPairs(fragment), function(o){ return o[1] }));
    });

    /* Get the currently selected protein*/
    let currentProtein = _.find(protein_family_data, ["name", self.previousHorizontalSelection]);

    /* Get the residues that intersect with the vertical paddle*/
    let horizontalSelectedResidues = currentProtein.sequence.slice(currentVerticalSelection[0], currentVerticalSelection[1]);

    /* Render the frequency bars */
    frequencyViewer.render(currentSelectionFragments, protein_family_data.length, horizontalSelectedResidues);
  }

  return {
    horizontalBrushed   : horizontal_paddle_controller,
    verticalBrushed     : vertical_paddle_controller,
    verticalEnd         : vertical_paddle_controllerEnd,
    horizontalEnd       : horizontal_paddle_controllerEnd
  }

};