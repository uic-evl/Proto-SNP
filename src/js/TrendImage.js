var App = App || {};

const TrendImage = (function(options) {

  /* Internal Instance Variable */
  let self = {
    model       : { render: function() {} },
    controller  : {}
  };

  /* Trend Image constructor*/
  let trend_image = function() { };

  /* Setup the initialization */
  trend_image.prototype = {
    constructor : trend_image,
    render      : self.model.render
  };

  // return the trend image
  return trend_image;
})();