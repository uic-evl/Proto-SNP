"use strict";

// global application variable
var App = App || {};

// Protein / Molecule Viewer "Class"
const TrendImageController = function(options){

  /* Class private variable */
  let self = {
    currentHorizontalSelection : options.initHorizontalPosition,
    leftVerticalSelection      : options.initVerticalPosition.left,
    rightVerticalSelection     : options.initVerticalPosition.right
  };


  /* Get the position of the context line's pointer */
  function get_context_bar_position(currentPaddle, halfway) {
    let pointer_bar = 0;
    /* Get the position of the pointer bar */
    if(currentPaddle === "vertical-right") {
      pointer_bar = (d3.event.selection[0] + d3.event.selection[1] ) / 2.0 - options.trendImage.getXAxisScale()(halfway);
    }
    else {
      pointer_bar = (d3.event.selection[0] + d3.event.selection[1] )/2.0;
    }
    return pointer_bar;
  }




  return {
    horizontalBrushed   : horizontal_paddle_controller,
    verticalBrushed     : vertical_paddle_controller,
  }

};