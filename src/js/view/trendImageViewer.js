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

  function initialize(div_id, column_frequencies) {

    /* get the DOM element by the id parameter */
    trendImageViewer.domObj = d3.select(div_id);

    /* get/save the width and height of the given DOM element */
    trendImageViewer.width = App.trendWidth;
    trendImageViewer.height = App.trendHeight;

    /* clear the trend image DOM */
    trendImageViewer.domObj.selectAll().remove();

    /* Trend Image Tooltip */
    trendImageViewer.tooltip  = d3.tip().attr('class', 'd3-tip').html(
      function(d) {
        return d.residue;
      });

    /* Trend Image interaction controller */
    trendImageViewer.controller = new TrendImageController();

    /* Save the frequencies for the columns */
    trendImageViewer.column_frequencies = column_frequencies;

    /* Add the svg to the trend image dom*/
    trendImageViewer.svg = trendImageViewer.domObj
        .append("svg") //svg
        .attr("class", "trendImage")
        .style("width", trendImageViewer.width)
        .style("height", trendImageViewer.height)
      ;

    /* Set the size of the initial vertical paddles */
    trendImageViewer.verticalPaddleSize = 6;
  }

  /* Initialized the frequency viewers */
  function initialize_frequency_viewers(protein_family_data) {
    /* Get the currently selected protein and the selected residues */
    let currentProtein = protein_family_data[0];

    /* Get the length of the sequence */
    let sequence_length = currentProtein.sequence.length;

    /* Get the selected residues from the left paddle */
    let leftSelectedResidues = [0, trendImageViewer.verticalPaddleSize];

    /* Get the selected residues from the left paddle */
    let rightSelectedResidues = [sequence_length - trendImageViewer.verticalPaddleSize, sequence_length];

    /* Get the fragments from the left column*/
    let leftFragments = trendImageViewer.column_frequencies
      .getMostFrequentFragmentFromRange(leftSelectedResidues[0], leftSelectedResidues[1]);

    /* Get the fragments from the right column*/
    let rightFragments = trendImageViewer.column_frequencies
      .getMostFrequentFragmentFromRange(rightSelectedResidues[0], rightSelectedResidues[1]);

    /* Iterate over each of the left returned fragments */
    let leftSelectionFragments = [];
    leftFragments.forEach(function(fragment) {
      /* Get the highest occurring residue and it's frequency */
      leftSelectionFragments.push(_.max(_.toPairs(fragment), function(o){ return o[1] }));
    });

    /* Iterate over each of the right returned fragments */
    let rightSelectionFragments = [];
    rightFragments.forEach(function(fragment) {
      /* Get the highest occurring residue and it's frequency */
      rightSelectionFragments.push(_.max(_.toPairs(fragment), function(o){ return o[1] }));
    });


    /* Get the residues that intersect with the left vertical paddle*/
    let leftHorizontalSelectedResidues = currentProtein.sequence.slice(leftSelectedResidues[0], leftSelectedResidues[1]);

    /* Get the residues that intersect with the vertical paddle*/
    let rightHorizontalSelectedResidues = currentProtein.sequence.slice(rightSelectedResidues[0], rightSelectedResidues[1]);


    /* Initialize the frequency viewers*/
    App.leftFrequencyViewer.init("#leftResidueSummaryViewer");
    App.rightFrequencyViewer.init("#rightResidueSummaryViewer");

    /* Render the frequency view*/
    App.leftFrequencyViewer.render(leftSelectionFragments, protein_family_data.length, leftHorizontalSelectedResidues );
    App.rightFrequencyViewer.render(leftSelectionFragments, protein_family_data.length, rightHorizontalSelectedResidues );
  }

  /* Function to create the three brush paddles*/
  function create_brushes(x_axis_length, y_axis_length, xScale, yScale, protein_family_data) {

    /* Construct the horizontal Protein-selection paddle */
    trendImageViewer.horizonalPaddle = d3.brushY()
      .extent( [ [0, 0], [x_axis_length, y_axis_length * trendImageViewer.residue_glyph_size] ])
      // .on("start", trendImageViewer.controller.horizontalStart)
      .on("brush", function(){ trendImageViewer.controller.horizontalBrushed.call(this, trendImageViewer.residue_glyph_size, yScale) })
      .on("end", function(){trendImageViewer.controller.horizontalEnd.call(this, protein_family_data, xScale, yScale)})
    ;

    /* Construct the right vertical residue-selection paddle */
    trendImageViewer.leftVerticalPaddle = d3.brushX()
      .extent( [ [0, 0], [x_axis_length, y_axis_length * trendImageViewer.residue_glyph_size] ])
      .on("brush", function(){ trendImageViewer.controller.verticalBrushed.call(this, trendImageViewer.residue_glyph_size, xScale) })
    ;

    /* Construct the right vertical residue-selection paddle */
    trendImageViewer.rightVerticalPaddle = d3.brushX()
        .extent( [ [0, 0], [trendImageViewer.width, y_axis_length * trendImageViewer.residue_glyph_size] ])
        .on("brush", function(){ trendImageViewer.controller.verticalBrushed.call(this, trendImageViewer.residue_glyph_size, xScale) })
    ;

    /* Once the column frequency sorting is complete, enable the brushing callbacks*/
    trendImageViewer.column_frequencies.getPromise().then(function(){

      /* Enable the paddle brushing callbacks */
      trendImageViewer.leftVerticalPaddle
          .on("end", function(){trendImageViewer.controller.verticalEnd.call(this, trendImageViewer.residue_glyph_size,
             protein_family_data, trendImageViewer.column_frequencies, App.leftFrequencyViewer, yScale)});

      trendImageViewer.rightVerticalPaddle
          .on("end", function(){trendImageViewer.controller.verticalEnd.call(this, trendImageViewer.residue_glyph_size,
               protein_family_data, trendImageViewer.column_frequencies, App.rightFrequencyViewer, yScale)});

      /* Initialize the protein frequency charts with the selection data*/
      initialize_frequency_viewers(protein_family_data);
    })
    ;

  }

  /* Function to add the three brush paddles to the svg*/
  function add_brushes(x_axis_length, y_axis_length) {

    /* Multiple Brushes help: http://bl.ocks.org/jssolichin/54b4995bd68275691a23*/
    trendImageViewer.brushes = trendImageViewer.svg.append("g")
      .attr("class", "brushes")
      .style("width", trendImageViewer.width)
      .style("height", trendImageViewer.residue_glyph_size * y_axis_length);

    /* Add the horizontal paddle to the trend image */
    trendImageViewer.brushes.append("g")
      .attr("class", "brush horizontal")
      .call(trendImageViewer.horizonalPaddle) // add the paddle
      // initialize the position
      .call(trendImageViewer.horizonalPaddle.move, [0, trendImageViewer.residue_glyph_size])
    ;

    /* Add the left vertical paddle to the trend image*/
    trendImageViewer.brushes.append("g")
      .attr("class", "brush vertical-left")
      .call(trendImageViewer.leftVerticalPaddle)
      // initialize the position
      .call(trendImageViewer.leftVerticalPaddle.move, [0, trendImageViewer.residue_glyph_size * trendImageViewer.verticalPaddleSize])
    ;

    /* Add the right vertical paddle to the trend image*/
    trendImageViewer.brushes.append("g")
        .attr("class", "brush vertical-right")
        .call(trendImageViewer.rightVerticalPaddle)
        // initialize the position
        .call(trendImageViewer.rightVerticalPaddle.move,
          [trendImageViewer.width - trendImageViewer.residue_glyph_size * trendImageViewer.verticalPaddleSize, trendImageViewer.width])
    ;
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
            .range([0, Math.ceil((trendImageViewer.width)/trendImageViewer.residue_glyph_size)*trendImageViewer.residue_glyph_size])
        ;

    /* Create the three brushes */
    create_brushes(trendImageViewer.width, y_elements.length, xScale, yScale, protein_family_data);

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
              .attr("class", function(d, i) { return "p" + d.protein + " r" + i % x_axis_length; })
              .attr("width", trendImageViewer.residue_glyph_size)
              .attr("height", trendImageViewer.residue_glyph_size)
              .attr('y', function(d) { return yScale(d.protein) })
              .attr('x', function(d) { return xScale(d.x) })
              .attr('fill', function(d) { return residueModel.getColor(d.residue); })
              .attr('stroke',  function(d) { return residueModel.getColor(d.residue); })
            // .on('mouseover', trendImageViewer.tooltip.show)
            // .on('mouseout', trendImageViewer.tooltip.hide)
          ;

          /*Add the brushes to the trend image*/
          add_brushes(x_axis_length, y_elements.length);

          /* Remove the pointer events from the brush overlays to prevent:
           * 1: Deleting the brush on a wrong click
           * 2: Interference between brushes
          */
          trendImageViewer.brushes.selectAll('.overlay')
              .style("pointer-events", "none");

          trendImageViewer.brushes.selectAll('.selection')
              .style("shape-rendering", "auto");

          /* Highlight the initial selections*/

          /* Set the first highlighted row's opacity */
          d3.selectAll('.p' + y_elements[0])
            .classed("active_protein_selection", true);

          /* Iterate over the left selection and add the active class to the selected fragments */
          for(let i = 0; i < trendImageViewer.verticalPaddleSize; i++) {
            d3.selectAll("rect[class$='r" + parseInt(i) + "']")
              .classed("vertical-left", true)
              .classed("active_res_selection", true);
          }

          /* Iterate over the right selection and add the active class to the selected fragments */
          for(let i = x_axis_length - trendImageViewer.verticalPaddleSize ; i < x_axis_length; i++) {
            d3.selectAll("rect[class$='r" + parseInt(i) + "']")
              .classed("vertical-right", true)
              .classed("active_res_selection", true);
          }

        });
  }

  /* Return the publicly accessible functions*/
  return {
    init: initialize,
    render: render
  };

};