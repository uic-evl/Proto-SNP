"use strict";

var App = App || {};

const BrushView = (function() {

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
    //initialize_frequency_viewers();
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


  function clamp_brush_sizes(currentVerticalSelection, prevPaddleSelection) {
    let brush_size = Math.abs(currentVerticalSelection[1] - currentVerticalSelection[0]);
    /* Our max brush size is 10*/
    if( brush_size > options.brushMaxSize){
      /* Check which side was brushed */
      if(currentVerticalSelection[0] === prevPaddleSelection[0]){
        currentVerticalSelection[1] = currentVerticalSelection[0] + options.brushMaxSize;
      }
      else {
        currentVerticalSelection[0] = currentVerticalSelection[1] - options.brushMaxSize;
      }
    }
    else if (brush_size < options.brushMinSize) {
      /* Check which side was brushed */
      if (currentVerticalSelection[0] === prevPaddleSelection[0]) {
        currentVerticalSelection[1] = currentVerticalSelection[0] + options.brushMinSize;
      }
      else {
        currentVerticalSelection[0] = currentVerticalSelection[1] - options.brushMinSize;
      }
    }
    return currentVerticalSelection;
  }


  function BrushView(model, options) {

    let self = this;

    self._model = model;
    let block_size = options.block_size;

    /* Initialize the d3 brush */
    self.initialize(options);

    /* Brush event handlers */
    self.brushMoved = new EventNotification(this);

    /* Bind the event listens */
    self._model.selectedProteinChanged.attach(function(sender, msg) {
      self.redraw(msg.selection);
    });

    self.onBrush = function() {
      /* We only want to capture user events. */
      if (!d3.event.sourceEvent) return;
      if (!d3.event.selection) return; // Ignore empty selections.
      if (d3.event.sourceEvent.type === "brush") return; // if the event isn't associated with a mouse move

      if(options.orientation === App.HORIZONTAL_PADDLE) {
        // Round the two event extents to the nearest row
        d3.event.selection[0] = Math.floor(d3.event.selection[0] / block_size) * block_size;
        d3.event.selection[1] = Math.floor(d3.event.selection[1] / block_size) * block_size;

        // Snap the brush onto the closest protein
        d3.select(this).call(d3.event.target.move, d3.event.selection);
      }
      else {
        // Round the two event extents to the nearest row
        d3.event.selection[0] = parseInt(Math.round(d3.event.selection[0]/block_size)*block_size);
        d3.event.selection[1] = parseInt(Math.round(d3.event.selection[1]/block_size)*block_size);
      }
      /* Notify the listeners of the move */
      self.brushMoved.notify({orientation: options.orientation, selection:d3.event.selection});
    };

  }

  BrushView.prototype = {

    initialize: function(options) {
      let view = this;
      /* Construct the brush based on the orientation */
      view.brushObj =
          App.BrushFactory.createBrush(options.orientation)
              .setPaddleSize(options.paddleSize)
              .setBrushClass(options.class)
              .setPaddleExtent(options.extent)
              .setInitialPosition(options.position)
              .onBrush(function(){ view.onBrush.call(this)} );
    },

    getInitialPosition : function() { return this.brushObj.getInitialPosition(); },

    getBrush: function() { return this.brushObj.brush; },

    render: function(brushObj) {
      /* Remove the pointer events from the brush overlays to prevent:
       * 1: Deleting the brush on a wrong click
       * 2: Interference between brushes
       */
      brushObj.selectAll('.overlay')
          .style("pointer-events", "none");
      /* Let d3 decide the best rendering for the brushes */
      brushObj.selectAll('.selection')
          .style("shape-rendering", "auto");
      /* Set the context menu of the vertical brush */
      // this.brush.select("g.brush.horizontal")
      //     .on("contextmenu", d3.contextMenu(create_context_menu));

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
  },

    redraw: function(selection) {
      /* Reset the opacity of unselected rows */
      d3.selectAll('rect.active_protein_selection')
          .classed("active_protein_selection", false);

      /* Set the opacity of the highlighted row */
      d3.selectAll('#p' + selection + " > rect")
          .classed("active_protein_selection", true);
    }

  };

  return BrushView;

})();
