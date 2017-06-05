"use strict";

// global application variable
var App = App || {};

// Protein / Molecule trendImageViewer "Class"
const TrendImageViewer = function(options){

  /* Initialized the frequency viewers */
  function initialize_frequency_viewers() {

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

  /*******************************************************************************************************************/
  /************                         Instance Accessors (Getters and Setters)                          ************/
  /*******************************************************************************************************************/

  /************ Setters ************/

  /* Getter for the x-Axis scale */
  function get_x_axis_scale() { return trendImageViewer.xScale; }


  /* Getter for the y-Axis scale */
  function get_y_axis_scale() { return trendImageViewer.yScale; }


  /* Getter for the y-dimension size */
  function get_y_dimension_size() { return trendImageViewer.y_axis_length; }

  };

};