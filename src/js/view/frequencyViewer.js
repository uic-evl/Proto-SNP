"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
const FrequencyViewer = function(){

  /* Class private variable */
  let frequencyViewer = {};

  function initialize(div_id) {

    /* get the DOM element by the id parameter */
    frequencyViewer.id     = div_id;
    frequencyViewer.domObj = d3.select(div_id);

    /* get/save the width and height of the given DOM element */
    frequencyViewer.width = App.frequencyWidth;
    frequencyViewer.height = App.frequencyHeight * 0.95;

    /* clear the frequency viewer DOM */
    frequencyViewer.domObj.selectAll().remove();

    /* Add the svg to the trend image dom*/
    frequencyViewer.svg = frequencyViewer.domObj
      .append("svg") //svg
      .style("width", frequencyViewer.width)
      .style("height", frequencyViewer.height)
    ;
  }

  /* Update the text with the current selection */
  function update_current_selection_text (selected_residues) {

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
      .attr("y", frequencyViewer.height * 0.1 )
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

  function render(residue_frequencies, family_member_count, selected_residues) {

    /* Get get width and height for each box*/
    frequencyViewer.bar_glyph_width = frequencyViewer.width / family_member_count - 5;

    /*Set the scale for the x-axis */
    /* construct the x-scale */
    frequencyViewer.xScale = d3.scaleLinear()
        .domain([0, residue_frequencies.length])
        .range([0, frequencyViewer.width])
      ;

    frequencyViewer.yScale = d3.scaleLinear()
        .domain([0, family_member_count])
        .range([frequencyViewer.height * 0.6, 0])
      ;

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
      .attr("height", frequencyViewer.height * 0.6)
      .attr('y', function(d) { return frequencyViewer.height * 0.2 } )
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
      .attr('y', function(d) { return frequencyViewer.yScale(d[1]) + frequencyViewer.height * 0.2 } )
      .attr("width", frequencyViewer.bar_glyph_width)
      .attr("height", function(d) { return ( frequencyViewer.height * 0.6 - frequencyViewer.yScale(d[1]) )  })
      .attr("fill", function(d,i) { return (d[0] === selected_residues[i]) ?  "#43a2ca" : "#D3D3D3"; })
    ;

    /* Remove the unneeded frequency bars */
    frequency.exit().remove();

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
      .attr("y", frequencyViewer.height * 0.9 )
      .attr("dy", ".35em")
      .text(function(d){ return d[0] })
      .style("text-anchor", "middle")
      .style("font-weight", "bold")
    ;

    /* Remove the unneeded frequency labels */
    frequencyText.exit().remove();

    /* Add the residue text to the bars */
    update_current_selection_text(selected_residues);
  }

  return {
    init   : initialize,
    render : render,
    update : update_current_selection_text
  };

};