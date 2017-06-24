"use strict";

var App = App || {};

const PrimaryStructureView = (function() {

  function PrimaryStructureView(model, element) {

    this._model = model;
    this._id = element.id;
    this._position = element.position;
    this._dom = null;

  }

  PrimaryStructureView.prototype = {
    show : function () {

    }

  };

  return PrimaryStructureView;

})();