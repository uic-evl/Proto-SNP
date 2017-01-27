"use strict";

// global application variable
var App = App || {};

// Protein / Molecule trendImageViewer "Class"
var TrendImageViewer = function(){

  /* initialize the molecular trendImageViewer global variable */
  let trendImageViewer = {};

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
    trendImageViewer.domObj = d3.select(id);

    /* get/save the width and height of the given DOM element */
    trendImageViewer.width = App.trendWidth;
    trendImageViewer.height = App.trendHeight;

    /* clear the trend image DOM */
    trendImageViewer.domObj.selectAll().remove();

    /* append a new svg trend image */
    trendImageViewer.domObj
        .style("width", trendImageViewer.width)
        .style("height", trendImageViewer.height)
    ;

    /* Trend Image Tooltip */
    trendImageViewer.tooltip  = d3.tip().attr('class', 'd3-tip').html(
      function(d) {
        return d.residue;
      });

    /* Trend Image interaction controller */
    trendImageViewer.controller = new TrendImageController();

    /* Add the svg to the trend image dom*/
    trendImageViewer.svg = trendImageViewer.domObj
        .append("svg") //svg
        .attr("class", "trendImage")
        .style("width", trendImageViewer.width)
        .style("height", trendImageViewer.height)
      ;
  }

  function render(family) {

    /* Get the length of the longest sequence */
    let max_sequence_length = _.max(d3.set(family.map(function( residue ) { return residue.length; } )).values());

    /* Extract the names of the proteins. They will construct the y-axis*/
    let y_elements = d3.set(family.map(function( residue ) { return residue.name; } )).values();

    /* Get and save the size of each residue for the trend image based on the width of the screen */
    trendImageViewer.residue_size = Math.round(trendImageViewer.width / max_sequence_length);

    /* construct the y-scale */
    let yScale = d3.scaleBand()
            .domain(y_elements)
            .range([0, y_elements.length * trendImageViewer.residue_size])
        ;

    /* construct the x-scale */
    let xScale = d3.scaleLinear()
            .domain([0, max_sequence_length])
            .range([0, Math.ceil((trendImageViewer.width-1)/trendImageViewer.residue_size)*trendImageViewer.residue_size])
        ;

    /* Get the halfway point of the x-range*/
    let xMid = xScale(max_sequence_length/2);

    /* Construct a color map using the residue codes*/
    let residueModel = new ResidueModel();

    /* Construct the horizontal Protein-selection paddle */
    trendImageViewer.horizonalPaddle = d3.brushY()
      .extent( [ [0, 0], [trendImageViewer.width, y_elements.length * trendImageViewer.residue_size] ])
      // .on("start", trendImageViewer.controller.horizontalStart)
      .on("brush", function(){ trendImageViewer.controller.horizontalBrushed.call(this, trendImageViewer.residue_size, yScale) })
      .on("end", function(){trendImageViewer.controller.horizontalEnd.call(this, yScale)})
      ;

    /* Construct the right vertical residue-selection paddle */
    trendImageViewer.leftVerticalPaddle = d3.brushX()
        .extent( [ [0, 0], [xMid, y_elements.length * trendImageViewer.residue_size] ])
        .on("brush", function(){ trendImageViewer.controller.verticalBrushed.call(this, trendImageViewer.residue_size) })
        .on("end", function(){trendImageViewer.controller.verticalEnd.call(this, xScale, family)})
        ;

    /* Construct the right vertical residue-selection paddle */
    trendImageViewer.rightVerticalPaddle = d3.brushX()
        .extent( [ [xMid, 0], [trendImageViewer.width, y_elements.length * trendImageViewer.residue_size] ])
        .on("brush", function(){ trendImageViewer.controller.verticalBrushed.call(this, trendImageViewer.residue_size) })
    ;

    /* Invoke the tip in the context of your visualization */
    //trendImageViewer.svg.call(trendImageViewer.tooltip);

    /* Convert the data into a residue-based array */
    constructTrendImage(family)
        .then(function(data){
          /* Construct the image out of each residue  */
          trendImageViewer.svg.append("g")
              .selectAll("rect")
              .data(data)
              .enter().append('g')
              .attr("class", "aminoAcid")
              .append('rect')
              .attr("class", function(d, i) { return "p" + d.protein + " r" + i; })
              .attr("width", trendImageViewer.residue_size)
              .attr("height", trendImageViewer.residue_size)
              .attr('y', function(d) { return yScale(d.protein) })
              .attr('x', function(d) { return xScale(d.x) })
              .attr('fill', function(d) { return residueModel.getColor(d.residue); })
              .attr('stroke', "none")
            // .on('mouseover', trendImageViewer.tooltip.show)
            // .on('mouseout', trendImageViewer.tooltip.hide)
          ;

          /* Multiple Brushes help: http://bl.ocks.org/jssolichin/54b4995bd68275691a23*/
          trendImageViewer.brushes = trendImageViewer.svg.append("g")
            .attr("class", "brushes")
            .style("width", trendImageViewer.width)
            .style("height", trendImageViewer.residue_size * y_elements.length);

          /* Add the horizontal paddle to the trend image */
          trendImageViewer.brushes.append("g")
              .attr("class", "brush horizontal")
              .call(trendImageViewer.horizonalPaddle) // add the paddle
              .call(trendImageViewer.horizonalPaddle.move, [0, trendImageViewer.residue_size]) // initialize the position
          ;

          /* Add the left vertical paddle to the trend image*/
          trendImageViewer.brushes.append("g")
              .attr("class", "brush vertical-left")
              .call(trendImageViewer.leftVerticalPaddle)
              .call(trendImageViewer.leftVerticalPaddle.move, [0, trendImageViewer.residue_size])
          ;

          /* Add the right vertical paddle to the trend image*/
          // trendImageViewer.brushes.append("g")
          //     .attr("class", "brush vertical-right")
          //     .call(trendImageViewer.rightVerticalPaddle)
          //     .call(trendImageViewer.rightVerticalPaddle.move, [0, trendImageViewer.residue_size])
          //     // HACK: There is an issue with the rush extent that doesn't start at 0
          //     .select("g.brush>.selection")
          //     .attr("x", Math.ceil((trendImageViewer.width/2)/trendImageViewer.residue_size)*trendImageViewer.residue_size)
          // ;

          /* Remove the pointer events from the brush overlays to prevent:
           * 1: Deleting the brush on a wrong click
           * 2: Interference between brushes
          */
          trendImageViewer.brushes.selectAll('.overlay')
              .style("pointer-events", "none");

          trendImageViewer.brushes.selectAll('.selection')
              .style("shape-rendering", "auto");

          // trendImageViewer.brushes.select("g.brush.vertical-right")
          // .call(trendImageViewer.rightVerticalPaddle.move, [-trendImageViewer.width/2, trendImageViewer.residue_size]);

        });
  }

  /* Return the publicly accessible functions*/
  return {
    init: initialize,
    render: render
  };

};