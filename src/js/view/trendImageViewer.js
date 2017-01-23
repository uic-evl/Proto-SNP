"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageViewer = function(){

  /* initialize the molecular viewer global variable */
  let viewer = {};

  function constructTrendImage() {

  }

  function initialize(id, options) {

    /* get the DOM element by the id parameter */
    viewer.domObj = d3.select(id).node();

    /* check if viewing options were passed in */
    options = options || {};

    /* get/save the width and height of the given DOM element */
    viewer.width = App.trendWidth;
    viewer.height = App.trendWidth * App.aspectRatio;

    /* add the width and height to the options */
    options.width = viewer.width;
    options.height = viewer.height;

    /* clear the trend image DOM */
    d3.select(id).selectAll().remove();

    /* append a new svg trend image */
    d3.select(id)
      .style("height", viewer.height)
      .append("svg") //svg
      .attr("class", "trendImage") // set the styling to the trend image class
    ;

  }

  function render(family) {

  }

  /* Return the publicly accessible functions*/
  return {
    init: initialize,
    render: render
  };

};