"use strict";

var App = App || {};

const TrendImageView = (function() {

  function TrendImageView(model) {
    this._model = model;
  }

  TrendImageView.prototype = View.prototype;

  return TrendImageView;

})();
