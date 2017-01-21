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
    // we want the height to be that of the 3D Viewers
    list.domHeight = App.leftViewer.getDimensions().height;

    // clear the dom of the previous list
    list.domElement.selectAll().remove();

    // append a new span for the list
    list.domElement
        .style("height", list.domHeight)
        .append("span") // span element
        // .attr("width", list.domWidth / 2) // the width is half the column
        // .attr("height", list.domHeight) // set the height
        .attr("class", "sequence") // set the styling to the sequence class
    ;
  }

  /* Render the sequence list */
  function render(sequence) {

    list.domElement.select("span")
        .selectAll(".residues")
        .data(sequence)
        .enter().append("span")
        .attr("class", "residue")
        .text(function(d) { return d; })
        .style("width", list.domWidth / 2)
        .style("background-color", function(d, i) { return colorbrewer.Spectral[10][i%10]; })
        ;

  }

  /* return the public-facing functions */
  return {
    init   : initialize,
    render : render
  };
};