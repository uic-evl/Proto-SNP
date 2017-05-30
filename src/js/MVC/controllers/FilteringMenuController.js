"use strict";

var App = App || {};

const FilteringMenuController = (function() {


  function FilteringMenuController(model, view) {
    this._model = model;
    this._view = view;

    let _this = this;

    this._view.listModified.attach(function (sender, args) {
      _this.updateSelected(args.index);
    });

  }

  FilteringMenuController.prototype = {

    updateSelected: function (index) {
      this._model.setSelectedIndex(index);
    }
  };

  return FilteringMenuController;
})();