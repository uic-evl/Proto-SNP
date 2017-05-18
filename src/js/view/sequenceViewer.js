"use strict";

// global application variable
var App = App || {};

// Protein Sequence Viewer "Class"
let SequenceViewer = function(){

  /* initialize the sequence viewer global variable */
  let list = {};

  /* Initialize the sequence view */
  function initialize(id, options){

    let domElement = document.getElementById("sequenceViewer");
    /* Get the width and height */
    // The width is twice the client width because of bootstrap
    list.domWidth  = domElement.clientWidth;
    // we want the height to be that of the 3D Viewers
    list.domHeight = domElement.clientHeight;

    // clear the dom of the previous list
    d3.select(id).selectAll().remove();

    // append a new span for the list
    d3.select(id)
        .style("height", list.domHeight)
        .append("span") // span element
        .attr("class", "sequence") // set the styling to the sequence class
    ;

    /* Remove the black background from the viewers*/
    d3.select(domElement)
        .classed("black-background", false);

    d3.select(domElement).selectAll(".col-md-6")
        .classed("black-background", false);

  }

  /* Render the sequence list */
  function render(id, sequence) {
    /* Add a span to the list view and populate it with the residues */
    let view = d3.select(id).select("span")
        .selectAll("span")
        // JOIN: Add the data to the Dom
        .data(sequence);
    // UPDATE: add new elements if needed
    view
        .enter().append("span")
        .attr("class", "residue")
        /* Merge the old elements (if they exist) with the new data */
        .merge(view)
          .text(function(d, i) { return "(" + parseInt(i+1) + ") " + d; })
        .style("width", list.domWidth / 2)
        // EXIT: Remove unneeded DOM elements
        .exit().remove();

  }

  /* return the public-facing functions */
  return {
    init   : initialize,
    render : render
  };
};