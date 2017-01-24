"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageViewer = function(){

  /* initialize the molecular viewer global variable */
  let viewer = {};

  function constructTrendImage() {

  }

  function initialize(id) {

    /* get the DOM element by the id parameter */
    viewer.domObj = d3.select(id).node();

    /* get/save the width and height of the given DOM element */
    viewer.width = App.trendWidth;
    viewer.height = App.trendHeight;

    /* clear the trend image DOM */
    d3.select(id).selectAll().remove();

    /* append a new svg trend image */
    d3.select(id)
      .style("width", viewer.width)
      .style("height", viewer.height)
      .append("svg") //svg
      .attr("class", "trendImage")
      .style("width", viewer.width)
      .style("height", viewer.height)
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