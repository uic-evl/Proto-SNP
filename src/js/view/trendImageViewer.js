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


  /* Parse the incoming data into row, columns, and values */
  function map_trend_image_data() {
    return new Promise(function(resolve, reject) {
      let data = [], index = [], columns = [];
      /* Extract the rows and data */
      trendImageViewer.protein_family_data.forEach( (d,i) => {
        data.push(d.sequence);
        index.push(d.name);
      } );
      /* Extract the columns */
      data[0].forEach( (d,i) => { columns.push(["R", i]) } );

      resolve({ data: data, index : index, columns : columns });
    });
  }


  /* Clear the chart DOM of all elements */
  function clear_chart_dom() {
    trendImageViewer.domObj.selectAll().remove();
  }


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


  function create_chart_back_buffer() {
    trendImageViewer.backBufferCanvas = document.createElement('canvas');

    trendImageViewer.backBufferContext =  d3.select(trendImageViewer.backBufferCanvas)
        .attr("width", trendImageViewer.width)
        .attr("height", trendImageViewer.residue_glyph_size * trendImageViewer.y_axis_length)
        .node().getContext('2d');
  }


  function create_chart_canvas() {

    let canvas = trendImageViewer.domObj
        .append('canvas')
          .attr("id", "trendCanvas")
          .attr("class", "trendImage")
          .attr("width", trendImageViewer.width)
          .attr("height", trendImageViewer.height);

    if(trendImageViewer.overviewImage) {
      let overview = trendImageViewer.domObj
        .append('canvas')
        .attr("id", "trendCanvasOverview")
        .attr("width", trendImageViewer.width * 0.1)
        .attr("height", trendImageViewer.height);
      trendImageViewer.overviewContext = overview.node().getContext('2d');
    }
    trendImageViewer.canvasContext = canvas.node().getContext('2d');
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


  /* Function to redraw the trend image */
  function recolor() {
    let colorMapping = App.residueModel.getColor(App.colorMapping);
    /* If a trend image exists, recolor based on the new color map */
    if(trendImageViewer.svg) {
      trendImageViewer.svg
          .selectAll(".cell")
          .attr('fill',   function(d) {
            let col = parseInt(d3.select(this).attr("col")),
                highestFreq = trendImageViewer.column_frequencies.getMostFrequentAt(col);
            return colorMapping(d, highestFreq).code;
          })
          .attr('stroke', function(d) {
            let col = parseInt(d3.select(this).attr("col")),
                highestFreq = trendImageViewer.column_frequencies.getMostFrequentAt(col);
            return colorMapping(d, highestFreq).code;
          })
    }
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
  function reorder() {
    /* Get the new order for the protein rows in descending order */
    let ordering_scores = _.chain(trendImageViewer.protein_family_data)
        .sortBy((protein) => { return protein.scores[App.sorting];})
        .reverse().slice(0, trendImageViewer.ppv).value();

    trendImageViewer.svg
        .transition().duration(1000)
        .selectAll(".cell")
        .attr("transform", function(d,i)
          {
            let row = parseInt(d3.select(this).attr("row")),
                col = parseInt(d3.select(this).attr("col")),
                x_pos  = col*trendImageViewer.residue_glyph_size,
                curr_y_pos = _.indexOf(ordering_scores, trendImageViewer.protein_family_data[row]) * trendImageViewer.residue_glyph_size;
            return App.utilities.translate(x_pos, curr_y_pos);
          })
        .attr("row", function()
          {
            let row = parseInt(d3.select(this).attr("row"));
            return _.indexOf(ordering_scores, trendImageViewer.protein_family_data[row]);
          })
        .call(function(){
          /* Reorder the labels*/
          //reorder_labels(ordering_scores);
          /* Set the new y-scale so the brushes have an updated lookup table */
          set_y_scale(_.map(ordering_scores, "name"));
          set_protein_family(ordering_scores);
          /* Reset the brush selections */
          reset_brushes();
        });
  }


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


  /* Bind the data to a fake dom */
  function bind_data(protein_data, colorScale) {
    /* Fake DOM*/
    let customBase = document.createElement('custom'),
        custom = d3.select(customBase),
    /* Fake Rows */
        rows = custom.selectAll("custom")
          .data(protein_data.sequences)
            .enter().append("custom")
            .attr("id", (d,i) => { return "p" + protein_data.names[i];})
            .attr("class", "row"),

        /* Fake columns -- bind the data */
        elements = rows.selectAll('.cell')
          .data( (d) => { return d} );

        /* Update: add new items as needed */
    elements
        .enter().append('custom')
        .attr("class", "cell")
        .merge(elements)
        .attr("x", (d,i,j) => { return i * trendImageViewer.residue_glyph_size; })
        .attr("y", (d,i,j) => { return j * trendImageViewer.residue_glyph_size; })
        .attr('width',  trendImageViewer.residue_glyph_size)
        .attr('height', trendImageViewer.residue_glyph_size)
        .attr("row", (d, i, j) => { return j; })
        .attr("col", (d, i, j) => { return i; })
        .attr('fill',  (d) => { return colorScale(d).code; })
        .attr('stroke',(d) => { return colorScale(d).code; });

    /* Remove any unneeded elements */
    elements
        .exit()
        .transition()
        .attr('width', 0)
        .attr('height', 0)
        .remove();

    /* Return the data model */
    return custom;
  }


  function render_overview() {

    let overviewImage = new Image();
    let width  = parseInt(trendImageViewer.width / 10) ;
    let height = trendImageViewer.height;



  }


  /* Render the trend image to the canvas */
  function render_canvas(data_model) {
    return new Promise(function(resolve, reject) {
      /* First, clear the canvas*/
      trendImageViewer.backBufferContext
          .clearRect(0,0,trendImageViewer.width, trendImageViewer.height);

      //let image = context.createImageData(trendImageViewer.width + trendImageViewer.margin, trendImageViewer.height);

      /* Get the trend image rows from the data model */
      let rows = data_model.selectAll("custom.row");
      /* Iterate over each element to render it to the canvas*/
      rows.each(function(d,i) {
        let columns =  d3.select(this).selectAll("custom.cell");
        columns.each(function(d, i){
          /* Get the residue from the element */
          let residue = d3.select(this);
          /* Set the fill color */
          trendImageViewer.backBufferContext.fillStyle = residue.attr("fill");
          /* color the area of the residue */
          trendImageViewer.backBufferContext
              .fillRect( parseInt(residue.attr('x')), parseInt(residue.attr('y')), trendImageViewer.residue_glyph_size, trendImageViewer.residue_glyph_size);
        });
      });

      let image = trendImageViewer.backBufferContext.getImageData(0,0,trendImageViewer.width, trendImageViewer.height);
      trendImageViewer.canvasContext.putImageData(image, 0, 0);

      /* create the overview if the image runs off the page*/
      if(trendImageViewer.overviewImage){

      }


      /* resolve when finished */
      resolve();
    });
  }


  function render() {
    /* Invoke the tip in the context of your visualization */
    //trendImageViewer.svg.call(trendImageViewer.tooltip);
    return map_trend_image_data().then(function (data) {
      /* Get the selected color map and data */
      let colorMapping = App.residueModel.getColor(App.colorMapping),
          protein_data = data.data;

      let data_model = bind_data({sequences: protein_data, names: data.index}, colorMapping);
      return render_canvas(data_model);
      //return render_svg({sequences: protein_data, names: data.index}, colorMapping);
    }).then(function(){

      /* Add the brushes to the canvas */
      add_brushes(trendImageViewer.brushSVG);

      /* Render the brushes */
      render_brushes(trendImageViewer.initHorizontalBrush, trendImageViewer.initVerticalBrushes);

      /* Create the legend */
      App.residueModel.createColorLegend();
    });

  }


  function initialize_chart_dom(){
    /* get/save the width and height of the given DOM element */
    set_chart_dimensions();

    /* Get and save the size of each residue for the trend image based on the width of the screen */
    set_glyph_size();

    /* clear the trend image DOM */
    clear_chart_dom();

    /* Add the canvas and brush svg to the trend image dom*/
    create_chart_canvas();
    create_chart_back_buffer();

    create_brush_svg();
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

    /* initialize the proteins names and dimensions */
    initialize_data_descriptors();

    /* Initialize the chart dOM*/
    initialize_chart_dom();

    /* Initialize the number of visible proteins per view */
    set_proteins_per_view();

    /* Initialize the scales for the trend image*/
    set_chart_scales();

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


  /* Setter for the number of proteins we can display in a single view */
  function set_proteins_per_view() {
    trendImageViewer.ppv = trendImageViewer.height / trendImageViewer.residue_glyph_size;
  }


  /* Setter for the column frequency data */
  function set_column_frequency_data(column_frequencies) {
    trendImageViewer.column_frequencies = column_frequencies
  }


  /* Setter for the trend image controller */
  function set_trend_image_controller() {
    trendImageViewer.controller = new TrendImageController({
      trendImage             : trendImageViewer.instanceVariables.protected,
      initHorizontalPosition : trendImageViewer.initHorizontalBrush,
      initVerticalPosition   : trendImageViewer.initVerticalBrushes,
      brushMaxSize           : trendImageViewer.verticalPaddleMaxSize,
      brushMinSize           : trendImageViewer.verticalPaddleSize
    });
  }


  /* Setter for the chart DOM element */
  function set_chart_dom_obj(div_id) {
    trendImageViewer.domObj = d3.select(div_id);
  }


  function set_y_scale(values) {
    /* construct the y-scale */
    trendImageViewer.yScale = d3.scaleBand()
        .domain(values)
        .range([0, trendImageViewer.ppv * trendImageViewer.residue_glyph_size])
    ;
  }


  /* Setter for the trend image scales */
  function set_chart_scales() {
    /* construct the x-scale */
    trendImageViewer.xScale = d3.scaleLinear()
      .domain([0, trendImageViewer.x_axis_length])
      .range([0, Math.ceil((trendImageViewer.width)/trendImageViewer.residue_glyph_size)*trendImageViewer.residue_glyph_size])
    ;
    /* Set the y scale with the protein names*/
    set_y_scale(_.slice(get_protein_names(), 0, trendImageViewer.ppv))
  }


  /* Setter for the chart dimensions */
  function set_chart_dimensions() {

    let container_width = trendImageViewer.domObj.node().parentNode.clientWidth,
        container_height = trendImageViewer.domObj.node().parentNode.clientHeight,
        residue_width = Math.floor(container_width / trendImageViewer.x_axis_length);

    /* Reset the viewers width and height*/
    let viewer_width = residue_width *  trendImageViewer.x_axis_length;

    /*Reset the parent dom width/heights*/
    trendImageViewer.domObj.classed("trend-viewer", false);
    trendImageViewer.width = viewer_width;

    /* Make sure the height of the data does not exceed the height of the container */
    let temp_height = trendImageViewer.y_axis_length * residue_width;

    /* We must reset the height of the trend image */
    if(temp_height < container_height) {
      container_height = temp_height;
    }
    else if(temp_height > container_height) {
      trendImageViewer.width = container_width;
      trendImageViewer.overviewImage = true;
    }
    trendImageViewer.height = container_height;

    /* Resize the DOM elements*/
    document.getElementById('trendImageViewer').parentNode.style.height = trendImageViewer.height;
    document.getElementById('trendImageViewer').style.height = trendImageViewer.height;

    document.getElementById('trendImageViewer').parentNode.style.width = trendImageViewer.width;
    document.getElementsByClassName('TrendImageView')[0].style.width = trendImageViewer.width;
  }


  /* Setter for the protein family data*/
  function set_protein_family(protein_family) {
    trendImageViewer.protein_family_data = protein_family;
  }


  /* Set the dimensions of the data */
  function set_data_dimensions_sizes() {

    /* Get/store the length of the longest sequence */
    trendImageViewer.x_axis_length = parseInt(_.max(d3.set(trendImageViewer.protein_family_data
        .map((residue) => { return residue.length; } ))
        .values()));

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
      recolor            : recolor,
      reorder            : reorder,
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