"use strict";

var App = App || {};

const BrushView = (function() {

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

  /* Get the new selection */
  function snap_brush(selection) {
    /* determine the halfway point */
    let halfway = Math.ceil(options.width/2.0) ;

    /* Keep track of the current selection */
    if(options.semantic === "right"){
      /* Check if paddle is past the half way mark of the trend image*/
      if(selection[0] < halfway){
        selection[0] = halfway;
        selection[1] = self.rightVerticalSelection[1];
      }
      /* Clamp the brush size */
      selection = clamp_brush_sizes(selection, self.rightVerticalSelection);

      /* Reset the event selection */
      d3.event.selection = selection.map(options.trendImage.getXAxisScale());
    }
    else {
      /* Check if paddle is past the half way mark of the trend image*/
      if(selection[1] > halfway+1){
        selection[1] = halfway+1;
        selection[0] = self.leftVerticalSelection[0];
      }
      /* Clamp the brush size */
      selection = clamp_brush_sizes(selection, self.leftVerticalSelection);

      /* Reset the event selection */
      d3.event.selection = selection.map(options.trendImage.getXAxisScale());
    }
    return selection;
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
      // TODO Update overlays that make everything else opaque
      self.redraw(msg.selection);
    });

    self._model.selectedResiduesChanged.attach(function(sender, msg){
      // TODO Update overlays that make everything else opaque
      // self.redraw(msg.selection);
    });

    /* Utility to clamp the brush sizes */
    function clamp_brush_sizes(selection, previousSelection) {
      let brush_size = Math.abs(selection[1] - selection[0]),
          maxPaddleSize = options.maxPaddleSize * block_size,
          minPaddleSize = options.paddleSize * block_size;

      if( brush_size > maxPaddleSize){
        /* Check which side was brushed */
        if(selection[0] === previousSelection[0]){
          selection[1] = selection[0] + maxPaddleSize;
        }
        else {
          selection[0] = selection[1] - maxPaddleSize;
        }
      }
      else if (brush_size < minPaddleSize) {
        /* Check which side was brushed */
        if (selection[0] === previousSelection[0]) {
          selection[1] = selection[0] + minPaddleSize;
        }
        else {
          selection[0] = selection[1] - minPaddleSize;
        }
      }
      return selection;
    }

    /* onBrushEnd Callback */
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
      else if(options.orientation === App.VERTICAL_PADDLE){
        // Round the two event extents to the nearest row
        d3.event.selection[0] = parseInt(Math.round(d3.event.selection[0]/block_size)*block_size);
        d3.event.selection[1] = parseInt(Math.round(d3.event.selection[1]/block_size)*block_size);

        // clamp the paddle to the min/max size
        clamp_brush_sizes(d3.event.selection, self._model.getSelectedResidues(options.semantic).previous);

        /* Programatically move to the clamp*/
        d3.select(this).call(d3.event.target.move, d3.event.selection)
      }
      else {
        d3.event.selection[0] = Math.round(d3.event.selection[0] / block_size) * block_size;
        d3.event.selection[1] = Math.round(d3.event.selection[1] / block_size) * block_size;
        // Snap the brush onto the closest protein
        d3.select(this).call(d3.event.target.move, d3.event.selection);
      }

      /* Notify the listeners */
      self.brushMoved.notify({options: options, selection:d3.event.selection});
    };
  }

  BrushView.prototype = {

    initialize: function(options) {
      let view = this;
      /* Construct the brush based on the orientation */
      view.brushObj =
          App.BrushFactory.createBrush(options.orientation)
              .setPaddleSize(options.paddleSize)
              .setMaxPaddleSize(options.maxPaddleSize)
              .setBrushClass(options.class)
              .setPaddleExtent(options.extent)
              .setInitialPosition(options.position)
              .onBrush(function(){ view.onBrush.call(this)} );
    },

    getInitialPosition : function() { return this.brushObj.getInitialPosition(); },

    getBrush: function() { return this.brushObj.brush; },

    getBrushElement: function() { return document.getElementsByClassName(this.brushObj.getBrushClass())[0]; },

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
  },

    redraw: function(selection) {
      /* Reset the opacity of unselected rows */
      // d3.selectAll('rect.active_protein_selection')
      //     .classed("active_protein_selection", false);
      //
      // /* Set the opacity of the highlighted row */
      // d3.selectAll('#p' + selection + " > rect")
      //     .classed("active_protein_selection", true);
    }

  };

  return BrushView;

})();
