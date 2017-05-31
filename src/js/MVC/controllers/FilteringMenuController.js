"use strict";

var App = App || {};

const FilteringMenuController = (function() {


  function FilteringMenuController(model, view) {
    this._model = model;
    this._view = view;

    let _this = this;

    this._view.selectionModified.attach(function (sender, args) {
      _this.updateSelected(args.element);
    });
  }

  FilteringMenuController.prototype = {

    updateSelected: function (element) {
      this._model.setSelectedElement(element);
    }
  };

  return FilteringMenuController;
})();