"use strict";

var App = App || {};

const BrushView = (function() {

  function BrushView(model, options) {
    /* Save a reference to this */
    let self = this;

    self._model = model;
    self._scale = options.scale || null;
    self._orientation = options.orientation;
    self._tooltip = null;

    let block_size = options.block_size;

    /* set the initial selections */
    if(self._orientation === App.OVERVIEW_PADDLE){
      self._selection = options.position;
    }
    else {
      self._selection = [0,0];
    }

    /* Initialize the d3 brush */
    self.initialize(options);
    /* Brush event handlers */
    self.brushMoved = new EventNotification(this);

    /* Bind the event listens */
    self._model.selectedProteinChanged.attach(function(sender, msg) {
      // TODO Update overlays that make everything else opaque
      //self.redraw(msg.selection);
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

      /* store the selection*/
      self._selection = d3.event.selection;

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

      /* Add a tooltip if specified */
      if(options.tooltip){
        view._tooltip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(options.tooltip);
      }

    },

    getInitialPosition : function() { return this.brushObj.getInitialPosition(); },

    getBrush: function() { return this.brushObj.brush; },

    getSelection: function() { return this._selection },

    setSelection: function(selection) { this._selection = selection; },

    getScale: function() { return this._scale },

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

      /* add the context menu for the horizontal bar*/
      if(this._orientation === App.HORIZONTAL_PADDLE) {
        /* Set the context menu of the horizontal brush */
        brushObj.select("rect.selection")
          .on("contextmenu", d3.contextMenu(d3Utils.create_context_menu.bind(null,this._model)));
      }
      /* Add the tooltip if one was created */
      if(this._tooltip){
        brushObj.call(this._tooltip);
        brushObj.select('rect.selection')
          .on('mouseover', this._tooltip.show)
          .on('mouseout', this._tooltip.hide);
      }
   },
  };

  return BrushView;

})();
