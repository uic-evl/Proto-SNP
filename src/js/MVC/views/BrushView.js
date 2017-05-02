"use strict";

var App = App || {};

const BrushView = (function() {

  /* initialize the self instance variable */
  let self = {

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
      .setPaddleExtent([ [0, 0], [trendImageViewer.width, trendImageViewer.y_axis_length * trendImageViewer.residue_glyph_size] ])
    ;
    /* Construct the right vertical residue-selection paddle */
    trendImageViewer.rightVerticalPaddle = App.TrendImageBrushFactory.createBrush(App.VERTICAL_PADDLE)
      .setPaddleSize(trendImageViewer.verticalPaddleSize)
      .setBrushClass("brush vertical-right")
      .setPaddleExtent( [ [0, 0], [trendImageViewer.width, trendImageViewer.y_axis_length * trendImageViewer.residue_glyph_size] ])
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


  function BrushView(model) {

    this._model = model;


    this.render = function(){

    };


    this.redraw = function() {

    }

  }

  BrushView.prototype = View.prototype;

  return BrushView;

})();
