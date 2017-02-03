"use strict";

// global application variable
var App = App || {};

// Protein / Molecule trendImageViewer "Class"
const TrendImageViewer = function(){

  /* initialize the molecular trendImageViewer global variable */
  let trendImageViewer = {};

  /* An object storing the public functions of the class */
  trendImageViewer.instanceVariables = {};

  /* Parse the data into the format to be used in the trend image*/
  function map_trend_image_data() {

    /* New array for the parse residues */
    let data = [];

    /* Return a promise that will resolve with the new data array*/
    return new Promise(function(resolve, reject) {
      trendImageViewer.protein_family_data.forEach(function(memberProtein) {
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

  /* Clear the chart DOM of all elements */
  function clear_chart_dom() {
    trendImageViewer.domObj.selectAll().remove();
  }

  /* Create the trend image SVG */
  function create_chart_svg() {
    trendImageViewer.svg = trendImageViewer.domObj
      .append("svg")
      .attr("class", "trendImage")
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
    App.leftFrequencyViewer.render(leftSelectionFragments, trendImageViewer.y_axis_length, leftHorizontalSelectedResidues );
    App.rightFrequencyViewer.render(leftSelectionFragments, trendImageViewer.y_axis_length, rightHorizontalSelectedResidues );
  }

  /* Vertical brushing cannot be enabled until the column frequencies are computed*/
  function enable_vertical_brushing() {
      /* Enable the paddle brushing callbacks */
      trendImageViewer.leftVerticalPaddle
        .onEnd(function(){trendImageViewer.controller.verticalEnd
            .call(this, trendImageViewer.instanceVariables.protected, App.leftFrequencyViewer)});

      trendImageViewer.rightVerticalPaddle
        .onEnd( function(){trendImageViewer.controller.verticalEnd
            .call(this, trendImageViewer.instanceVariables.protected, App.rightFrequencyViewer)});

      /* Initialize the protein frequency charts with the selection data*/
      initialize_frequency_viewers();
  }

  /* Function to add the three brush paddles to the svg*/
  function add_brushes() {

    /* Multiple Brushes help: http://bl.ocks.org/jssolichin/54b4995bd68275691a23*/
    trendImageViewer.brushes = trendImageViewer.svg.append("g")
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
        .setPaddleExtent([ [0, 0], [trendImageViewer.width, trendImageViewer.y_axis_length * trendImageViewer.residue_glyph_size] ])
        .onBrush(function(){ trendImageViewer.controller.horizontalBrushed.call(this, trendImageViewer.instanceVariables.protected)})
        .onEnd( function() { trendImageViewer.controller.horizontalEnd.call(this, trendImageViewer.instanceVariables.protected)})
    ;

    /* Construct the right vertical residue-selection paddle */
    trendImageViewer.leftVerticalPaddle = App.TrendImageBrushFactory.createBrush(App.VERTICAL_PADDLE)
      .setPaddleSize(trendImageViewer.verticalPaddleSize)
      .setBrushClass("brush vertical-left")
      .setPaddleExtent([ [0, 0], [trendImageViewer.x_axis_length, trendImageViewer.y_axis_length * trendImageViewer.residue_glyph_size] ])
      .onBrush(function(){
        trendImageViewer.controller.verticalBrushed.call(this, trendImageViewer.instanceVariables.protected)});

    /* Construct the right vertical residue-selection paddle */
      trendImageViewer.rightVerticalPaddle = App.TrendImageBrushFactory.createBrush(App.VERTICAL_PADDLE)
        .setPaddleSize(trendImageViewer.verticalPaddleSize)
        .setBrushClass("brush vertical-right")
        .setPaddleExtent( [ [0, 0], [trendImageViewer.width, trendImageViewer.y_axis_length * trendImageViewer.residue_glyph_size] ])
          .onBrush(function(){
            trendImageViewer.controller.verticalBrushed.call(this, trendImageViewer.instanceVariables.protected) });

    /* Once the column frequency sorting is complete, enable the brushing callbacks*/
    trendImageViewer.column_frequencies.getPromise()
      .then(enable_vertical_brushing);
  }

  /* Render the trend image to the svg */
  function render() {

    /* Construct a color map using the residue codes*/
    let residueModel = new ResidueModel();

    /* Invoke the tip in the context of your visualization */
    //trendImageViewer.svg.call(trendImageViewer.tooltip);

    /* Convert the data into a residue-based array */
    map_trend_image_data()
        .then(function(data){
          /* Construct the image out of each residue  */
          trendImageViewer.svg.append("g")
              .selectAll("rect")
              .data(data)
              .enter().append('g')
              .attr("class", "aminoAcid")
              .append('rect')
              .attr("class", function(d, i) { return "p" + d.protein + " r" + i % trendImageViewer.x_axis_length; })
              .attr("width", trendImageViewer.residue_glyph_size)
              .attr("height", trendImageViewer.residue_glyph_size)
              .attr('y', function(d) { return trendImageViewer.yScale(d.protein) })
              .attr('x', function(d) { return trendImageViewer.xScale(d.x) })
              .attr('fill', function(d) { return residueModel.getColor(d.residue); })
              .attr('stroke',  function(d) { return residueModel.getColor(d.residue); })
          // .on('mouseover', trendImageViewer.tooltip.show)
          // .on('mouseout', trendImageViewer.tooltip.hide)
          ;

          /*Add the brushes to the trend image*/
          add_brushes();

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

          /* Set the first highlighted row's opacity */
          d3.selectAll('.p' + get_protein_names()[0])
              .classed("active_protein_selection", true);

          /* Iterate over the left selection and add the active class to the selected fragments */
          for(let i = 0; i < trendImageViewer.verticalPaddleSize; i++) {
            d3.selectAll("rect[class$='r" + parseInt(i) + "']")
                .classed("vertical-left", true)
                .classed("active_res_selection", true);
          }

          /* Iterate over the right selection and add the active class to the selected fragments */
          for(let i = trendImageViewer.x_axis_length - trendImageViewer.verticalPaddleSize ; i < trendImageViewer.x_axis_length; i++) {
            d3.selectAll("rect[class$='r" + parseInt(i) + "']")
                .classed("vertical-right", true)
                .classed("active_res_selection", true);
          }

        });
  }

  function initialize_chart_dom(){
    /* get/save the width and height of the given DOM element */
    set_chart_dimensions();

    /* clear the trend image DOM */
    clear_chart_dom();

    /* Add the svg to the trend image dom*/
    create_chart_svg();
  }

  /* Initialize the data descriptors -- protein names and sizes*/
  function initialize_data_descriptors() {
    /* Extract and save the protein names from the family*/
    set_protein_names();

    /* Set the dimensions of the trend image */
    set_data_dimensions_sizes();
  }

  /* Initialize the trend image object, create globals, and create the svg */
  function initialize(div_id) {

    /* Set the DOM element by the id parameter */
    set_chart_dom_obj(div_id);

    /* Initialize the chart dOM*/
    initialize_chart_dom();

    /* initialize the proteins names and dimensions */
    initialize_data_descriptors();

    /* Get and save the size of each residue for the trend image based on the width of the screen */
    set_glyph_size();

    /* Initialize the scales for the trend image*/
    set_chart_scales();

    /* Trend Image interaction controller */
    set_trend_image_controller();

    /* Set the size of the initial vertical paddles */
    trendImageViewer.verticalPaddleSize = 6;


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
  function set_trend_image_controller() { trendImageViewer.controller = new TrendImageController(); }

  /* Setter for the chart DOM element */
  function set_chart_dom_obj(div_id) {
    trendImageViewer.domObj = d3.select(div_id);
  }

  /* Setter for the trend image scales */
  function set_chart_scales() {
    /* construct the x-scale */
    trendImageViewer.xScale = d3.scaleLinear()
      .domain([0, trendImageViewer.x_axis_length])
      .range([0, Math.ceil((trendImageViewer.width)/trendImageViewer.residue_glyph_size)*trendImageViewer.residue_glyph_size])
    ;

    /* construct the y-scale */
    trendImageViewer.yScale = d3.scaleBand()
      .domain(get_protein_names())
      .range([0, trendImageViewer.y_axis_length * trendImageViewer.residue_glyph_size])
    ;
  }

  /* Setter for the chart dimensions */
  function set_chart_dimensions() {
    trendImageViewer.width = App.trendWidth;
    trendImageViewer.height = App.trendHeight;
  }

  /* Setter for the protein family data*/
  function set_protein_family(protein_family) {
    trendImageViewer.protein_family_data = protein_family;
  }

  /* Set the dimensions of the data */
  function set_data_dimensions_sizes() {

    /* Get/store the length of the longest sequence */
    trendImageViewer.x_axis_length = _.max(d3.set(trendImageViewer.protein_family_data.map(
        function( residue ) { return residue.length; } ))
        .values());

    /* Get/store the length of the y-axis -- i.e. how many proteins it contains */
    trendImageViewer.y_axis_length = get_protein_names().length;
  }

  /* Setter for the names of the proteins from the family */
  function set_protein_names() {
    trendImageViewer.proteinNames = d3.set(
        trendImageViewer.protein_family_data.map(function( residue ) { return residue.name; } ))
        .values();
  }

  /* Setter for the names of the proteins from the family */
  function set_glyph_size() {
    /* Get and save the size of each residue for the trend image based on the width of the screen */
    trendImageViewer.residue_glyph_size = Math.round( trendImageViewer.width / trendImageViewer.x_axis_length);
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

  /* Getter for the protein family data*/
  function get_protein_family_data() {
    return trendImageViewer.protein_family_data ;
  }

  /* Getter for the x-dimension size */
  function get_x_dimension_size() { return trendImageViewer.x_axis_length; }

  /* Getter for the y-dimension size */
  function get_y_dimension_size() { return trendImageViewer.y_axis_length; }

  /* Getter for the names of the proteins from the family */
  function get_protein_names() { return trendImageViewer.proteinNames; }

  /* Getter for the trend image glyph size */
  function get_glyph_size(){ return trendImageViewer.residue_glyph_size; }

  /* Set the publicly accessible functions*/
  trendImageViewer.instanceVariables =  {

    public: {
      init               : initialize,
      render             : render,
      setColumnFrequency : set_column_frequency_data,
      setProteinFamily   : set_protein_family
    },

    protected: {
      getProteinData     : get_protein_family_data,
      getColumnFrequency : get_column_frequency_data,
      getXAxisSize       : get_x_dimension_size,
      getYAxisSize       : get_y_dimension_size,
      getXAxisScale      : get_x_axis_scale,
      getYAxisScale      : get_y_axis_scale,
      getGlyphSize       : get_glyph_size
    }

  };

  /* Set the publicly accessible functions*/
  return trendImageViewer.instanceVariables.public;

};