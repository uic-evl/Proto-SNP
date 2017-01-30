"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageController = function(){

  /* Class private variable */
  let self = {};

  function horizontal_paddle_controller(residue_glyph_size,  yScale) {

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

  function horizontal_paddle_controllerEnd(protein_family_data) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    /* Update the frequency viewer's text */
    /* Get the currently selected protein*/
    let currentProtein = _.find(protein_family_data, ["name", self.previousHorizontalSelection]);

    /* Get the residues that intersect with the vertical paddle*/
    let horizontalSelectedResidues = currentProtein.sequence.slice(self.currentVerticalSelection[0], self.currentVerticalSelection[1]);

    /* Update the frequency viewer text  */
    App.leftFrequencyViewer.update(horizontalSelectedResidues);
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

  function vertical_paddle_controllerEnd(residue_glyph_size, xScale, protein_family_data, column_frequencies) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    /* Save the range of the current vertical selection */
    self.currentVerticalSelection = d3.event.selection.map(function(o) { return o / residue_glyph_size});

    /* Get the fragments from the column*/
    let fragments = column_frequencies.getMostFrequentFragmentFromRange(self.currentVerticalSelection[0], self.currentVerticalSelection[1]);

    /* Iterate over each of the returned fragments */
    let currentSelectionFragments = [];
    fragments.forEach(function(fragment) {
      /* Get the highest occurring residue and it's frequency */
      currentSelectionFragments.push(_.max(_.toPairs(fragment), function(o){ return o[1] }));
    });

    /* Get the currently selected protein*/
    let currentProtein = _.find(protein_family_data, ["name", self.previousHorizontalSelection]);

    /* Get the residues that intersect with the vertical paddle*/
    let horizontalSelectedResidues = currentProtein.sequence.slice(self.currentVerticalSelection[0], self.currentVerticalSelection[1]);

    /* Render the frequency bars */
    App.leftFrequencyViewer.render(currentSelectionFragments, protein_family_data.length, horizontalSelectedResidues);

  }

  function get_selected_protein() { return self.previousHorizontalSelection }

  function get_selected_residues() { return self.currentVerticalSelection; }

  return {
    horizontalBrushed   : horizontal_paddle_controller,
    verticalBrushed     : vertical_paddle_controller,
    verticalEnd         : vertical_paddle_controllerEnd,
    horizontalEnd       : horizontal_paddle_controllerEnd,
    getSelectedProtein  : get_selected_protein,
    getSelectedResidues : get_selected_residues
  }

};