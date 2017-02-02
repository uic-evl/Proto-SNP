"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageController = function(){

  /* Class private variable */
  let self = {};

  function horizontal_paddle_controller(trendImage) {

    /* We only want to capture user events. */
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return; // Ignore empty selections.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't associated with a mouse move

    /* Get and store the residue glyph size */
    let residue_glyph_size = trendImage.getGlyphSize();

    // Round the two event extents to the nearest row
    d3.event.selection[0] = Math.ceil(d3.event.selection[0]/residue_glyph_size)*residue_glyph_size;
    d3.event.selection[1] = Math.ceil(d3.event.selection[1]/residue_glyph_size)*residue_glyph_size;

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);

    /* Get the current protein */
    let currentHorizontalSelection = d3.event.selection.map(trendImage.getYAxisScale().invert)[0];

    /* Reset the opacity of unselected rows */
    d3.selectAll('rect.active_protein_selection')
      .classed("active_protein_selection", false);

    /* Set the opacity of the highlighted row */
    d3.selectAll('.p' + currentHorizontalSelection)
      .classed("active_protein_selection", true);
  }

  function horizontal_paddle_controllerEnd(trendImage) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    /* Update the frequency viewer's text */
    /* Get the currently selected protein*/
    let currentProtein = _.find(trendImage.getProteinData(), ["name", d3.event.selection.map(trendImage.getYAxisScale().invert)[0]]);

    /* Get the left vertical selection */
    let leftVerticalSelection = d3.brushSelection( d3.select('g.brush.vertical-left').node() ).map(trendImage.getXAxisSize().invert);

    /* Get the right vertical selection */
    let rightVerticalSelection = d3.brushSelection( d3.select('g.brush.vertical-right').node() ).map(trendImage.getXAxisSize().invert);

    /* Get the residues that intersect with the left vertical paddle*/
    let leftHorizontalSelectedResidues = currentProtein.sequence.slice(leftVerticalSelection[0], leftVerticalSelection[1]);

    /* Get the residues that intersect with the right vertical paddle*/
    let rightHorizontalSelectedResidues = currentProtein.sequence.slice(rightVerticalSelection[0], rightVerticalSelection[1]);

    /* Update the left frequency viewer text  */
    App.leftFrequencyViewer.update(leftHorizontalSelectedResidues);

    /* Update the right frequency viewer text  */
    App.rightFrequencyViewer.update(rightHorizontalSelectedResidues);
  }

  function vertical_paddle_controller(trendImage) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't a brushing
    if (!d3.event.selection) return; // Ignore empty selections.

    /* Get and store the residue glyph size */
    let residue_glyph_size = trendImage.getGlyphSize();

    // Round the two event extents to the nearest row
    d3.event.selection[0] = parseInt(Math.round(d3.event.selection[0]/residue_glyph_size)*residue_glyph_size);
    d3.event.selection[1] = parseInt(Math.round(d3.event.selection[1]/residue_glyph_size)*residue_glyph_size);

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);

    /* Get the current protein */
    let currentVerticalSelection = d3.event.selection.map(trendImage.getXAxisSize().invert);

    /* Get the current paddle */
    let currentPaddle = d3.select(this).attr("class").split(" ")[1];

    /* Remove the previous selection */
    d3.selectAll('rect.'+ currentPaddle + '.active_res_selection')
      .classed(currentPaddle, false)
      .classed("active_res_selection", false);

    /* Iterate over the selection and add the active class to the selected fragments */
    for(let i = currentVerticalSelection[0]; i < currentVerticalSelection[1]; i++) {
      d3.selectAll("rect[class$='r" + parseInt(i) + "']")
        .classed(currentPaddle, true)
        .classed("active_res_selection", true);
    }
  }

  function vertical_paddle_controllerEnd(trendImage) {

    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (!d3.event.selection) return; // Ignore empty selections.

    /* Get and store the residue glyph size */
    let residue_glyph_size = trendImage.getGlyphSize();

    /* Save the range of the current vertical selection */
    let currentVerticalSelection = d3.brushSelection(this).map(function(o) { return o / residue_glyph_size});

    /* Get the fragments from the column*/
    let fragments = trendImage.getColumnFrequency().getMostFrequentFragmentFromRange(currentVerticalSelection[0], currentVerticalSelection[1]);

    /* Iterate over each of the returned fragments */
    let currentSelectionFragments = [];
    fragments.forEach(function(fragment) {
      /* Get the highest occurring residue and it's frequency */
      currentSelectionFragments.push(_.max(_.toPairs(fragment), function(o){ return o[1] }));
    });

    /* Get the currently selected protein*/
    let currentProtein = _.find(trendImage.getProteinData(), ["name", d3.event.selection.map(trendImage.getYAxisScale().invert)[0]]);

    /* Get the residues that intersect with the vertical paddle*/
    let horizontalSelectedResidues = currentProtein.sequence.slice(currentVerticalSelection[0], currentVerticalSelection[1]);

    /* Render the frequency bars */
    trendImage.getColumnFrequency().render(currentSelectionFragments, trendImage.getXAxisSize(), horizontalSelectedResidues);
  }

  return {
    horizontalBrushed   : horizontal_paddle_controller,
    verticalBrushed     : vertical_paddle_controller,
    verticalEnd         : vertical_paddle_controllerEnd,
    horizontalEnd       : horizontal_paddle_controllerEnd
  }

};