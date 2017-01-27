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

  /* Function to create the three brush paddles*/
  function createBrushes(x_axis_length, y_axis_length, xScale, yScale, protein_family_data) {

    /* Get the halfway point of the x-range*/
    let x_midpoint = xScale(x_axis_length/2);

    /* Construct the horizontal Protein-selection paddle */
    trendImageViewer.horizonalPaddle = d3.brushY()
      .extent( [ [0, 0], [trendImageViewer.width, y_axis_length * trendImageViewer.residue_glyph_size] ])
      // .on("start", trendImageViewer.controller.horizontalStart)
      .on("brush", function(){ trendImageViewer.controller.horizontalBrushed.call(this, trendImageViewer.residue_glyph_size, yScale) })
      .on("end", function(){trendImageViewer.controller.horizontalEnd.call(this, yScale)})
    ;

    /* Construct the right vertical residue-selection paddle */
    trendImageViewer.leftVerticalPaddle = d3.brushX()
      .extent( [ [0, 0], [x_midpoint, y_axis_length * trendImageViewer.residue_glyph_size] ])
      .on("brush", function(){ trendImageViewer.controller.verticalBrushed.call(this, trendImageViewer.residue_glyph_size) })
      .on("end", function(){trendImageViewer.controller.verticalEnd.call(this, xScale, protein_family_data)})
    ;

    // /* Construct the right vertical residue-selection paddle */
    // trendImageViewer.rightVerticalPaddle = d3.brushX()
    //   .extent( [ [x_midpoint, 0], [trendImageViewer.width, y_axis_length * trendImageViewer.residue_glyph_size] ])
    //   .on("brush", function(){ trendImageViewer.controller.verticalBrushed.call(this, trendImageViewer.residue_glyph_size) })
    // ;
  }

  /* Function to add the three brush paddles to the svg*/
  function addBrushes(y_axis_length) {
    /* Multiple Brushes help: http://bl.ocks.org/jssolichin/54b4995bd68275691a23*/
    trendImageViewer.brushes = trendImageViewer.svg.append("g")
      .attr("class", "brushes")
      .style("width", trendImageViewer.width)
      .style("height", trendImageViewer.residue_glyph_size * y_axis_length);

    /* Add the horizontal paddle to the trend image */
    trendImageViewer.brushes.append("g")
      .attr("class", "brush horizontal")
      .call(trendImageViewer.horizonalPaddle) // add the paddle
      .call(trendImageViewer.horizonalPaddle.move, [0, trendImageViewer.residue_glyph_size]) // initialize the position
    ;

    /* Add the left vertical paddle to the trend image*/
    trendImageViewer.brushes.append("g")
      .attr("class", "brush vertical-left")
      .call(trendImageViewer.leftVerticalPaddle)
      .call(trendImageViewer.leftVerticalPaddle.move, [0, trendImageViewer.residue_glyph_size])
    ;

    /* Add the right vertical paddle to the trend image*/
    // trendImageViewer.brushes.append("g")
    //     .attr("class", "brush vertical-right")
    //     .call(trendImageViewer.rightVerticalPaddle)
    //     .call(trendImageViewer.rightVerticalPaddle.move, [0, trendImageViewer.residue_glyph_size])
    //     // HACK: There is an issue with the rush extent that doesn't start at 0
    //     .select("g.brush>.selection")
    //     .attr("x", Math.ceil((trendImageViewer.width/2)/trendImageViewer.residue_glyph_size)*trendImageViewer.residue_glyph_size)
    // ;
  }

  function render(protein_family_data) {

    /* Get the length of the longest sequence */
    let x_axis_length = _.max(d3.set(protein_family_data.map(function( residue ) { return residue.length; } )).values());

    /* Extract the names of the proteins. They will construct the y-axis*/
    let y_elements = d3.set(protein_family_data.map(function( residue ) { return residue.name; } )).values();

    /* Get and save the size of each residue for the trend image based on the width of the screen */
    trendImageViewer.residue_glyph_size = Math.round(trendImageViewer.width / x_axis_length);

    /* construct the y-scale */
    let yScale = d3.scaleBand()
            .domain(y_elements)
            .range([0, y_elements.length * trendImageViewer.residue_glyph_size])
        ;

    /* construct the x-scale */
    let xScale = d3.scaleLinear()
            .domain([0, x_axis_length])
            .range([0, Math.ceil((trendImageViewer.width-1)/trendImageViewer.residue_glyph_size)*trendImageViewer.residue_glyph_size])
        ;

    /* Create the three brushes */
    createBrushes(x_axis_length, y_elements.length, xScale, yScale, protein_family_data);

    /* Construct a color map using the residue codes*/
    let residueModel = new ResidueModel();

    /* Invoke the tip in the context of your visualization */
    //trendImageViewer.svg.call(trendImageViewer.tooltip);

    /* Convert the data into a residue-based array */
    constructTrendImage(protein_family_data)
        .then(function(data){
          /* Construct the image out of each residue  */
          trendImageViewer.svg.append("g")
              .selectAll("rect")
              .data(data)
              .enter().append('g')
              .attr("class", "aminoAcid")
              .append('rect')
              .attr("class", function(d, i) { return "p" + d.protein + " r" + i; })
              .attr("width", trendImageViewer.residue_glyph_size)
              .attr("height", trendImageViewer.residue_glyph_size)
              .attr('y', function(d) { return yScale(d.protein) })
              .attr('x', function(d) { return xScale(d.x) })
              .attr('fill', function(d) { return residueModel.getColor(d.residue); })
              .attr('stroke', "none")
            // .on('mouseover', trendImageViewer.tooltip.show)
            // .on('mouseout', trendImageViewer.tooltip.hide)
          ;

          /*Add the brushes to the trend image*/
          addBrushes(y_elements.length);

          /* Remove the pointer events from the brush overlays to prevent:
           * 1: Deleting the brush on a wrong click
           * 2: Interference between brushes
          */
          trendImageViewer.brushes.selectAll('.overlay')
              .style("pointer-events", "none");

          trendImageViewer.brushes.selectAll('.selection')
              .style("shape-rendering", "auto");

          /* Set the first highlighted row's opacity */
          d3.selectAll('.p' + y_elements[0])
            .attr("class", "p" +  y_elements[0] + " active-selection");

        });
  }

  /* Return the publicly accessible functions*/
  return {
    init: initialize,
    render: render
  };

};