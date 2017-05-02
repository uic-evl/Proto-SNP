"use strict";

var App = App || {};

const TrendImageController = (function() {


  function TrendImageController(model, trendImageView, brushView, residueFreqView) {

    this._model = model;
    this._trendView = trendImageView;
    this._brushView = brushView;
    this._residueFreq = residueFreqView;


  }

  TrendImageController.prototype = {



  };

  return TrendImageController;
})();