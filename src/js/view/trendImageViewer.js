"use strict";

// global application variable
var App = App || {};

// Protein / Molecule trendImageViewer "Class"
const TrendImageViewer = function(options){

  /* initialize the molecular trendImageViewer global variable */
  let trendImageViewer = {
    instanceVariables : {}
  };


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


  function initialize_chart_dom(){
    /* get/save the width and height of the given DOM element */
    set_chart_dimensions();

    /* clear the trend image DOM */
    clear_chart_dom();

    /* Add the canvas and brush svg to the trend image dom*/
    create_chart_canvas();
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

    /* Get and save the size of each residue for the trend image based on the width of the screen */
    set_glyph_size();

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

    let residue_width = Math.floor(App.trendWidth / trendImageViewer.x_axis_length);

    /* Reset the viewers width and height*/
    App.trendWidth = residue_width *  trendImageViewer.x_axis_length;
    App.frequencyWidth = Math.floor(App.trendWidth / 2.0 + (2.0 * options.freqOffset));

    /*Reset the parent dom width/heights*/
    trendImageViewer.domObj.classed("trend-viewer", false);
    trendImageViewer.width = App.trendWidth;

    /* Make sure the height of the data does not exceed the height of the container */
    let temp_height = trendImageViewer.y_axis_length * residue_width;

    /* We must reset the height of the trend image */
    if(temp_height < App.trendHeight) {
      App.trendHeight = temp_height;
    }

    trendImageViewer.height = App.trendHeight;

    /* Resize the DOM elements*/
    document.getElementById('trendImageViewer').parentNode.style.height = trendImageViewer.height;
    document.getElementById('trendImageViewer').style.height = trendImageViewer.height;

    document.getElementById('trendImageViewer').parentNode.style.width = App.trendWidth;
    document.getElementsByClassName('TrendImageView')[0].style.width = App.trendWidth;
    document.getElementsByClassName('residueSummaryView')[0].style.width = App.frequencyWidth * 2;

    /* Get the computed margin to set the text for each row */
    trendImageViewer.margin = parseInt(window.getComputedStyle(document.getElementsByClassName('TrendImageView')[0]).marginRight);
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