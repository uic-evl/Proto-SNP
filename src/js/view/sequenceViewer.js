"use strict";

// global application variable
var App = App || {};

// Protein Sequence Viewer "Class"
var SequenceViewer = function(){

  /* initialize the sequence viewer global variable */
  let list = {};

  /* Initialize the sequence view */
  function initialize(id, options){

    // Grab the dom element for the list
    list.domElement = d3.select(id);

    // Get the width and height
    list.domWidth = list.domElement.node().clientWidth;

    // clear the dom of the previous list
    list.domElement.selectAll().remove();

    // append a new SVG
    list.domElement
        .append("svg")
        .attr("width", list.domWidth);
  }

  /* Render the sequence list */
  function render(sequence) {

    let blockHeight = 100,
        blockWidth = 100;

    list.domElement.select("svg")
        .append("g")
        .selectAll("rect")
        .data(sequence)
        .enter().append("rect")
        .attr('y', function(d, i) { console.log(arguments); return i * blockHeight; })
        .attr("height", blockHeight)
        .attr("width", list.domWidth)
        ;

  }

  /* return the public-facing functions */
  return {
    init   : initialize,
    render : render
  };
};