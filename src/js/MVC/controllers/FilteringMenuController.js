"use strict";

var App = App || {};

const FilteringMenuController = (function() {

  function FilteringMenuController(model, view) {
    let _this = this;

    _this._model = model;
    _this._view = view;


    this._view.selectionModified.attach(function (sender, args) {
      _this.updateSelected(args.element);
    });

    /*  Bind the view with knockoutJS */
    ko.applyBindings(_this._view, _this._view._elements.list[0]);

  }

  FilteringMenuController.prototype = {

    updateSelected: function (element) {
      this._model.setSelectedElement(element);
    }
  };

  return FilteringMenuController;
})();