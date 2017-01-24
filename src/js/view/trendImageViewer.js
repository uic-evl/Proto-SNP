"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
var TrendImageViewer = function(){

  /* initialize the molecular viewer global variable */
  let viewer = {};

  function constructTrendImage(family) {

    /* New array for the parse residues */
    let data = [];

    /* Return a promise that will resolve with the new data array*/
    return new Promise(function(resolve, reject) {
      family.forEach(function(memberProtein) {
        memberProtein.sequence.forEach(function(residue,i){
          data.push({
            protein : memberProtein.name,
            x       : i,
            residue : residue
          })
        });
      });
      /* resolve the promise and return the data */
      resolve(data)
    });

  }

  function initialize(id) {

    /* get the DOM element by the id parameter */
    viewer.domObj = d3.select(id);

    /* get/save the width and height of the given DOM element */
    viewer.width = App.trendWidth;
    viewer.height = App.trendHeight;

    /* clear the trend image DOM */
    viewer.domObj.selectAll().remove();

    /* append a new svg trend image */
    viewer.domObj
        .style("width", viewer.width)
        .style("height", viewer.height)
    ;

  }

  function render(family) {

    /* Get the length of the longest sequence */
    let max_sequence_length = _.max(d3.set(family.map(function( residue ) { return residue.length; } )).values());

    /* Extract the names of the proteins. They will construct the y-axis*/
    let y_elements = d3.set(family.map(function( residue ) { return residue.name; } )).values();

    /* Get and save the size of each residue for the trend image based on the width of the screen */
    viewer.residue_size = Math.round(viewer.width / max_sequence_length);

    console.log(viewer.residue_size);

    /*Reset the width to account for the rounded size*/
    viewer.width = max_sequence_length * viewer.residue_size;

    /* construct the y-scale */
    let yScale = d3.scale.ordinal()
            .domain(y_elements)
            .rangeBands([0, y_elements.length * viewer.residue_size])
        ;

    /* construct the x-scale */
    let xScale = d3.scale.linear()
            .domain([0, max_sequence_length])
            .range([0, viewer.width])
        ;

    /* Construct a color map using the residue codes*/
    let residueModel = new ResidueModel();

    /* Add the svg to the trend image dom*/
    let svg = viewer.domObj
            .append("svg") //svg
            .attr("class", "trendImage")
            .style("width", viewer.width)
            .style("height", viewer.height)
            .append("g")
        ;

    /* Convert the data into a residue-based array */
    constructTrendImage(family)
        .then(function(data){
          /* Construct the image out of each residue  */
          svg.selectAll("rect")
              .data(data)
              .enter().append('g').append('rect')
              .attr("class", "aminoAcid")
              .attr("width", viewer.residue_size)
              .attr("height", viewer.residue_size)
              .attr('y', function(d) { return yScale(d.protein) })
              .attr('x', function(d) { return xScale(d.x) })
              .attr('fill', function(d) { return residueModel.getColor(d.residue); })
          ;
        });

  }

  /* Return the publicly accessible functions*/
  return {
    init: initialize,
    render: render
  };

};