"use strict";

// global application variable
var App = App || {};

// Frequency Viewer "Class"
const FrequencyViewer = function(options){

  /* Class private variable */
  let frequencyViewer = {};



  /* Render the line above the bars */
  function render_context_lines() {
    /* Add the context bar above viewers */
    let context = frequencyViewer.svg
        .selectAll(".context-bar").data(frequencyViewer.contextPoints)
        .enter().append("path")
        .attr("d", (d) => { return lineFunction(d)})
        .attr("class", "context-bar");
  }


  /* Render the pointer bar */
  function render_context_bars() {
    /* Add the context bar above viewers */
    let context = frequencyViewer.svg
        .selectAll(".context-line").data(frequencyViewer.contextBarPoints);

    context.enter().append("path")
        .merge(context)
        .attr("d", (d) => {return lineFunction(d)})
        .attr("class", "context-line");

    /* Remove the unneeded selection labels */
    context.exit().remove();
  }


  /* Render with the selected residues */
  function render(residue_frequencies, family_member_count, selected_residues, bar_position) {

    if(frequencyViewer.id === "#leftResidueSummaryViewer"){
      frequencyViewer.contextBarPoints = [[{x: options.offset*2 + bar_position, y:0},
                                           {x: options.offset*2 + bar_position, y: 10}]];
    }
    else {
      frequencyViewer.contextBarPoints = [[{x: bar_position, y:0},
                                           {x: bar_position, y: 10}]];
    }
    render_context_bars();
  }


  return {
    render    : render
  };

};