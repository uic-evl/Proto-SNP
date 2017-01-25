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
            .range([0, Math.ceil((viewer.width-1)/viewer.residue_size)*viewer.residue_size])
        ;

    /* Get the halfway point of the x-range*/
    let xMid = xScale(max_sequence_length/2);

    /* Construct a color map using the residue codes*/
    let residueModel = new ResidueModel();

    /* Construct the horizontal Protein-selection paddle */
    viewer.horizonalPaddle = d3.brushY()
      .extent( [ [0, 0], [viewer.width, y_elements.length * viewer.residue_size] ])
      // .on("start", viewer.controller.horizontalStart)
      .on("brush", function(){ viewer.controller.horizontalBrushed.call(this, viewer.residue_size) });

    /* Construct the right vertical residue-selection paddle */
    viewer.leftVerticalPaddle = d3.brushX()
        .extent( [ [0, 0], [xMid, y_elements.length * viewer.residue_size] ])
        .on("brush", function(){ viewer.controller.verticalBrushed.call(this, viewer.residue_size) })
        ;

    /* Construct the right vertical residue-selection paddle */
    viewer.rightVerticalPaddle = d3.brushX()
        .extent( [ [xMid, 0], [viewer.width, y_elements.length * viewer.residue_size] ])
        .on("brush", function(){ viewer.controller.verticalBrushed.call(this, viewer.residue_size) })
    ;

    /* Invoke the tip in the context of your visualization */
    //viewer.svg.call(viewer.tooltip);

    /* Convert the data into a residue-based array */
    constructTrendImage(family)
        .then(function(data){
          /* Construct the image out of each residue  */
          viewer.svg.append("g")
              .selectAll("rect")
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

          /* Multiple Brushes help: http://bl.ocks.org/jssolichin/54b4995bd68275691a23*/
          viewer.brushes = viewer.svg.append("g")
            .attr("class", "brushes")
            .style("width", viewer.width)
            .style("height", viewer.residue_size * y_elements.length);


          /* Add the horizontal paddle to the trend image */
          viewer.brushes.append("g")
              .attr("class", "brush horizontal")
              .call(viewer.horizonalPaddle) // add the paddle
              .call(viewer.horizonalPaddle.move, [0, viewer.residue_size]) // initialize the position
          ;

          /* Add the left vertical paddle to the trend image*/
          viewer.brushes.append("g")
              .attr("class", "brush vertical-left")
              .call(viewer.leftVerticalPaddle)
              .call(viewer.leftVerticalPaddle.move, [0, viewer.residue_size])
          ;

          /* Add the right vertical paddle to the trend image*/
          viewer.brushes.append("g")
              .attr("class", "brush vertical-right")
              .call(viewer.rightVerticalPaddle)
              .call(viewer.rightVerticalPaddle.move, [0, viewer.residue_size])
              // HACK: There is an issue with the rush extent that doesn't start at 0
              .select("g.brush>.selection")
              .attr("x", Math.ceil((viewer.width/2)/viewer.residue_size)*viewer.residue_size)
          ;


          /* Remove the pointer events from the brush overlays to prevent:
           * 1: Deleting the brush on a wrong click
           * 2: Interference between brushes
          */
          viewer.brushes.selectAll('.overlay')
              .style("pointer-events", "none");

          // viewer.brushes.select("g.brush.vertical-right")
          // .call(viewer.rightVerticalPaddle.move, [-viewer.width/2, viewer.residue_size]);

        });
  }

  /* Return the publicly accessible functions*/
  return {
    init: initialize,
    render: render
  };

};