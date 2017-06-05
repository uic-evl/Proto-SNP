"use strict";

var App = App || {};

const FilteringMenuView = (function() {

  function FilteringMenuView(model, elements) {
    let self = this;

    self._model = model;
    self._elements = elements;
    self.filters = ko.observableArray([]);

    self.selectionModified = new EventNotification(this);

    /* Create the click listener */
    self.elementSelected = function(obj, e) {
      self.selectionModified.notify({ element : obj.filter });
    };
  }

  FilteringMenuView.prototype = {
    show : function () {
      this.rebuildList();
    },

    rebuildList : function () {
      let items, key;

      items = this._model.getItems();
      for (key in items) {
        this.filters.push({filter : items[key] });
      }
      /* Set the initial item */
      this._model.setSelectedElement(items[0]);
    }
  };

  return FilteringMenuView;

})();