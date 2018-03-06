"use strict";

// Global Application variable
var App = App || {};

const utils = function () {

  return {
    getComputedStyleValue : function(el, styling) {
        let style = el.currentStyle || window.getComputedStyle(el),
            pixels = parseFloat(style[styling],10);
        return (pixels) ? pixels : style[styling];
    }
  }

}();