"use strict";

var App = App || {};

const FilteringMenuController = (function() {

  function mapSortingLabel(label) {
    switch(label){
      case 'Initial Ordering':
      default:
        return "default";
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
    }
  }

  function FilteringMenuController(options) {
    let self = this;

    self._menuDescription = options.menu;

    /* Connected models  */
    self._model          = options.models.list;
    self._familyModel    = options.models.family;
    self._tertiaryModels = options.models.tertiary;

    self._view = options.view;

    this._view.selectionModified.attach(function (sender, args) {
      self.updateSelected(args.element);
    });

    /*  Bind the view with knockoutJS */
    ko.applyBindings(self._view, self._view._elements.list[0]);
  }

  FilteringMenuController.prototype = {

    updateSelected: function (element) {
      /* Update the list models */
      this._model.setSelectedElement(element);

      /* Update the connected models */
      if(this._menuDescription === "coloring"){
        this._familyModel.setProteinColoring(element);
        this._tertiaryModels.forEach(function(model){
          model.setProteinColoring(element);
        });
        /* Create the legend */
        App.residueMappingUtility.createColorLegend();
      }
      else if (this._menuDescription === "sorting"){
        this._familyModel.setProteinSorting(mapSortingLabel(element));
      }

    }
  };

  return FilteringMenuController;
})();