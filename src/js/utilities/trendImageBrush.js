"use strict";

// global application variable
var App = App || {};

/* Setup some constants to specify the paddle orientation */
App.HORIZONTAL_PADDLE = 1;
App.VERTICAL_PADDLE   = 2;

(function() {

  /* Generic Brush Class */
  let Brush = function()
  {
    var self = {};
    /* Set the brush extent */
    function set_brush_extent(ext) {
      this.brush.extent(ext);
      return this;
    }

    /* Set the brush paddle size */
    function set_brush_paddle_size(size) {
      self.paddleSize = size;
      return this
    }

    /* Set the brushing callback */
    function set_brushing_callback(cb) {
      this.brush.on("brush", cb);
      return this;
    }

    /* Set the brushing callback */
    function set_on_end_callback(cb) {
      this.brush.on("end", cb);
      return this;
    }

    /* Set the frequency viewer that corresponds to the brush  */
    function set_frequency_viewer_pointer(frequencyViewer) {
      self.frequency_viewer = frequencyViewer;
      return this;
    }

    /* Get the frequency viewer controlled by this brush */
    function get_frequency_viewer() { return self.frequency_viewer; }

    /* Get the brush paddle size */
    function get_brush_paddle_size() { return this.paddleSize; }

    return {
      setPaddleExtent    : set_brush_extent,
      setPaddleSize      : set_brush_paddle_size,
      setFrequencyViewer : set_frequency_viewer_pointer,
      getPaddleSize      : get_brush_paddle_size,
      getFrequencyViewer : get_frequency_viewer,
      onBrush            : set_brushing_callback,
      onEnd              : set_on_end_callback
    }
  };

  /* Vertical Brush Class */
  function VerticalPaddle() {
    /* Set the brush instance */
    this.brush = d3.brushX();
  }

  /* Horizontal Brush Class */
  function HorizontalPaddle() {
    /* Set the brush instance */
    this.brush = d3.brushY();
  }

  /* Factory Class for the Trend Image Brushes */
  App.TrendImageBrushFactory =  {

    /* Create the trend image paddles*/
    createBrush: function(orientation) {

      /* Check the orientation */
      if(orientation === App.HORIZONTAL_PADDLE) {
        return _.assign( {}, new HorizontalPaddle, new Brush );
      }
      else if(orientation === App.VERTICAL_PADDLE) {
        return _.assign( {}, new VerticalPaddle, new Brush );
      }

    }

  };

})();

