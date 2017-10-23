"use strict";

var App = App || {};

const FilteringMenuController = (function() {

  function mapLabel(label) {
    switch(label){
      case 'Initial Ordering':
        return "initial";
        break;
      case 'Residue Frequency':
        return "edit_distance";
        break;
      case 'Weighted Edit Distance':
        return "weighted_edit_distance";
        break;
      case 'Residue Commonality with':
        return "commonality_scores";
        break;
      case 'Normalized Residue Commonality with':
        return "normalized_commonality_scores";
        break;
      default:
        return label;
    }
  }

  function FilteringMenuController(options) {
    let self = this;
    self._menuDescription = options.menu;
    self._model     = options.models.list;
    /* Connected models  */
    self._connected_models = options.models.connected;
    /* List View */
    self._view = options.view;
    /* Callback to launch on selection*/
    self._cb = options.cb;

    /* Selection Events */
    self._view.selectionModified.attach(function (sender, args) {
      self.updateSelected(args.element);
    });
    /*  Bind the view with knockoutJS */
    ko.applyBindings(self._view, self._view._elements.list[0]);
  }

  FilteringMenuController.prototype = {
    updateSelected: function (element) {
      let self = this;
      /* Update the list models */
      this._model.setSelectedElement(element);
      /* Update the connected models */
      this._connected_models.forEach(function(model) {
        self._cb(model, mapLabel(element));
      });
    }
  };
  return FilteringMenuController;
})();