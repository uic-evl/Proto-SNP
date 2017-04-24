"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
const TrendImageController = function(options){

  /* Class private variable */
  let self = {
    currentHorizontalSelection : options.initHorizontalPosition,
    leftVerticalSelection      : options.initVerticalPosition.left,
    rightVerticalSelection     : options.initVerticalPosition.right
  };


  /* Get the position of the context line's pointer */
  function get_context_bar_position(currentPaddle, halfway) {
    let pointer_bar = 0;
    /* Get the position of the pointer bar */
    if(currentPaddle === "vertical-right") {
      pointer_bar = (d3.event.selection[0] + d3.event.selection[1] ) / 2.0 - options.trendImage.getXAxisScale()(halfway);
    }
    else {
      pointer_bar = (d3.event.selection[0] + d3.event.selection[1] )/2.0;
    }
    return pointer_bar;
  }


  function clamp_brush_sizes(currentVerticalSelection, prevPaddleSelection) {
    let brush_size = Math.abs(currentVerticalSelection[1] - currentVerticalSelection[0]);
    /* Our max brush size is 10*/
    if( brush_size > options.brushMaxSize){
      /* Check which side was brushed */
      if(currentVerticalSelection[0] === prevPaddleSelection[0]){
        currentVerticalSelection[1] = currentVerticalSelection[0] + options.brushMaxSize;
      }
      else {
        currentVerticalSelection[0] = currentVerticalSelection[1] - options.brushMaxSize;
      }
    }
    else if (brush_size < options.brushMinSize) {
      /* Check which side was brushed */
      if (currentVerticalSelection[0] === prevPaddleSelection[0]) {
        currentVerticalSelection[1] = currentVerticalSelection[0] + options.brushMinSize;
      }
      else {
        currentVerticalSelection[0] = currentVerticalSelection[1] - options.brushMinSize;
      }
    }
    return currentVerticalSelection;
  }


  /* Get the new selection */
  function get_vertical_selection(currentPaddle, halfway) {

    let residue_glyph_size = options.trendImage.getGlyphSize();

    // Round the two event extents to the nearest row
    d3.event.selection[0] = parseInt(Math.round(d3.event.selection[0]/residue_glyph_size)*residue_glyph_size);
    d3.event.selection[1] = parseInt(Math.round(d3.event.selection[1]/residue_glyph_size)*residue_glyph_size);

    /* Get the current protein */
    let currentVerticalSelection = d3.event.selection.map(options.trendImage.getXAxisScale().invert);
    // (It's sad that I have to do this -- Floating pt errors)
    currentVerticalSelection[0] = parseInt(Math.round(currentVerticalSelection[0]));
    currentVerticalSelection[1] = parseInt(Math.round(currentVerticalSelection[1]));

    /* Keep track of the current selection */
    if(currentPaddle === "vertical-right"){
      /* Check if paddle is past the half way mark of the trend image*/
      if(currentVerticalSelection[0] < halfway){
        currentVerticalSelection[0] = halfway;
        currentVerticalSelection[1] = self.rightVerticalSelection[1];
      }
      /* Clamp the brush size */
      currentVerticalSelection = clamp_brush_sizes(currentVerticalSelection, self.rightVerticalSelection);

      /* Reset the event selection */
      d3.event.selection = currentVerticalSelection.map(options.trendImage.getXAxisScale());
      self.rightVerticalSelection = currentVerticalSelection;
    }
    else {
      /* Check if paddle is past the half way mark of the trend image*/
      if(currentVerticalSelection[1] > halfway+1){
        currentVerticalSelection[1] = halfway+1;
        currentVerticalSelection[0] = self.leftVerticalSelection[0];
      }
      /* Clamp the brush size */
      currentVerticalSelection = clamp_brush_sizes(currentVerticalSelection, self.leftVerticalSelection);

      /* Reset the event selection */
      d3.event.selection = currentVerticalSelection.map(options.trendImage.getXAxisScale());
      self.leftVerticalSelection = currentVerticalSelection;
    }
    return currentVerticalSelection;
  }


  function horizontal_paddle_controller() {

    /* We only want to capture user events. */
    if (!d3.event.sourceEvent) return;
    if (!d3.event.selection) return; // Ignore empty selections.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't associated with a mouse move

    /* Get and store the residue glyph size */
    let residue_glyph_size = options.trendImage.getGlyphSize();

    // Round the two event extents to the nearest row
    d3.event.selection[0] = Math.floor(d3.event.selection[0]/residue_glyph_size)*residue_glyph_size;
    d3.event.selection[1] = Math.floor(d3.event.selection[1]/residue_glyph_size)*residue_glyph_size;

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);

    /* Get the current protein */
    let middle_selection = parseInt((d3.event.selection[0] + d3.event.selection[1])/2.0);
    self.currentHorizontalSelection = options.trendImage.getYAxisScale().invert(middle_selection);
    let currentProtein = _.find(options.trendImage.getProteinData(), ["name", self.currentHorizontalSelection]);

    /* Get the residues that intersect with the left vertical paddle*/
    let leftHorizontalSelectedResidues = currentProtein.sequence.slice(self.leftVerticalSelection[0], self.leftVerticalSelection[1]);
    /* Get the residues that intersect with the right vertical paddle*/
    let rightHorizontalSelectedResidues = currentProtein.sequence.slice(self.rightVerticalSelection[0], self.rightVerticalSelection[1]);

    /* Update the left frequency viewer text  */
    App.leftFrequencyViewer.update(leftHorizontalSelectedResidues);
    /* Update the right frequency viewer text  */
    App.rightFrequencyViewer.update(rightHorizontalSelectedResidues);
    /* Reset the opacity of unselected rows */
    d3.selectAll('rect.active_protein_selection')
      .classed("active_protein_selection", false);

    /* Set the opacity of the highlighted row */
    d3.selectAll('#p' + self.currentHorizontalSelection + " > rect")
      .classed("active_protein_selection", true);
  }


  function vertical_paddle_controller(frequencyChart) {
    if (!d3.event.sourceEvent) return; // Only transition after input.
    if (d3.event.sourceEvent.type === "brush") return; // if the event isn't a brushing
    if (!d3.event.selection) return; // Ignore empty selections.

    /* Get the current paddle and selection */
    let currentPaddle = d3.select(this).attr("class").split(" ")[1];
    let halfway = Math.ceil(options.trendImage.getXAxisSize()/2.0) ;

    /* Get the current selection and position of the frequency viewer context bar */
    let currentVerticalSelection = get_vertical_selection(currentPaddle, halfway);
    let pointer_bar = get_context_bar_position(currentPaddle, halfway);

    // Snap the brush onto the closest protein
    d3.select(this).call(d3.event.target.move, d3.event.selection);

    /* Remove the previous selection */
    d3.selectAll('rect.'+ currentPaddle + '.active_res_selection')
      .classed(currentPaddle, false)
      .classed("active_res_selection", false);

    /* Iterate over the selection and add the active class to the selected fragments */
    for(let i = currentVerticalSelection[0]; i < currentVerticalSelection[1]; i++) {
      d3.selectAll("[col='" + parseInt(i) + "']")
        .classed(currentPaddle, true)
        .classed("active_res_selection", true);
    }

    /* Get the fragments from the column*/
    let fragments = options.trendImage.getColumnFrequency().getFragmentCountsFromRange(currentVerticalSelection[0], currentVerticalSelection[1]);

    /* Iterate over each of the returned fragments */
    let currentSelectionFragments = [];
    fragments.forEach(function(fragment) {
      /* Get the highest occurring residue and it's frequency */
      currentSelectionFragments.push(_.max(_.toPairs(fragment), function(o){ return o[1] }));
    });

    /* Get the currently selected protein*/
    let currentProtein = _.find(options.trendImage.getProteinData(), ["name", d3.event.selection.map(options.trendImage.getYAxisScale().invert)[0]]);
    /* Get the residues that intersect with the vertical paddle*/
    let horizontalSelectedResidues = currentProtein.sequence.slice(currentVerticalSelection[0], currentVerticalSelection[1]);

    /* Render the frequency bars */
    frequencyChart.render(currentSelectionFragments, options.trendImage.getYAxisSize(), horizontalSelectedResidues, pointer_bar);
  }


  function get_selected_protein() { return self.currentHorizontalSelection }


  function get_selected_residue_ranges() { return { left: self.leftVerticalSelection, right: self.rightVerticalSelection} }


  return {
    horizontalBrushed   : horizontal_paddle_controller,
    verticalBrushed     : vertical_paddle_controller,
    getSelectedProtein  : get_selected_protein,
    getSelectedRanges   : get_selected_residue_ranges
  }

};