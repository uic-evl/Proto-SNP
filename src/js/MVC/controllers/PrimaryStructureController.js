"use strict";

var App = App || {};

const PrimaryStructureController = (function() {

  function PrimaryStructureController(model, views) {
    this._model = model;
    this._views = views;

    let _this = this;

    /*  Bind the view with knockoutJS */
    ko.applyBindings({views: this._views}, $("#sequenceViewers")[0]);

  }

  PrimaryStructureController.prototype = {

  };

  return PrimaryStructureController;
})();