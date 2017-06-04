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

    let self = {};

    /* Move the brush to a specified position */
    function move_brush(pos) {
      /* Get the DOM element */
      let brush = d3.select(document.getElementsByClassName(this.brush_class)[0]);
      /* Move the brush */
      brush
          .transition().duration(1000)
          .call(this.brush.move, pos);
      return this;
    }

    function set_initial_position(pos) {
      console.log(pos);
      self.initial_position = pos;
      return this;
    }

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

    /* Brush class name */
    function set_brush_class(brushClassName) {
      self.brush_class = brushClassName;
      return this;
    }

    function get_initial_position() {
      return self.initial_position;
    }

    function get_brush_class() {
      return self.brush_class
    }

    /* Get the frequency viewer controlled by this brush */
    function get_frequency_viewer() { return self.frequency_viewer; }

    /* Get the brush paddle size */
    function get_brush_paddle_size() { return self.paddleSize; }

    /* Get the brush selection */
    function get_current_selection() {
      /* Get the DOM element */
      let brush = document.getElementsByClassName(self.brush_class)[0];
      /* Return the selection of the brush */
      return d3.brushSelection(brush)
    }

    return {
      setInitialPosition  : set_initial_position,
      setPaddleExtent     : set_brush_extent,
      setPaddleSize       : set_brush_paddle_size,
      setFrequencyViewer  : set_frequency_viewer_pointer,
      setBrushClass       : set_brush_class,
      getPaddleSize       : get_brush_paddle_size,
      getInitialPosition  : get_initial_position,
      getBrushClass       : get_brush_class,
      getFrequencyViewer  : get_frequency_viewer,
      getCurrentSelection : get_current_selection,
      moveBrush           : move_brush,
      onBrush             : set_brushing_callback,
      onEnd               : set_on_end_callback
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
  App.BrushFactory =  {

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

