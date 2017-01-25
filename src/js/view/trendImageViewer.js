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

    /* Trend Image Tooltip */
    viewer.tooltip  = d3.tip().attr('class', 'd3-tip').html(
      function(d) {
        return d.residue;
      });

    /* Trend Image interaction controller */
    viewer.controller = new TrendImageController();

    /* Add the svg to the trend image dom*/
    viewer.svg = viewer.domObj
        .append("svg") //svg
        .attr("class", "trendImage")
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

    /* construct the y-scale */
    let yScale = d3.scaleBand()
            .domain(y_elements)
            .range([0, y_elements.length * viewer.residue_size])
        ;

    /* construct the x-scale */
    let xScale = d3.scaleLinear()
            .domain([0, max_sequence_length])
            .range([0, viewer.width])
        ;

    /* Construct a color map using the residue codes*/
    let residueModel = new ResidueModel();

    /* Construct the horizontal Protein-selection paddle */
    viewer.horizonalPaddle = d3.brushY()
      .extent( [ [0, 0], [viewer.width, y_elements.length * viewer.residue_size] ])
      // .on("start", viewer.controller.horizontalStart)
      .on("brush", function(){ viewer.controller.horizontalBrushed.call(this, viewer.residue_size) });

    /* Append a group to the svg for the rows */
    let g = viewer.svg.append("g");

    /* Invoke the tip in the context of your visualization */
    viewer.svg.call(viewer.tooltip);

    /* Convert the data into a residue-based array */
    constructTrendImage(family)
        .then(function(data){
          /* Construct the image out of each residue  */
          g.selectAll("rect")
              .data(data)
              .enter().append('g')
              .append('rect')
              .attr("class", "aminoAcid")
              .attr("width", viewer.residue_size)
              .attr("height", viewer.residue_size)
              .attr('y', function(d) { return yScale(d.protein) })
              .attr('x', function(d) { return xScale(d.x) })
              .attr('fill', function(d) { return residueModel.getColor(d.residue); })
              .attr('stroke', function(d) { return residueModel.getColor(d.residue); })
            // .on('mouseover', viewer.tooltip.show)
            // .on('mouseout', viewer.tooltip.hide)
          ;

          /* Add the horizontal brush to the trend image*/
          viewer.svg.append("g")
            .attr("class", "brush")
            .style("width", viewer.width)
            .style("height", viewer.residue_size * y_elements.length)
            .call(viewer.horizonalPaddle)
            // initialize the starting selection
            .call(viewer.horizonalPaddle.move, [0, viewer.residue_size])
          ;

        });
  }

  /* Return the publicly accessible functions*/
  return {
    init: initialize,
    render: render
  };

};