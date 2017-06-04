"use strict";

// global application variable
var App = App || {};

// Protein / Molecule trendImageViewer "Class"
const TrendImageViewer = function(options){

  /* initialize the molecular trendImageViewer global variable */
  let trendImageViewer = {
    overviewImage     : false,
    instanceVariables : {}
  };

  /* Initialized the frequency viewers */
  function initialize_frequency_viewers() {

    /* Get the currently selected protein and the selected residues */
    let currentProtein = trendImageViewer.protein_family_data[0];

    /* Get the length of the sequence */
    let sequence_length = trendImageViewer.x_axis_length;

    /* Get the selected residues from the left paddle */
    let leftSelectedResidues = [0, trendImageViewer.verticalPaddleSize];

    /* Get the selected residues from the left paddle */
    let rightSelectedResidues = [sequence_length - trendImageViewer.verticalPaddleSize, sequence_length];

    /* Get the fragments from the left column*/
    let leftFragments = trendImageViewer.column_frequencies
      .getFragmentCountsFromRange(leftSelectedResidues[0], leftSelectedResidues[1]);

    /* Get the fragments from the right column*/
    let rightFragments = trendImageViewer.column_frequencies
      .getFragmentCountsFromRange(rightSelectedResidues[0], rightSelectedResidues[1]);

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
    App.leftFrequencyViewer.init("#leftResidueSummaryViewer", trendImageViewer.verticalPaddleMaxSize);
    App.rightFrequencyViewer.init("#rightResidueSummaryViewer", trendImageViewer.verticalPaddleMaxSize);

    /* Render the frequency view*/
    App.leftFrequencyViewer.render(leftSelectionFragments, trendImageViewer.y_axis_length,
        leftHorizontalSelectedResidues, trendImageViewer.residue_glyph_size * trendImageViewer.verticalPaddleSize/2.0 );
    App.rightFrequencyViewer.render(rightSelectionFragments, trendImageViewer.y_axis_length,
        rightHorizontalSelectedResidues, trendImageViewer.width - trendImageViewer.residue_glyph_size*2 - App.rightFrequencyViewer.getOffset()*2);
  }


  /* Reorder the proteins labels based on the selected sorting  */
  function reorder_labels(ordering) {
    trendImageViewer.svg
        .transition().duration(1000)
        .selectAll(".rowLabel")
        .attr("y", function(d,i) {
          let row = parseInt(d3.select(this).attr("row")),
              new_row = _.indexOf(ordering, trendImageViewer.protein_family_data[row]);
          return (new_row+1) * trendImageViewer.residue_glyph_size;
        })
        .attr("row", function(){
          let row = parseInt(d3.select(this).attr("row"));
          return _.indexOf(ordering, trendImageViewer.protein_family_data[row]);
        });
  }


  /* Reorder the proteins based on the selected sorting  */



  /* Render the protein names to the svg */
  function render_row_labels(labels) {
    let rowLabels = trendImageViewer.svg.append("g")
        .attr("class", "rowLabels")
        .selectAll(".rowLabel")
        .data(labels)
        .enter().append("text")
        .text((d) => {return d;})
        .attr("x", trendImageViewer.width + 5)
        .attr("y",(d, i) => { return ( (i+1) * trendImageViewer.residue_glyph_size); })
        .attr("row", (d, i) => { return i; })
        .style("text-anchor", "start")
        .attr("class", "rowLabel mono")
        .attr("id", (d, i) => { return "rowLabel_" + i; });
  }


  function render_overview() {

    let overviewImage = new Image();
    let width  = parseInt(trendImageViewer.width / 10) ;
    let height = trendImageViewer.height;

  }

  /* Initialize the trend image object, create globals, and create the svg */
  function initialize(div_id) {

    /* Set the size of the initial vertical paddles */
    trendImageViewer.verticalPaddleSize = 6;
    trendImageViewer.verticalPaddleMaxSize = 10;

    /* Initialize the sizes of the brushing paddles */
    initialize_brush_positions();

    /* Trend Image interaction controller */
    set_trend_image_controller();

    /* Create the three brushes */
    create_brushes();
  }


  /*******************************************************************************************************************/
  /************                         Instance Accessors (Getters and Setters)                          ************/
  /*******************************************************************************************************************/

  /************ Setters ************/


  /* Setter for the column frequency data */
  function set_column_frequency_data(column_frequencies) {
    trendImageViewer.column_frequencies = column_frequencies
  }


  /* Setter for the trend image controller */

  /* This is actually the brush */
  function set_trend_image_controller() {
    trendImageViewer.controller = new TrendImageController({
      trendImage             : trendImageViewer.instanceVariables.protected,
      initHorizontalPosition : trendImageViewer.initHorizontalBrush,
      initVerticalPosition   : trendImageViewer.initVerticalBrushes,
      brushMaxSize           : trendImageViewer.verticalPaddleMaxSize,
      brushMinSize           : trendImageViewer.verticalPaddleSize
    });
  }








  /************ Getters ************/

  /* Getter for the column frequency data */
  function get_column_frequency_data() {
    return trendImageViewer.column_frequencies;
  }


  /* Getter for the x-Axis scale */
  function get_x_axis_scale() { return trendImageViewer.xScale; }


  /* Getter for the y-Axis scale */
  function get_y_axis_scale() { return trendImageViewer.yScale; }


  /* Getter for the x-dimension size */
  function get_x_dimension_size() { return trendImageViewer.x_axis_length; }


  /* Getter for the y-dimension size */
  function get_y_dimension_size() { return trendImageViewer.y_axis_length; }


  /* Getter for the names of the proteins from the family */
  function get_protein_names() { return trendImageViewer.proteinNames; }


  /* Getter for the trend image glyph size */
  function get_glyph_size(){ return trendImageViewer.residue_glyph_size; }


  };

};