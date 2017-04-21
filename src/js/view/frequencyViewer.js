"use strict";

// global application variable
var App = App || {};

// Frequency Viewer "Class"
const FrequencyViewer = function(options){

  /* Class private variable */
  let frequencyViewer = {};

  /* Simple d3 function to construct a line*/
  let lineFunction = d3.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; });


  /* Update the text with the current selection */
  function update_current_selection_text_and_bar (selected_residues) {

    /* Add the residue text to the bars */
    let selectionText = frequencyViewer.svg.selectAll(".selectionText")
      .data(selected_residues);

    // UPDATE: add new elements if needed
    selectionText
      .enter().append("text")
      .attr("class", "selectionText")
      /* Merge the old elements (if they exist) with the new data */
      .merge(selectionText)
      .attr('x', function(d, i) { return frequencyViewer.xScale(i) + frequencyViewer.bar_glyph_width / 2 })
      .attr("y", frequencyViewer.height * 0.2 + frequencyViewer.barOffset)
      .attr("dy", ".3em")
      .text(function(d){ return d[0] })
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
    ;
    /* Remove the unneeded selection labels */
    selectionText.exit().remove();
    /* Update the color for matching residues*/
    frequencyViewer.svg.selectAll(".frequencies")
      .attr("fill", function(d,i) { return (d[0] === selected_residues[i]) ?  "#D3D3D3" : "#43a2ca"; })
  }


  /* Render the labels above/below the bars */
  function render_labels(residue_frequencies){

    /* Add the residue text to the bars */
    let frequencyText = frequencyViewer.svg.selectAll(".residueText")
        .data(residue_frequencies);

    // UPDATE: add new elements if needed
    frequencyText
        .enter().append("text")
        .attr("class", "residueText")
        /* Merge the old elements (if they exist) with the new data */
        .merge(frequencyText)
        .attr('x', function(d, i) { return frequencyViewer.xScale(i) + frequencyViewer.bar_glyph_width / 2 })
        .attr("y", frequencyViewer.height * 0.8 + frequencyViewer.barOffset )
        .attr("dy", ".35em")
        .text(function(d){ return d[0] })
        .style("text-anchor", "middle")
        .style("font-weight", "bold")
    ;

    /* Remove the unneeded frequency labels */
    frequencyText.exit().remove();
  }


  /* Set the x and y scales*/
  function set_scales(residue_frequencies, family_member_count) {
    /*Set the scale for the x-axis */
    /* construct the x-scale */
    frequencyViewer.xScale = d3.scaleLinear()
        .domain([0, residue_frequencies.length])
        .range(frequencyViewer.range)
    ;

    frequencyViewer.yScale = d3.scaleLinear()
        .domain([0, family_member_count])
        .range([frequencyViewer.height * 0.4, 0])
    ;
  }


  /* Render the bars for each residue */
  function render_bars(residue_frequencies, selected_residues) {
    /* Add the bars to the viewer */
    let bar = frequencyViewer.svg
        .selectAll(".freq_bars")
        .data(residue_frequencies);

    // UPDATE: add new elements if needed
    bar
        .enter().append('g')
        .append('rect')
        /* Merge the old elements (if they exist) with the new data */
        .merge(bar)
        .attr("class", "freq_bars")
        .attr("width", frequencyViewer.bar_glyph_width)
        .attr("height", frequencyViewer.height * 0.4)
        .attr('y', function(d) { return frequencyViewer.height * 0.3 + frequencyViewer.barOffset } )
        .attr('x', function(d, i) { return frequencyViewer.xScale(i) })
        .style("fill", "white");

    /* Remove the unneeded bars */
    bar.exit().remove();

    /* Color the bars according to the frequency of the residue*/
    let frequency =
        frequencyViewer.svg.selectAll(".frequencies")
            .data(residue_frequencies);

    // UPDATE: add new elements if needed
    frequency
        .enter().append("rect")
        .attr("class", "frequencies")
        /* Merge the old elements (if they exist) with the new data */
        .merge(frequency)
        .attr('x', function(d, i) { return frequencyViewer.xScale(i) })
        .attr('y', function(d) { return frequencyViewer.yScale(d[1]) + frequencyViewer.height * 0.3 + frequencyViewer.barOffset} )
        .attr("width", frequencyViewer.bar_glyph_width)
        .attr("height", function(d) { return ( frequencyViewer.height * 0.4 - frequencyViewer.yScale(d[1]) )  })
        .attr("fill", function(d,i) { return (d[0] === selected_residues[i]) ?  "#43a2ca" : "#D3D3D3"; })
    ;

    /* Remove the unneeded frequency bars */
    frequency.exit().remove();
  }


  /* Render the line above the bars */
  function render_context_lines() {
    /* Add the context bar above viewers */
    let context = frequencyViewer.svg
        .selectAll(".context-bar").data(frequencyViewer.contextPoints)
        .enter().append("path")
        .attr("d", (d) => { return lineFunction(d)})
        .attr("class", "context-bar");
  }


  /* Render the pointer bar */
  function render_context_bars() {
    /* Add the context bar above viewers */
    let context = frequencyViewer.svg
        .selectAll(".context-line").data(frequencyViewer.contextBarPoints);

    context.enter().append("path")
        .merge(context)
        .attr("d", (d) => {return lineFunction(d)})
        .attr("class", "context-line");

    /* Remove the unneeded selection labels */
    context.exit().remove();
  }


  /* Render with the selected residues */
  function render(residue_frequencies, family_member_count, selected_residues, bar_position) {

    /* Get get width and height for each box*/
    frequencyViewer.bar_glyph_width = frequencyViewer.width / family_member_count - 5;

    set_scales(residue_frequencies, family_member_count);

    render_bars(residue_frequencies, selected_residues);
    render_labels(residue_frequencies);

    /* Add the residue text to the bars */
    update_current_selection_text_and_bar(selected_residues);

    if(frequencyViewer.id === "#leftResidueSummaryViewer"){
      frequencyViewer.contextBarPoints = [[{x: options.offset*2 + bar_position, y:0},
                                           {x: options.offset*2 + bar_position, y: 10}]];
    }
    else {
      frequencyViewer.contextBarPoints = [[{x: bar_position, y:0},
                                           {x: bar_position, y: 10}]];
    }
    render_context_bars();
  }


  function get_offset() { return options.offset };


  /* Initialize the frequency viewer */
  function initialize(div_id) {

    /* get the DOM element by the id parameter */
    frequencyViewer.id     = div_id;
    frequencyViewer.domObj = d3.select(div_id);

    /* get/save the width and height of the given DOM element */
    frequencyViewer.width = App.frequencyWidth;
    frequencyViewer.height = App.frequencyHeight;

    /* clear the frequency viewer DOM */
    frequencyViewer.domObj.selectAll().remove();

    /* Add the svg to the trend image dom*/
    frequencyViewer.svg = frequencyViewer.domObj
        .append("svg") //svg
        .style("width", frequencyViewer.width)
        .style("height", frequencyViewer.height)
    ;

    /* Store the range for each viewer*/
    if(frequencyViewer.id === "#leftResidueSummaryViewer"){
      frequencyViewer.range = [options.offset*2, frequencyViewer.width ];
      frequencyViewer.contextPoints = [ [{x: options.offset, y:10}, {x: frequencyViewer.width, y: 10}],
        [ {x: options.offset + 1, y: 10}, { x:options.offset + 1, y:20} ],
        [ {x: frequencyViewer.width - 1, y: 10}, { x:frequencyViewer.width - 1, y:20}] ];
    }
    else {
      frequencyViewer.range = [options.offset*2, frequencyViewer.width - options.offset*2];
      frequencyViewer.contextPoints = [ [{x: options.offset, y:10}, {x: frequencyViewer.width, y: 10}],
        [ {x: options.offset + 1, y: 10}, { x:options.offset + 1, y:20} ],
        [ {x: frequencyViewer.width -1, y: 10}, { x:frequencyViewer.width - 1, y:20}] ];
    }

    /* Render the context bars above the trend image*/
    frequencyViewer.barOffset = 5;
    render_context_lines();
  }


  return {
    init      : initialize,
    render    : render,
    getOffset : get_offset,
    update    : update_current_selection_text_and_bar
  };

};