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


  /* Create the trend image brush SVG */
  function create_brush_svg() {
    trendImageViewer.brushSVG = trendImageViewer.domObj
      .append("svg")
      .attr("class", "trendImage")
        .attr("id", "trendSVG")
        .style("width", trendImageViewer.width)
      .style("height", trendImageViewer.height)
    ;
  }


  /* Create a customized context menu per right-click */
  function create_context_menu() {

    /* Get the horizontal brush extent */
    let brush_selection = d3.brushSelection(this);

    /* Get the name of the protein currently selected*/
    let selected_protein = brush_selection.map(trendImageViewer.yScale.invert)[0];

    /* Return the customized context menu */
    return [
      {
        title: function() {return "Load Protein: " + selected_protein; },
        action: function() {
          App.applicationModel.processProteinRequest({position: "left", protein_name: selected_protein});
        },
        disabled: false // optional, defaults to false
      }
    ];
  }


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


  /* Vertical brushing cannot be enabled until the column frequencies are computed*/
  function enable_vertical_brushing() {
      /* Enable the paddle brushing callbacks */
      trendImageViewer.leftVerticalPaddle
          .onBrush(function(){
            trendImageViewer.controller.verticalBrushed.call(this, App.leftFrequencyViewer)});
      trendImageViewer.rightVerticalPaddle
          .onBrush(function(){
            trendImageViewer.controller.verticalBrushed.call(this, App.rightFrequencyViewer) });

      /* Initialize the protein frequency charts with the selection data*/
      initialize_frequency_viewers();
  }


  /* Function to set the starting positions of the three paddles */
  function initialize_brush_positions() {
    /* Store the initial positions of the brushes */
    trendImageViewer.initHorizontalBrush    = get_protein_names()[0];
    trendImageViewer.initLeftVerticalBrush  = [0, trendImageViewer.verticalPaddleSize];
    trendImageViewer.initRightVerticalBrush = [trendImageViewer.x_axis_length - trendImageViewer.verticalPaddleSize,  trendImageViewer.x_axis_length];
    trendImageViewer.initVerticalBrushes    = {left: trendImageViewer.initLeftVerticalBrush, right: trendImageViewer.initRightVerticalBrush};
  }


  /* Function to add the three brush paddles to the svg*/
  function add_brushes(parentDom) {

    /* Multiple Brushes help: http://bl.ocks.org/jssolichin/54b4995bd68275691a23*/
    trendImageViewer.brushes = parentDom.append("g")
        .attr("class", "brushes")
        .style("width", trendImageViewer.width)
        .style("height", trendImageViewer.residue_glyph_size * trendImageViewer.y_axis_length);

    /* Add the horizontal paddle to the trend image */
    trendImageViewer.brushes.append("g")
        .attr("class", "brush horizontal")
        .call(trendImageViewer.horizonalPaddle.brush) // add the paddle
        // initialize the position
        .call(trendImageViewer.horizonalPaddle.brush.move, [0, trendImageViewer.residue_glyph_size])
    ;

    /* Add the left vertical paddle to the trend image*/
    trendImageViewer.brushes.append("g")
        .attr("class", "brush vertical-left")
        .call(trendImageViewer.leftVerticalPaddle.brush)
        // initialize the position
        .call(trendImageViewer.leftVerticalPaddle.brush.move, [0, trendImageViewer.residue_glyph_size * trendImageViewer.verticalPaddleSize])
    ;

    /* Add the right vertical paddle to the trend image*/
    trendImageViewer.brushes.append("g")
        .attr("class", "brush vertical-right")
        .call(trendImageViewer.rightVerticalPaddle.brush)
        // initialize the position
        .call(trendImageViewer.rightVerticalPaddle.brush.move,
            [trendImageViewer.width - trendImageViewer.residue_glyph_size * trendImageViewer.verticalPaddleSize, trendImageViewer.width])
    ;
  }


  /* Function to create the three brush paddles*/
  function create_brushes() {
    /* Construct the horizontal Protein-selection paddle */
    trendImageViewer.horizonalPaddle =
      App.TrendImageBrushFactory.createBrush(App.HORIZONTAL_PADDLE)
        .setPaddleSize(1)
        .setBrushClass("brush horizontal")
        .setPaddleExtent( [ [0, 0], [trendImageViewer.width, trendImageViewer.height] ])
        .onBrush(function(){ trendImageViewer.controller.horizontalBrushed.call(this)})
    ;

    /* Construct the left vertical residue-selection paddle */
    trendImageViewer.leftVerticalPaddle = App.TrendImageBrushFactory.createBrush(App.VERTICAL_PADDLE)
      .setPaddleSize(trendImageViewer.verticalPaddleSize)
      .setBrushClass("brush vertical-left")
      .setPaddleExtent([ [0, 0], [trendImageViewer.width,  trendImageViewer.height] ])
    ;
    /* Construct the right vertical residue-selection paddle */
      trendImageViewer.rightVerticalPaddle = App.TrendImageBrushFactory.createBrush(App.VERTICAL_PADDLE)
        .setPaddleSize(trendImageViewer.verticalPaddleSize)
        .setBrushClass("brush vertical-right")
        .setPaddleExtent( [ [0, 0], [trendImageViewer.width,  trendImageViewer.height] ])
      ;

    /* Once the column frequency sorting is complete, enable the brushing callbacks*/
    trendImageViewer.column_frequencies.getFrequencyPromise()
      .then(enable_vertical_brushing);
  }


  /* Render the brushes to the image */
  function render_brushes(selected_protein, brush_ranges) {

    /* Remove the pointer events from the brush overlays to prevent:
     * 1: Deleting the brush on a wrong click
     * 2: Interference between brushes
     */
    trendImageViewer.brushes.selectAll('.overlay')
        .style("pointer-events", "none");
    /* Let d3 decide the best rendering for the brushes */
    trendImageViewer.brushes.selectAll('.selection')
        .style("shape-rendering", "auto");
    /* Set the context menu of the vertical brush */
    trendImageViewer.brushes.select("g.brush.horizontal")
        .on("contextmenu", d3.contextMenu(create_context_menu));

    /* Highlight the initial selections*/

    /* Reset the brush selections */
    // trendImageViewer.svg.selectAll('rect')
    //     .classed("active_protein_selection", false)
    //     .classed("active_res_selection", false);
    //
    // /* Set the first highlighted row's opacity */
    // trendImageViewer.svg.selectAll("#p" + selected_protein + " > rect")
    //     .classed("active_protein_selection", true);
    //
    // /* Iterate over the left selection and add the active class to the selected fragments */
    // for(let i = brush_ranges.left[0]; i < brush_ranges.left[1]; i++) {
    //   trendImageViewer.svg.selectAll("rect[col='" + i + "']")
    //       .classed("vertical-left", true)
    //       .classed("active_res_selection", true);
    // }
    // /* Iterate over the right selection and add the active class to the selected fragments */
    // for(let i = brush_ranges.right[0]; i < brush_ranges.right[1]; i++) {
    //   trendImageViewer.svg.selectAll("rect[col='" + i + "']")
    //       .classed("vertical-right", true)
    //       .classed("active_res_selection", true);
    // }
  }


  /* Function to reset the brushes to be the before-sorted selection */
  function reset_brushes() {
    /* Get the protein that was last selected */
    let currentProtein = trendImageViewer.controller.getSelectedProtein();
    /* Get the protein that was last selected */
    let currentRanges = trendImageViewer.controller.getSelectedRanges();

    /* Render the brush with the current protein selected */
    render_brushes(currentProtein, currentRanges);

    /* Move the brush to the current overlay */
    let brush_pos = trendImageViewer.yScale(currentProtein);
    trendImageViewer.horizonalPaddle.moveBrush( [brush_pos, brush_pos+trendImageViewer.residue_glyph_size] );
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