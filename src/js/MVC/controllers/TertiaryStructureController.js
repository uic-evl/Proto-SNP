"use strict";

var App = App || {};

const TertiaryStructureController = (function() {

  function TertiaryStructureController(model, views) {
    this._model = model;
    this._views = views;

    let _this = this;

    /*  Bind the view with knockoutJS */
    ko.applyBindings({views: this._views}, $("#molecularViewers")[0]);

  }

  TertiaryStructureController.prototype = {

  };

  return TertiaryStructureController;
})();