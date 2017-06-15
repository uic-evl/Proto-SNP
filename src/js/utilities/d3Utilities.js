"use strict";

// Global Application variable
var App = App || {};

const d3Utils = function () {

  return {
    /* Clear the chart DOM of all elements */
    clear_chart_dom : function (domObj) {
      domObj.selectAll().remove();
    },

    create_chart_canvas : function(domObj, options) {
      let canvas = domObj
          .append('canvas')
          .attr("id", options.id)
          .attr("class", options.class)
          .attr("width", options.width)
          .attr("height", options.height)
      ;
      return canvas.node();
    },

    create_chart_svg : function(domObj, options) {
      return domObj.append("svg")
          .attr("width", options.width)
          .attr("height", options.height)
          .attr("class", options.class);
    },

    /* Simple d3 function to construct a line*/
    lineFunction : d3.line()
      .x(function (d) {
        return d.x;
      })
      .y(function (d) {
        return d.y;
      })
    ,

    /* Create the trend image brush SVG */
    create_brush_svg: function(domObj, options) {
      return domObj
          .append("svg")
          .attr("class", "trendImage")
          .attr("id", "trendSVG")
          .attr("width", options.width)
          .attr("height", options.height)
    },

    create_svg_overlay : function(domObj, width, height) {
      let overview = domObj
          .append('canvas')
          .attr("id", "trendCanvasOverview")
          .attr("width", width * 0.1)
          .attr("height", height);
      return overview.node().getContext('2d');
    },

    create_chart_back_buffer : function(options) {
      let backBufferCanvas = document.createElement('canvas');
      return d3.select(backBufferCanvas)
          .attr("width", options.width)
          .attr("height", options.height)
          .node();
    },

    /* Bind the data to a fake dom */
    bind_data : function(family, colorScale, size) {
      /* Fake DOM*/
      let customBase = document.createElement('custom'),
          custom = d3.select(customBase),
          /* Fake Rows */
          rows = custom.selectAll("custom")
              .data(family.sequences)
              .enter().append("custom")
              .attr("id", (d,idx) => { return "p" + family.names[idx];})
              .attr("class", "proteinRow"),

          /* Fake columns -- bind the data */
          elements = rows.selectAll('.cell')
              .data( (protein) => { return protein; } );

      /* Update: add new items as needed */
      elements
          .enter().append('custom')
          .attr("class", "cell")
          .merge(elements)
          .attr("x", (d,i,j) => { return i * size; })
          .attr("y", (d,i,j) => { return j * size; })
          .attr('width',  size)
          .attr('height', size)
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
    },

      /* Create a customized context menu per right-click */
  //   create_context_menu: function() {
  //
  //     /* Get the horizontal brush extent */
  //     let brush_selection = d3.brushSelection(this);
  //
  //     /* Get the name of the protein currently selected*/
  //     let selected_protein = brush_selection.map(trendImageViewer.yScale.invert)[0];
  //
  //     /* Return the customized context menu */
  //     return [
  //       {
  //         title: function() {return "Load Protein: " + selected_protein; },
  //         action: function() {
  //           App.applicationModel.processProteinRequest({position: "left", protein_name: selected_protein});
  //         },
  //         disabled: false // optional, defaults to false
  //       }
  //     ];
  // }

  }

}();