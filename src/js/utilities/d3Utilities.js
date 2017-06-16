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
          .attr("transform", "translate(" + (options.x)?options.x:0 +","+ (options.y)?options.y:0 +")");
      return canvas.node();
    },

    create_chart_svg : function(domObj, options) {
      return domObj.append("svg")
          .attr("width", options.width)
          .attr("height", options.height)
          .attr("class", options.class)
          .attr("transform", "translate(" + (options.x)?options.x:0 +","+ (options.y)?options.y:0 +")");
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
          .attr("transform", "translate(" + (options.x)?options.x:0 +","+ (options.y)?options.y:0 +")");
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

    /* Render the line above the bars */
    render_context_lines : function(context, points) {
    /* Add the context bar above viewers */
      if(context.node && context.node().nodeName === "svg"){
      return context.selectAll(".context-bar").data(points)
          .enter().append("path")
          .attr("d", (d) => { return d3Utils.lineFunction(d)})
          .attr("class", "context-bar");
    }
    else {
        points.forEach(function(point){
          context.beginPath();
          context.moveTo(point[0].x, point[0].y);
          context.lineTo(point[1].x, point[1].y);
          context.strokeStyle = "#000000";
          context.closePath();
          // Make the line visible
          context.stroke();
      });
    }
  },

    /* Render the pointer bar */
    render_context_bars : function(svg, render_options) {
    /* Add the bars to the viewer */
    let bar = svg
        .selectAll(".context-line")
        .data([render_options]);

    // UPDATE: add new elements if needed
    bar
        .enter().append('g')
        .append('rect')
        /* Merge the old elements (if they exist) with the new data */
        .merge(bar)
        .attr("class", "context-line")
        .attr("width", render_options.width)
        .attr("height", render_options.height)
        .attr('y', render_options.y)
        .attr('x', render_options.x)
        .style("fill", "black");

    /* Remove the unneeded bars */
    bar.exit().remove();
  }

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